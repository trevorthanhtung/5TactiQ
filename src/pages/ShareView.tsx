import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { Stage, Layer, Rect, Circle, Text, Line, Group, Path, Image as KonvaImage, Arrow } from 'react-konva';
import { 
  Home,
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  RotateCcw, 
  Users, 
  Eye, 
  X,
  Share2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchSharedPayload, type SharedPayload, type SharedStatsPayload, type SharedTacticsPayload, type SharedPlayerStat } from '../services/shareService';
import { subscribeToLiveTactics } from '../services/liveTacticsService';
import { useTacticStore, type ActiveBoardState } from '../store/useTacticStore';
import { BottomSheet } from '../components/ui/BottomSheet';
import { CustomSelect } from '../components/CustomSelect';
import { compareVietnameseNames } from '../utils/sortUtils';

export default function ShareView() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [payload, setPayload] = useState<SharedPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stats view state
  type StatTab = 'goals' | 'assists' | 'attendance' | 'rating';
  const [activeStatsTab, setActiveStatsTab] = useState<StatTab>('goals');
  const [filterMode, setFilterMode] = useState<'current_season' | 'all_time'>('current_season');
  const [showAllZeroStats, setShowAllZeroStats] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<SharedPlayerStat | null>(null);

  // Tactics view state
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackPositions, setPlaybackPositions] = useState<any[] | null>(null);
  const playAnimRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, isLandscape: false });

  // Load ball image for Konva
  const [ballImage, setBallImage] = useState<HTMLImageElement | undefined>(undefined);
  useEffect(() => {
    const img = new window.Image();
    img.src = './ball.png';
    img.onload = () => setBallImage(img);
  }, []);

  // Parse payload from URL (query or hash)
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        // First check standard searchParams
        let loaded = await fetchSharedPayload(searchParams);

        // If not found, check window.location.hash (e.g. #/share?d=...)
        if (!loaded && window.location.hash.includes('?')) {
          const hashQuery = window.location.hash.split('?')[1];
          if (hashQuery) {
            const hashParams = new URLSearchParams(hashQuery);
            loaded = await fetchSharedPayload(hashParams);
          }
        }

        if (loaded) {
          setPayload(loaded);
        } else {
          setErrorMsg(t('share.not_found_msg', 'Liên kết chia sẻ không hợp lệ hoặc dữ liệu đã hết hạn.'));
        }
      } catch (err) {
        console.error('[ShareView] Error parsing payload:', err);
        setErrorMsg(t('share.load_error', 'Không thể tải dữ liệu chia sẻ. Vui lòng thử lại sau.'));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [location.search, location.hash, searchParams, t]);

  // Real-time live synchronization with Tactics board
  const [liveBoardData, setLiveBoardData] = useState<ActiveBoardState | null>(null);

  useEffect(() => {
    // Check initial activeBoard from local store if in same browser
    const currentActive = useTacticStore.getState().activeBoard;
    if (currentActive && currentActive.positions && currentActive.positions.length > 0) {
      setLiveBoardData(currentActive);
    }

    // Subscribe to live tactical broadcasts (BroadcastChannel + storage + Supabase Realtime)
    const unsubscribe = subscribeToLiveTactics((incomingBoard) => {
      setLiveBoardData(incomingBoard);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Responsive dimensions for Tactics Canvas (exact 2:1 futsal pitch)
  useEffect(() => {
    if (isLoading || payload?.type !== 'tactics') return;

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const entry = entries[0];
      const containerWidth = entry.contentRect.width;
      const containerHeight = entry.contentRect.height;

      if (containerWidth <= 0 || containerHeight <= 0) return;

      const isLandscape = containerWidth >= containerHeight;
      const COURT_RATIO = 2; // 40m x 20m = 2:1
      let width = containerWidth;
      let height = containerHeight;

      if (isLandscape) {
        if (containerWidth / containerHeight >= COURT_RATIO) {
          height = containerHeight;
          width = height * COURT_RATIO;
        } else {
          width = containerWidth;
          height = width / COURT_RATIO;
        }
      } else {
        if (containerHeight / containerWidth >= COURT_RATIO) {
          width = containerWidth;
          height = width * COURT_RATIO;
        } else {
          height = containerHeight;
          width = height / COURT_RATIO;
        }
      }

      width = Math.floor(width);
      height = Math.floor(height);

      if (isLandscape) {
        if (width % 2 !== 0) width -= 1;
        height = width / 2;
      } else {
        if (height % 2 !== 0) height -= 1;
        width = height / 2;
      }

      setDimensions({
        width,
        height,
        isLandscape
      });
    });

    if (boardContainerRef.current) {
      observer.observe(boardContainerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, payload?.type]);

  const tacticsPayload = payload?.type === 'tactics' ? (payload as SharedTacticsPayload) : null;

  // Resolve whether we are showing live tactics stream or shared snapshot
  const activeTacticsSource = useMemo(() => {
    if (liveBoardData && liveBoardData.positions && liveBoardData.positions.length > 0) {
      const activeIdx = liveBoardData.currentFrameIndex ?? 0;
      const baseFrames = (liveBoardData.frames && liveBoardData.frames.length > 0)
        ? liveBoardData.frames
        : [{ id: 'frame-1', positions: liveBoardData.positions, lines: liveBoardData.lines || [] }];

      // CRITICAL: Always ensure the active frame uses the live positions and lines
      const syncedFrames = baseFrames.map((f, idx) => {
        if (idx === activeIdx) {
          return {
            ...f,
            positions: liveBoardData.positions,
            lines: liveBoardData.lines ?? f.lines ?? []
          };
        }
        return f;
      });

      return {
        isLive: true,
        frames: syncedFrames,
        currentFrameIndex: activeIdx,
        boardDimensions: liveBoardData.dimensions
      };
    }

    return {
      isLive: false,
      frames: tacticsPayload?.frames || [],
      currentFrameIndex: 0,
      boardDimensions: tacticsPayload?.boardDimensions
    };
  }, [liveBoardData, tacticsPayload]);

  // Synchronize current frame when in live stream mode
  useEffect(() => {
    if (activeTacticsSource.isLive && liveBoardData?.currentFrameIndex !== undefined) {
      setCurrentFrameIdx(liveBoardData.currentFrameIndex);
    }
  }, [activeTacticsSource.isLive, liveBoardData?.currentFrameIndex]);

  // Default 1-2-1 formation fallback with BOTH home (red) and opponent (blue) players
  const defaultFormationPositions = useMemo(() => {
    if (dimensions.width === 0) return [];
    const PAD_X = dimensions.isLandscape ? 16 : 8;
    const PAD_Y = dimensions.isLandscape ? 8 : 16;
    const courtW = dimensions.width - 2 * PAD_X;
    const courtH = dimensions.height - 2 * PAD_Y;
    const l = dimensions.isLandscape;
    const getPos = (rx: number, ry: number) => {
      if (l) return { x: PAD_X + (1 - ry) * courtW, y: PAD_Y + rx * courtH };
      return { x: PAD_X + rx * courtW, y: PAD_Y + ry * courtH };
    };
    return [
      // 🔴 Home Team (Red)
      { id: 'home-gk', label: 'GK', ...getPos(0.5, 0.92) },
      { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.72) },
      { id: 'home-ala1', label: 'ALA', ...getPos(0.2, 0.5) },
      { id: 'home-ala2', label: 'ALA', ...getPos(0.8, 0.5) },
      { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.28) },
      { id: 'ball', isBall: true, ...getPos(0.5, 0.5) },
      // 🔵 Opponent Team (Blue)
      { id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.08) },
      { id: 'away-1', isEnemy: true, ...getPos(0.5, 0.22) },
      { id: 'away-2', isEnemy: true, ...getPos(0.2, 0.32) },
      { id: 'away-3', isEnemy: true, ...getPos(0.8, 0.32) },
      { id: 'away-4', isEnemy: true, ...getPos(0.5, 0.38) }
    ];
  }, [dimensions]);

  const displayFrames = useMemo(() => {
    const rawFrames = activeTacticsSource.frames;
    if (!rawFrames || rawFrames.length === 0) {
      return [{ id: 'frame-1', positions: defaultFormationPositions, lines: [] }];
    }

    if (dimensions.width === 0 || dimensions.height === 0) {
      return rawFrames;
    }

    const PAD_X = dimensions.isLandscape ? 16 : 8;
    const PAD_Y = dimensions.isLandscape ? 8 : 16;
    const courtW = dimensions.width - 2 * PAD_X;
    const courtH = dimensions.height - 2 * PAD_Y;

    // Determine the source coordinate space
    let sourceW = activeTacticsSource.boardDimensions?.width;
    let sourceH = activeTacticsSource.boardDimensions?.height;
    let sourceLandscape = activeTacticsSource.boardDimensions?.isLandscape;

    // If source board dimensions were not explicitly attached, infer from positions
    if (!sourceW || !sourceH) {
      let maxX = 0;
      let maxY = 0;
      rawFrames.forEach((f) => {
        (f.positions || []).forEach((p) => {
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        });
        (f.lines || []).forEach((l) => {
          for (let i = 0; i < (l.points || []).length; i += 2) {
            if (l.points[i] > maxX) maxX = l.points[i];
            if (l.points[i + 1] > maxY) maxY = l.points[i + 1];
          }
        });
      });

      sourceLandscape = maxX >= maxY;
      if (sourceLandscape) {
        sourceW = Math.max(maxX * 1.05, 800);
        sourceH = sourceW / 2;
      } else {
        sourceW = Math.max(maxX * 1.05, 400);
        sourceH = sourceW * 2;
      }
    }

    const isOrientChange = sourceLandscape !== dimensions.isLandscape;

    return rawFrames.map((f, idx) => {
      const origPositions = f.positions && f.positions.length > 0 ? f.positions : defaultFormationPositions;
      const scaledPositions = origPositions.map((p: any) => {
        const normX = Math.max(0, Math.min(1, p.x / sourceW!));
        const normY = Math.max(0, Math.min(1, p.y / sourceH!));

        if (isOrientChange) {
          if (dimensions.isLandscape) {
            return {
              ...p,
              x: PAD_X + (1 - normY) * courtW,
              y: PAD_Y + normX * courtH
            };
          } else {
            return {
              ...p,
              x: PAD_X + normY * courtW,
              y: PAD_Y + (1 - normX) * courtH
            };
          }
        } else {
          return {
            ...p,
            x: PAD_X + normX * courtW,
            y: PAD_Y + normY * courtH
          };
        }
      });

      const scaledLines = (f.lines || []).map((line: any) => {
        const newPoints: number[] = [];
        for (let i = 0; i < (line.points || []).length; i += 2) {
          const normX = Math.max(0, Math.min(1, line.points[i] / sourceW!));
          const normY = Math.max(0, Math.min(1, line.points[i + 1] / sourceH!));

          if (isOrientChange) {
            if (dimensions.isLandscape) {
              newPoints.push(PAD_X + (1 - normY) * courtW);
              newPoints.push(PAD_Y + normX * courtH);
            } else {
              newPoints.push(PAD_X + normY * courtW);
              newPoints.push(PAD_Y + (1 - normX) * courtH);
            }
          } else {
            newPoints.push(PAD_X + normX * courtW);
            newPoints.push(PAD_Y + normY * courtH);
          }
        }
        return { ...line, points: newPoints };
      });

      return {
        ...f,
        id: f.id || `frame-${idx + 1}`,
        positions: scaledPositions,
        lines: scaledLines
      };
    });
  }, [activeTacticsSource, defaultFormationPositions, dimensions]);

  const currentFrame = displayFrames[currentFrameIdx] || displayFrames[0] || { positions: [], lines: [] };

  // Smooth animation controls
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (playAnimRef.current) cancelAnimationFrame(playAnimRef.current);
    setPlaybackPositions(null);
  }, []);

  const handlePlay = useCallback(() => {
    if (displayFrames.length <= 1) {
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 1200);
      return;
    }

    setIsPlaying(true);
    isPlayingRef.current = true;

    const duration = 1400; // 1.4s transition per step

    const playStep = (stepIndex: number) => {
      if (!isPlayingRef.current) return;
      const nextIndex = (stepIndex + 1) % displayFrames.length;

      setCurrentFrameIdx(stepIndex);
      const startPos = displayFrames[stepIndex].positions;
      const endPos = displayFrames[nextIndex].positions;
      const startTime = performance.now();

      const animate = (time: number) => {
        if (!isPlayingRef.current) return;

        let progress = (time - startTime) / duration;
        if (progress > 1) progress = 1;

        // easeInOutQuad
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentPos = startPos.map((p1: any) => {
          const p2 = endPos.find((p: any) => p.id === p1.id) || p1;
          return {
            ...p1,
            x: p1.x + (p2.x - p1.x) * ease,
            y: p1.y + (p2.y - p1.y) * ease,
          };
        });

        setPlaybackPositions(currentPos);

        if (progress < 1) {
          playAnimRef.current = requestAnimationFrame(animate);
        } else {
          setPlaybackPositions(null);
          setCurrentFrameIdx(nextIndex);
          setTimeout(() => {
            if (isPlayingRef.current) {
              playStep(nextIndex);
            }
          }, 450); // Pause on step
        }
      };

      playAnimRef.current = requestAnimationFrame(animate);
    };

    playStep(currentFrameIdx);
  }, [displayFrames, currentFrameIdx]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      handleStop();
    } else {
      handlePlay();
    }
  };

  const handleSelectFrame = (idx: number) => {
    handleStop();
    setCurrentFrameIdx(idx);
  };

  useEffect(() => {
    return () => {
      if (playAnimRef.current) cancelAnimationFrame(playAnimRef.current);
    };
  }, []);

  // Filter and sort players for Stats view
  const statsPayload = payload?.type === 'stats' ? (payload as SharedStatsPayload) : null;

  const hasSeasonConfig = statsPayload?.hasSeasonConfig ?? Boolean(statsPayload?.seasonLabel);

  const activeStatsData = useMemo(() => {
    if (!statsPayload) return { players: [], summary: { totalGoals: 0, totalAssists: 0, totalMatches: 0, playerCount: 0 } };
    if (filterMode === 'all_time' && statsPayload.allTimeData) {
      return statsPayload.allTimeData;
    }
    return {
      players: statsPayload.players,
      summary: statsPayload.summary
    };
  }, [statsPayload, filterMode]);

  const getPlayerStatValue = (p: SharedPlayerStat, tab: StatTab): number => {
    if (tab === 'rating') return p.rating ?? p.avgRating ?? 0;
    return p[tab] || 0;
  };

  const sortedPlayers = useMemo(() => {
    if (!activeStatsData) return [];
    const list = [...activeStatsData.players];

    return list.sort((a, b) => {
      if (activeStatsTab === 'rating') {
        const aRating = a.rating ?? a.avgRating ?? 0;
        const bRating = b.rating ?? b.avgRating ?? 0;
        if (bRating !== aRating) return bRating - aRating;
        if ((b.ratedMatches || 0) !== (a.ratedMatches || 0)) return (b.ratedMatches || 0) - (a.ratedMatches || 0);
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.assists !== a.assists) return b.assists - a.assists;
      } else {
        const aVal = a[activeStatsTab] || 0;
        const bVal = b[activeStatsTab] || 0;
        if (bVal !== aVal) {
          return bVal - aVal;
        }
        if (activeStatsTab === 'goals') {
          if (b.assists !== a.assists) return b.assists - a.assists;
          if (b.attendance !== a.attendance) return b.attendance - a.attendance;
        } else if (activeStatsTab === 'assists') {
          if (b.goals !== a.goals) return b.goals - a.goals;
          if (b.attendance !== a.attendance) return b.attendance - a.attendance;
        } else {
          if (b.goals !== a.goals) return b.goals - a.goals;
          if (b.assists !== a.assists) return b.assists - a.assists;
        }
      }
      return compareVietnameseNames(a.name, b.name);
    });
  }, [activeStatsData, activeStatsTab]);

  const activeContributors = useMemo(() => {
    return sortedPlayers.filter((p) => getPlayerStatValue(p, activeStatsTab) > 0);
  }, [sortedPlayers, activeStatsTab]);

  const zeroStatPlayers = useMemo(() => {
    return sortedPlayers.filter((p) => getPlayerStatValue(p, activeStatsTab) === 0);
  }, [sortedPlayers, activeStatsTab]);

  const displayedPlayers = useMemo(() => {
    if (activeContributors.length === 0) return zeroStatPlayers;
    if (showAllZeroStats) return [...activeContributors, ...zeroStatPlayers];
    return activeContributors;
  }, [activeContributors, zeroStatPlayers, showAllZeroStats]);

  const topPerformers = useMemo(() => {
    return activeContributors.slice(0, 5);
  }, [activeContributors]);

  const maxStat = useMemo(() => {
    if (topPerformers.length === 0) return 1;
    return Math.max(...topPerformers.map((p) => getPlayerStatValue(p, activeStatsTab)), 1);
  }, [topPerformers, activeStatsTab]);

  const totalTeamGoals = activeStatsData.summary.totalGoals;
  const totalTeamAssists = activeStatsData.summary.totalAssists;
  const totalMatches = activeStatsData.summary.totalMatches;
  const avgGoalsPerMatch = totalMatches > 0 ? (totalTeamGoals / totalMatches).toFixed(1) : '0.0';

  // Rating summary metrics
  const ratedPlayers = useMemo(() => {
    if (!activeStatsData) return [];
    return activeStatsData.players.filter((p) => (p.rating ?? p.avgRating ?? 0) > 0);
  }, [activeStatsData]);

  const avgTeamRating = useMemo(() => {
    if (!activeStatsData) return '0.0';
    if (activeStatsData.summary.avgTeamRating !== undefined && activeStatsData.summary.avgTeamRating > 0) {
      return activeStatsData.summary.avgTeamRating.toFixed(1);
    }
    if (ratedPlayers.length > 0) {
      return (ratedPlayers.reduce((sum, p) => sum + (p.rating ?? p.avgRating ?? 0), 0) / ratedPlayers.length).toFixed(1);
    }
    return '0.0';
  }, [activeStatsData, ratedPlayers]);

  const highestAvgRatingPlayer = useMemo(() => {
    if (ratedPlayers.length === 0) return null;
    return [...ratedPlayers].sort((a, b) => (b.rating ?? b.avgRating ?? 0) - (a.rating ?? a.avgRating ?? 0))[0];
  }, [ratedPlayers]);

  const highestMatchRating = useMemo(() => {
    if (!activeStatsData) return '0.0';
    if (activeStatsData.summary.highestMatchRating !== undefined && activeStatsData.summary.highestMatchRating > 0) {
      return activeStatsData.summary.highestMatchRating.toFixed(1);
    }
    if (highestAvgRatingPlayer) {
      return (highestAvgRatingPlayer.rating ?? highestAvgRatingPlayer.avgRating ?? 0).toFixed(1);
    }
    return '0.0';
  }, [activeStatsData, highestAvgRatingPlayer]);

  const matchesWithRatingsCount = useMemo(() => {
    if (!activeStatsData) return 0;
    if (activeStatsData.summary.matchesWithRatingsCount !== undefined) {
      return activeStatsData.summary.matchesWithRatingsCount;
    }
    return ratedPlayers.length > 0 ? totalMatches : 0;
  }, [activeStatsData, ratedPlayers, totalMatches]);

  const getUnitLabel = () => {
    switch (activeStatsTab) {
      case 'goals': return t('stats.unit_goals', 'BÀN');
      case 'assists': return t('stats.unit_assists', 'KIẾN TẠO');
      case 'attendance': return t('stats.unit_matches', 'TRẬN');
      case 'rating': return t('stats.unit_rating', 'ĐIỂM');
    }
  };

  const handleTabChange = (tab: StatTab) => {
    setActiveStatsTab(tab);
    setShowAllZeroStats(false);
  };

  // Render Futsal Pitch for Tactics
  const renderFutsalPitch = () => {
    const L_WIDTH = 200;
    const L_HEIGHT = 400;

    // Safety margins to guarantee lines, goal boxes, and corner arcs are never clipped
    const PAD_X = dimensions.isLandscape ? 16 : 8;
    const PAD_Y = dimensions.isLandscape ? 8 : 16;

    const courtW = dimensions.width - 2 * PAD_X;
    const courtH = dimensions.height - 2 * PAD_Y;
    const scale = dimensions.isLandscape ? courtH / L_WIDTH : courtW / L_WIDTH;
    const courtColor = '#15803d'; // Artificial Grass Green
    const lineColor = 'rgba(255,255,255,0.7)';
    const lineWidth = 3 / scale;

    return (
      <Group
        x={PAD_X}
        y={dimensions.isLandscape ? PAD_Y + courtH : PAD_Y}
        rotation={dimensions.isLandscape ? -90 : 0}
        scaleX={scale}
        scaleY={scale}
      >
        <Rect width={L_WIDTH} height={L_HEIGHT} fill={courtColor} />
        {/* Center Line */}
        <Line points={[0, L_HEIGHT / 2, L_WIDTH, L_HEIGHT / 2]} stroke={lineColor} strokeWidth={lineWidth} />
        {/* Center Circle & Mark */}
        <Circle x={L_WIDTH / 2} y={L_HEIGHT / 2} radius={30} stroke={lineColor} strokeWidth={lineWidth} />
        <Circle x={L_WIDTH / 2} y={L_HEIGHT / 2} radius={3 / scale} fill={lineColor} />

        {/* Top (Left Goal) Penalty Area */}
        <Path
          data={`M 25 0 A 60 60 0 0 0 85 60 L 115 60 A 60 60 0 0 0 175 0`}
          stroke={lineColor}
          strokeWidth={lineWidth}
        />
        <Rect x={85} y={0} width={30} height={15} stroke={lineColor} strokeWidth={lineWidth} opacity={0.2} fill="white" />
        <Circle x={100} y={60} radius={3 / scale} fill={lineColor} />
        <Circle x={100} y={100} radius={3 / scale} fill={lineColor} />

        {/* Bottom (Right Goal) Penalty Area */}
        <Path
          data={`M 25 400 A 60 60 0 0 1 85 340 L 115 340 A 60 60 0 0 1 175 400`}
          stroke={lineColor}
          strokeWidth={lineWidth}
        />
        <Rect x={85} y={385} width={30} height={15} stroke={lineColor} strokeWidth={lineWidth} opacity={0.2} fill="white" />
        <Circle x={100} y={340} radius={3 / scale} fill={lineColor} />
        <Circle x={100} y={300} radius={3 / scale} fill={lineColor} />

        {/* Corner Arcs */}
        <Path data={`M 0 5 A 5 5 0 0 0 5 0`} stroke={lineColor} strokeWidth={lineWidth} />
        <Path data={`M 195 0 A 5 5 0 0 0 200 5`} stroke={lineColor} strokeWidth={lineWidth} />
        <Path data={`M 200 395 A 5 5 0 0 0 195 400`} stroke={lineColor} strokeWidth={lineWidth} />
        <Path data={`M 5 400 A 5 5 0 0 0 0 395`} stroke={lineColor} strokeWidth={lineWidth} />

        {/* Outer Boundary */}
        <Rect width={L_WIDTH} height={L_HEIGHT} stroke={lineColor} strokeWidth={lineWidth * 2} />
      </Group>
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-surface flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="absolute inset-0 bg-accent/30 pointer-events-none -z-10" />
        <div className="w-16 h-16 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4"></div>
        <h2 className="font-display text-xl font-bold uppercase tracking-wider text-primary">
          {t('share.loading_title', 'ĐANG TẢI DỮ LIỆU ĐỘI BÓNG...')}
        </h2>
        <p className="text-xs text-text-muted mt-1 font-sans">
          {t('share.loading_desc', 'Chế độ xem thành viên an toàn')}
        </p>
      </div>
    );
  }

  // Error / Invalid Link State
  if (errorMsg || !payload) {
    return (
      <div className="fixed inset-0 overflow-y-auto bg-surface flex flex-col items-center justify-center p-6 text-center z-50">
        <div className="absolute inset-0 bg-accent/30 pointer-events-none -z-10" />
        <div className="max-w-md w-full mx-auto flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-red-500/40 bg-red-500/10 flex items-center justify-center mb-4">
            <X className="text-red-500" size={32} />
          </div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wider text-red-600 mb-2">
            {t('share.error_title', 'LIÊN KẾT KHÔNG KHẢ DỤNG')}
          </h2>
          <p className="text-xs text-text-muted mb-6 leading-relaxed">
            {errorMsg || t('share.error_generic', 'Không tìm thấy nội dung chia sẻ hoặc liên kết đã bị hủy.')}
          </p>
          <a
            href="/"
            className="px-6 py-2.5 bg-primary text-white font-display font-bold uppercase text-xs tracking-wider border-2 border-primary hover:bg-primary/90 transition-all"
          >
            {t('common.go_home', 'Về trang chính')}
          </a>
        </div>
      </div>
    );
  }


  // Calculate proportional size for Konva based on current board width
  const boardScale = Math.max(0.75, Math.min(1.1, (dimensions.width || 340) / 700));
  const homeRadius = Math.round(16 * boardScale);
  const enemyRadius = Math.round(14 * boardScale);
  const coneRadius = Math.round(10 * boardScale);
  const ballSize = Math.round(24 * boardScale);
  const labelFontSize = Math.max(9, Math.round(11 * boardScale));

  return (
    <div className="fixed inset-0 overflow-y-auto overscroll-y-contain bg-surface text-text-main flex flex-col selection:bg-primary/20">
      {/* 🌟 Member Portal Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b-2 border-border-main px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {payload.logoUrl ? (
              <img src={payload.logoUrl} alt="Logo" className="w-9 h-9 object-contain shrink-0 border border-border-main" />
            ) : (
              <div className="w-9 h-9 border-2 border-primary bg-primary/10 flex items-center justify-center font-display font-black text-primary text-base shrink-0">
                5T
              </div>
            )}
            <div className="min-w-0 flex items-center gap-2">
              <h1 className="font-display font-black uppercase text-base sm:text-xl text-primary truncate leading-tight">
                5TactiQ
              </h1>
            </div>
          </div>

          {/* Home Button to Landing Page */}
          <Link
            to="/landing"
            className="p-1.5 sm:p-2 border-2 border-border-main bg-surface hover:bg-surface-2 text-text-muted hover:text-primary transition-colors shrink-0 flex items-center justify-center cursor-pointer active:scale-95 shadow-sm"
            title={t('common.back_to_landing', 'Về trang chủ')}
          >
            <Home size={18} />
          </Link>
        </div>
      </header>

      {/* 🌟 Content wrapper with original app's bg-accent/30 */}
      <div className="flex-1 flex flex-col bg-accent/30 min-h-0">
        {/* 📊 STATS VIEW MODE */}
        {payload.type === 'stats' && statsPayload && (
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
          {/* 🏆 Header Section */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 sm:gap-4 mb-5 sm:mb-6 pb-2 border-b-2 border-border-main">
            <div>
              <h1 className="text-3xl sm:text-5xl font-display uppercase text-primary leading-none mb-1">
                {t('stats.title', 'THỐNG KÊ')}
              </h1>
              <p className="text-[11px] sm:text-xs font-bold text-text-muted uppercase tracking-widest font-display">
                {filterMode === 'current_season' 
                  ? (statsPayload.seasonLabel ? t('stats.season', { year: statsPayload.seasonLabel }) : t('stats.filter_season', 'MÙA GIẢI HIỆN TẠI')) 
                  : t('stats.filter_all', 'TẤT CẢ THỜI GIAN')}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto">
              <CustomSelect 
                value={filterMode} 
                onChange={(val) => {
                  setFilterMode(val as 'all_time' | 'current_season');
                  setShowAllZeroStats(false);
                }}
                className="relative w-full sm:w-auto shrink-0"
                buttonClassName="bg-surface border-2 border-border-main text-xs font-bold uppercase tracking-widest text-text-main px-3 outline-none focus:border-primary cursor-pointer w-full sm:w-auto h-[38px] sm:h-[40px] flex items-center justify-between gap-3 transition-colors hover:border-primary/50"
                options={[
                  { value: 'current_season', label: t('stats.filter_season', 'MÙA GIẢI HIỆN TẠI') },
                  { value: 'all_time', label: t('stats.filter_all', 'TẤT CẢ THỜI GIAN') }
                ]}
              />
            </div>
          </div>

          {/* 🏷️ Navigation Tabs */}
          <div className="flex border-b-2 border-border-main mb-5 sm:mb-6 overflow-x-auto hide-scrollbar shrink-0 gap-1.5 sm:gap-2">
            <button 
              type="button"
              onClick={() => handleTabChange('goals')}
              className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold cursor-pointer ${
                activeStatsTab === 'goals' 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              {t('stats.goals', 'BÀN THẮNG')}
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('assists')}
              className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold cursor-pointer ${
                activeStatsTab === 'assists' 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              {t('stats.assists', 'KIẾN TẠO')}
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('attendance')}
              className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold cursor-pointer ${
                activeStatsTab === 'attendance' 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              {t('stats.attendance', 'SỐ TRẬN CÓ MẶT')}
            </button>
            <button 
              type="button"
              onClick={() => handleTabChange('rating')}
              className={`shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-display uppercase tracking-wider transition-all border-b-4 -mb-[2px] font-bold cursor-pointer ${
                activeStatsTab === 'rating' 
                  ? 'border-primary text-primary bg-primary/5' 
                  : 'border-transparent text-text-muted hover:text-text-main'
              }`}
            >
              {t('stats.tab_rating', 'ĐIỂM ĐÁNH GIÁ')}
            </button>
          </div>

          {/* 📐 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* 👈 LEFT COLUMN: Detailed Ranking Table (7 cols on lg) */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              <div className="hallmark-card p-0 overflow-hidden bg-surface border-2 border-border-main shadow-sm">
                
                {/* Table Subheader */}
                <div className="p-3 sm:p-4 bg-surface-2 border-b-2 border-border-main flex justify-between items-center text-xs font-display font-bold uppercase tracking-wider text-text-muted">
                  <span>{t('stats.rank_and_player', 'HẠNG & CẦU THỦ')}</span>
                  <span>
                    {activeStatsTab === 'goals' 
                      ? t('stats.total_goals_col', 'TỔNG BÀN') 
                      : activeStatsTab === 'assists' 
                      ? t('stats.total_assists_col', 'TỔNG KIẾN TẠO') 
                      : activeStatsTab === 'rating'
                      ? t('stats.rating_col', 'ĐIỂM TB')
                      : t('stats.total_matches_col', 'SỐ TRẬN')}
                  </span>
                </div>

                {displayedPlayers.length === 0 ? (
                  <div className="p-8 text-center text-text-muted font-medium text-sm">
                    {t('stats.no_data', 'Chưa có dữ liệu thống kê')}
                  </div>
                ) : (
                  displayedPlayers.map((player, index) => {
                    const statVal = getPlayerStatValue(player, activeStatsTab);
                    const isLeader = index === 0 && statVal > 0;
                    const isPodium = index < 3 && statVal > 0;

                    return (
                      <div 
                        key={player.id} 
                        onClick={() => setSelectedPlayer(player)}
                        className={`flex items-center p-3.5 sm:p-4 transition-colors hover:bg-accent/20 cursor-pointer ${
                          index !== displayedPlayers.length - 1 ? 'border-b border-border-main/50' : ''
                        } ${isLeader ? 'bg-secondary/10' : isPodium ? 'bg-primary/5' : 'bg-surface'}`}
                      >
                        {/* Rank Number */}
                        <div className={`w-7 sm:w-8 text-center font-display text-lg sm:text-xl mr-3 sm:mr-4 font-bold ${
                          isLeader ? 'text-secondary' : isPodium ? 'text-primary' : 'text-text-muted'
                        }`}>
                          {index + 1}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-bold text-sm sm:text-base truncate uppercase tracking-wide ${
                              isLeader ? 'text-primary font-bold' : 'text-text-main'
                            }`}>
                              {player.name}
                            </h3>
                            {player.number !== null && player.number !== undefined && (
                              <span className="text-[10px] font-display font-bold px-1.5 py-0.2 bg-surface-2 text-text-muted border border-border-main">
                                #{player.number}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Score Value with Unit */}
                        <div className="text-right shrink-0">
                          <div>
                            <span className={`text-2xl sm:text-3xl font-display font-bold leading-none ${
                              isLeader ? 'text-secondary' : 'text-primary'
                            }`}>
                              {activeStatsTab === 'rating' ? (statVal > 0 ? statVal.toFixed(1) : '—') : statVal}
                            </span>
                            <span className="text-[11px] sm:text-xs text-text-muted font-bold font-display uppercase ml-1.5">
                              {getUnitLabel()}
                            </span>
                          </div>
                          {activeStatsTab === 'rating' && (player.ratedMatches || 0) > 0 && (
                            <div className="text-[10px] text-text-muted font-display font-bold mt-0.5 uppercase tracking-wider">
                              {player.ratedMatches} {t('stats.rated_matches_col', 'TRẬN ĐÃ CHẤM')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Collapsible toggle for zero-stat players */}
                {activeContributors.length > 0 && zeroStatPlayers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllZeroStats(!showAllZeroStats)}
                    className="w-full p-3 bg-surface-2 hover:bg-surface border-t-2 border-border-main text-xs font-display font-bold uppercase tracking-wider text-text-muted hover:text-text-main transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {showAllZeroStats ? (
                      <>
                        <ChevronUp size={15} />
                        <span>{t('stats.collapse_zero_list', 'Thu gọn danh sách (Ẩn {{count}} cầu thủ 0 {{unit}})', { count: zeroStatPlayers.length, unit: getUnitLabel() })}</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown size={15} />
                        <span>{t('stats.expand_zero_list', 'Xem thêm {{count}} cầu thủ chưa có {{unit}} (0)', { count: zeroStatPlayers.length, unit: getUnitLabel() })}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 👉 RIGHT COLUMN: Visual Analytics Hub & Bar Chart (5 cols on lg) */}
            <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
              
              {/* 📊 Team Summary Metrics (2x2 KPI Cards) */}
              {activeStatsTab === 'rating' ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">
                      {t('stats.total_team_rating', 'ĐIỂM TB TOÀN ĐỘI')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-display text-primary font-bold">
                      {avgTeamRating}
                    </div>
                  </div>

                  <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">
                      {t('stats.top_rating_player', 'PHONG ĐỘ CAO NHẤT')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-display text-secondary font-bold truncate px-1">
                      {highestAvgRatingPlayer ? (highestAvgRatingPlayer.rating ?? highestAvgRatingPlayer.avgRating ?? 0).toFixed(1) : '0.0'}
                    </div>
                    {highestAvgRatingPlayer && (
                      <div className="text-[10px] font-bold text-text-muted truncate mt-0.5 uppercase font-display">
                        {highestAvgRatingPlayer.name}
                      </div>
                    )}
                  </div>

                  <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">
                      {t('stats.rated_matches_col', 'TRẬN ĐÃ CHẤM')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-display text-text-main font-bold">
                      {matchesWithRatingsCount}
                    </div>
                  </div>

                  <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">
                      {t('stats.highest_rated_match', 'ĐIỂM CAO NHẤT')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-display text-text-main font-bold">
                      {highestMatchRating}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">
                      {t('stats.total_team_goals', 'TỔNG BÀN THẮNG')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-display text-primary font-bold">
                      {totalTeamGoals}
                    </div>
                  </div>

                  <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">
                      {t('stats.total_team_assists', 'TỔNG KIẾN TẠO')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-display text-secondary font-bold">
                      {totalTeamAssists}
                    </div>
                  </div>

                  <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">
                      {t('stats.total_matches', 'SỐ TRẬN TỔNG')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-display text-text-main font-bold">
                      {totalMatches}
                    </div>
                  </div>

                  <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1 font-display">
                      {t('stats.avg_goals_match', 'TB BÀN / TRẬN')}
                    </div>
                    <div className="text-3xl sm:text-4xl font-display text-text-main font-bold">
                      {avgGoalsPerMatch}
                    </div>
                  </div>
                </div>
              )}

              {/* 📈 Visual Horizontal Bar Chart */}
              <div className="hallmark-card bg-surface border-2 border-border-main p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-center pb-2 border-b border-border-main">
                  <h2 className="font-display text-base sm:text-lg uppercase tracking-widest text-primary font-bold">
                    {t('stats.top_performers_title', 'TOP HIỆU SUẤT TRỰC QUAN')}
                  </h2>
                  <span className="text-[11px] font-display uppercase tracking-wider text-text-muted font-bold">
                    {activeStatsTab === 'goals' 
                      ? t('stats.tab_scoring', 'GHI BÀN') 
                      : activeStatsTab === 'assists' 
                      ? t('stats.tab_assisting', 'KIẾN TẠO') 
                      : activeStatsTab === 'rating'
                      ? t('stats.tab_rating_chart', 'ĐIỂM TRUNG BÌNH')
                      : t('stats.tab_appearance', 'RA SÂN')}
                  </span>
                </div>

                {topPerformers.length === 0 ? (
                  <div className="p-6 text-center text-text-muted text-xs font-medium">
                    {t('stats.no_chart_data', 'Chưa có số liệu cho hạng mục này')}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5 pt-1">
                    {topPerformers.map((player, idx) => {
                      const statVal = getPlayerStatValue(player, activeStatsTab);
                      const percentage = Math.max(8, (statVal / maxStat) * 100);
                      const isTop1 = idx === 0;

                      return (
                        <div key={player.id} className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-text-main uppercase tracking-wide truncate max-w-[200px]">
                              {idx + 1} - {player.name}
                            </span>
                            <span className="font-display font-bold text-primary text-sm">
                              {activeStatsTab === 'rating' ? statVal.toFixed(1) : statVal} <span className="text-[10px] text-text-muted font-normal uppercase">{getUnitLabel()}</span>
                            </span>
                          </div>

                          {/* Bar Meter Container */}
                          <div className="w-full h-3 bg-surface-2 border border-border-main overflow-hidden p-0.5">
                            <div 
                              className={`h-full transition-all duration-700 ${
                                isTop1 ? 'bg-secondary' : idx === 1 ? 'bg-primary' : 'bg-primary/60'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

        </main>
      )}

      {/* ⚽ TACTICS VIEW MODE */}
      {payload.type === 'tactics' && tacticsPayload && (
        <main className="flex-1 flex flex-col w-full max-w-6xl mx-auto p-2 sm:p-4 min-h-0 min-w-0 justify-between">
          {/* Konva Pitch Canvas Container */}
          <div 
            ref={boardContainerRef} 
            className="flex-1 w-full min-w-0 min-h-0 bg-surface border-2 border-border-main p-2 sm:p-4 flex items-center justify-center overflow-hidden shadow-inner relative"
          >
            {dimensions.width > 0 && (
              <div 
                style={{ width: dimensions.width, height: dimensions.height }}
                className="overflow-hidden shadow-2xl rounded-xl sm:rounded-2xl border border-white/20 relative bg-[#15803d] shrink-0"
              >
                <Stage
                  width={dimensions.width}
                  height={dimensions.height}
                >
                  <Layer>
                    {renderFutsalPitch()}
                  </Layer>

                  {/* Lines Layer */}
                  <Layer>
                    {(currentFrame.lines || []).map((line, i) => {
                      const isArrow = line.tool === 'move' || line.tool === 'run' || line.tool === 'pass';
                      const dashPattern = line.tool === 'run' ? [10, 10] : [];

                      if (line.tool === 'zone' && line.points.length >= 4) {
                        const [startX, startY, endX, endY] = line.points;
                        const rectX = Math.min(startX, endX);
                        const rectY = Math.min(startY, endY);
                        const rectW = Math.abs(endX - startX);
                        const rectH = Math.abs(endY - startY);
                        return (
                          <Rect
                            key={i}
                            x={rectX}
                            y={rectY}
                            width={rectW}
                            height={rectH}
                            fill="rgba(255, 255, 255, 0.15)"
                            stroke="#ffffff"
                            strokeWidth={2}
                            dash={[5, 5]}
                            cornerRadius={8}
                          />
                        );
                      }

                      if (isArrow) {
                        return (
                          <Arrow
                            key={i}
                            points={line.points}
                            stroke={line.color}
                            fill={line.color}
                            strokeWidth={3}
                            pointerLength={10}
                            pointerWidth={10}
                            tension={0.5}
                            dash={dashPattern}
                            lineCap="round"
                            lineJoin="round"
                          />
                        );
                      }

                      return (
                        <Line
                          key={i}
                          points={line.points}
                          stroke={line.color}
                          strokeWidth={line.size || 3}
                          tension={0.5}
                          lineCap="round"
                          lineJoin="round"
                        />
                      );
                    })}
                  </Layer>

                  {/* Players / Cones / Ball Layer */}
                  <Layer>
                    {(playbackPositions || currentFrame.positions).map((pos) => (
                      <Group
                        key={pos.id}
                        x={pos.x}
                        y={pos.y}
                      >
                        {pos.isText ? (
                          <Text
                            text={pos.text || ''}
                            fontSize={Math.max(10, Math.round(18 * boardScale))}
                            fontFamily="Arial"
                            fill="#ffffff"
                            shadowColor="black"
                            shadowBlur={4}
                            shadowOpacity={0.8}
                            shadowOffset={{ x: 1, y: 1 }}
                            fontStyle="bold"
                            offsetX={Math.round(20 * boardScale)}
                            offsetY={Math.round(10 * boardScale)}
                          />
                        ) : pos.isCone ? (
                          <Group>
                            <Circle
                              radius={coneRadius}
                              fill="#f97316"
                              stroke="#ffffff"
                              strokeWidth={Math.max(1, 2 * boardScale)}
                              shadowColor="black"
                              shadowBlur={4}
                              shadowOpacity={0.4}
                            />
                            <Circle radius={Math.max(2, 3 * boardScale)} fill="#ffffff" />
                          </Group>
                        ) : pos.isBall ? (
                          <Group>
                            {ballImage ? (
                              <KonvaImage
                                image={ballImage}
                                x={-ballSize / 2}
                                y={-ballSize / 2}
                                width={ballSize}
                                height={ballSize}
                                shadowColor="black"
                                shadowBlur={5}
                                shadowOpacity={0.3}
                              />
                            ) : (
                              <Circle
                                radius={ballSize / 2}
                                fill="#ffffff"
                                stroke="#1e293b"
                                strokeWidth={2}
                              />
                            )}
                          </Group>
                        ) : (
                          <Circle
                            radius={pos.isEnemy ? enemyRadius : homeRadius}
                            fill={pos.isEnemy ? '#3b82f6' : '#ef4444'}
                            stroke="#ffffff"
                            strokeWidth={Math.max(1.5, 2 * boardScale)}
                            shadowColor="black"
                            shadowBlur={5}
                            shadowOpacity={0.3}
                          />
                        )}

                        {!pos.isEnemy && !pos.isBall && !pos.isCone && !pos.isText && (
                          <Text
                            text={pos.label || ''}
                            fontSize={labelFontSize}
                            fontFamily="Arial"
                            fill="white"
                            align="center"
                            verticalAlign="middle"
                            x={-homeRadius}
                            y={-labelFontSize / 2}
                            width={homeRadius * 2}
                            fontStyle="bold"
                          />
                        )}
                      </Group>
                    ))}
                  </Layer>
                </Stage>
              </div>
            )}
          </div>

          {/* 🎬 Bottom Animation Control Bar (Full width matching tactics board) */}
          <div className="w-full mt-3 sm:mt-4 mb-2">
            <div className="w-full h-14 sm:h-16 flex items-center gap-2.5 sm:gap-3 px-3 py-2 bg-surface border-2 border-border-main shadow-lg">
              {/* Play / Stop Button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex justify-center items-center font-semibold transition-all border shrink-0 cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm animate-pulse'
                    : 'bg-primary text-white border-primary shadow-sm hover:bg-primary/90 hover:scale-105 active:scale-95'
                }`}
                title={isPlaying ? t('tactics.stop', 'Tạm dừng') : t('tactics.play', 'Phát mô phỏng')}
              >
                {isPlaying ? (
                  <Pause size={18} />
                ) : (
                  <Play fill="currentColor" size={18} className="ml-0.5" />
                )}
              </button>

              <div className="w-px h-6 bg-border-main shrink-0"></div>

              {/* Scrollable Frame Track (1, 2, 3...) */}
              <div className="flex-1 flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth py-1">
                {displayFrames.map((frame, idx) => (
                  <button
                    key={frame.id || idx}
                    type="button"
                    onClick={() => handleSelectFrame(idx)}
                    className={`w-9 h-9 sm:w-10 sm:h-10 font-display font-bold text-xs sm:text-sm transition-all flex justify-center items-center border shrink-0 cursor-pointer ${
                      currentFrameIdx === idx
                        ? 'bg-primary text-white border-primary shadow-sm scale-105'
                        : 'bg-surface-2 text-text-muted border-border-main hover:bg-primary/10 hover:text-primary'
                    }`}
                    title={`${t('tactics.step', 'Bước')} ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 👤 Player Detail Modal (Read-Only) */}
      {selectedPlayer && (
        <BottomSheet
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          title={
            <div className="flex items-center gap-2">
              <Users className="text-primary" size={20} />
              <span className="font-display uppercase">{selectedPlayer.name}</span>
            </div>
          }
          maxWidth="sm"
        >
          <div className="flex flex-col gap-4 py-2 text-text-main">
            {/* Header with Photo and Jersey */}
            <div className="flex items-center gap-4 p-4 bg-surface border-2 border-border-main">
              <div className="w-16 h-16 border-2 border-primary bg-primary/10 flex items-center justify-center overflow-hidden">
                {selectedPlayer.photo ? (
                  <img src={selectedPlayer.photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display font-black text-2xl text-primary">
                    {selectedPlayer.number || '-'}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-display font-bold uppercase text-lg text-text-main">{selectedPlayer.name}</h3>
                {selectedPlayer.number !== null && selectedPlayer.number !== undefined && (
                  <p className="text-xs text-text-muted font-sans">
                    #{selectedPlayer.number}
                  </p>
                )}
              </div>
            </div>

            {/* Stat Cards Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-surface border border-border-main text-center">
                <span className="text-[10px] font-display font-bold uppercase text-text-muted block">{t('stats.tab_scoring', 'BÀN THẮNG')}</span>
                <span className="text-xl font-display font-black text-primary mt-1 block">{selectedPlayer.goals}</span>
              </div>
              <div className="p-3 bg-surface border border-border-main text-center">
                <span className="text-[10px] font-display font-bold uppercase text-text-muted block">{t('stats.tab_assisting', 'KIẾN TẠO')}</span>
                <span className="text-xl font-display font-black text-secondary mt-1 block">{selectedPlayer.assists}</span>
              </div>
              <div className="p-3 bg-surface border border-border-main text-center">
                <span className="text-[10px] font-display font-bold uppercase text-text-muted block">{t('stats.tab_appearance', 'ĐIỂM DANH')}</span>
                <span className="text-xl font-display font-black text-text-main mt-1 block">{selectedPlayer.attendance}</span>
              </div>
              <div className="p-3 bg-surface border border-border-main text-center">
                <span className="text-[10px] font-display font-bold uppercase text-text-muted block">{t('stats.rating_col', 'ĐIỂM TB')}</span>
                <span className="text-xl font-display font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {(selectedPlayer.rating ?? selectedPlayer.avgRating ?? 0) > 0 
                    ? (selectedPlayer.rating ?? selectedPlayer.avgRating ?? 0).toFixed(1) 
                    : '-'}
                </span>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="w-full py-2 bg-surface-card border border-border-main text-text-muted hover:text-text-main font-display font-bold uppercase text-xs tracking-wider"
              >
                {t('common.close', 'ĐÓNG')}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

        {/* 🔒 Footer */}
        <footer className="border-t border-border-main/60 py-4 px-4 text-center text-xs text-text-muted mt-auto bg-surface/40">
          <p className="font-display font-bold uppercase tracking-wider text-[11px] text-primary/80">
            {payload.teamName 
              ? (payload.teamName.trim().toUpperCase().startsWith('5TACTIQ') 
                  ? payload.teamName.trim() 
                  : `5TactiQ - ${payload.teamName.trim()}`)
              : '5TactiQ'}
          </p>
          <p className="text-[10px] mt-0.5 text-text-muted/80">
            {t('share.footer_notice', 'Dữ liệu được chia sẻ an toàn ở chế độ Chỉ đọc. Không có quyền chỉnh sửa.')}
          </p>
        </footer>
      </div>
    </div>
  );
}
