import { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Group, Path, Image as KonvaImage, Arrow } from 'react-konva';
import { Download, Save, MousePointer2, Pen, ArrowLeft, Trash2, Users, Settings, Undo2, Redo2, Eraser, TrendingUp, FastForward, CornerUpRight, Play, Square, Plus, Triangle, SquareDashed, Type, BookOpen, Search, Copy, X, FolderOpen, Keyboard, HelpCircle, RotateCcw, LayoutTemplate, Scissors } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTacticStore } from '../store/useTacticStore';
import { hapticImpact } from '../utils/haptics';
import { Touchable } from '../components/ui/Touchable';
import { BottomSheet } from '../components/ui/BottomSheet';
import { TacticsSkeleton } from '../components/ui/TacticsSkeleton';
const COURT_RATIO = 2; // Height / Width = 40/20 = 2

type Position = { id: string; x: number; y: number; label?: string; isEnemy?: boolean; isBall?: boolean; isCone?: boolean; isText?: boolean; text?: string };
export type DrawingTool = 'cursor' | 'pen' | 'eraser' | 'move' | 'run' | 'pass' | 'cone' | 'zone' | 'text';
type DrawingLine = { points: number[]; color: string; tool: DrawingTool; size?: number };
export type TacticalFrame = { id: string; positions: Position[]; lines: DrawingLine[] };

const useBallImage = () => {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);
  useEffect(() => {
    const img = new window.Image();
    img.src = './ball.png';
    img.onload = () => setImage(img);
  }, []);
  return image;
};

export default function Tactics() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingScroll = useRef(false);
  const startXScroll = useRef(0);
  const scrollLeftValue = useRef(0);

  const handleScrollMouseDown = (e: React.MouseEvent) => {
    if (!bottomScrollRef.current) return;
    isDraggingScroll.current = true;
    startXScroll.current = e.pageX - bottomScrollRef.current.offsetLeft;
    scrollLeftValue.current = bottomScrollRef.current.scrollLeft;
  };
  const handleScrollMouseLeave = () => { isDraggingScroll.current = false; };
  const handleScrollMouseUp = () => { isDraggingScroll.current = false; };
  const handleScrollMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingScroll.current || !bottomScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - bottomScrollRef.current.offsetLeft;
    const walk = (x - startXScroll.current) * 1.5;
    bottomScrollRef.current.scrollLeft = scrollLeftValue.current - walk;
  };

  const stageRef = useRef<any>(null);
  const navigate = useNavigate();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, isLandscape: false });
  const prevDimRef = useRef({ w: 0, h: 0, isLandscape: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Tự động xoay ngang màn hình khi vào Sa Bàn, trả về ban đầu khi thoát
  useEffect(() => {
    try {
      // Native App Lock
      import('@capacitor/screen-orientation').then(({ ScreenOrientation }) => {
        ScreenOrientation.lock({ orientation: 'landscape' }).catch(() => {});
      }).catch(() => {});
      
      // Web PWA Lock
      if (window.screen && window.screen.orientation && typeof window.screen.orientation.lock === 'function') {
        window.screen.orientation.lock('landscape').catch(() => {
          // Trình duyệt có thể chặn auto-lock nếu chưa có thao tác chạm
        });
      }
    } catch {
      // Ignore
    }

    return () => {
      try {
        // Native App Unlock
        import('@capacitor/screen-orientation').then(({ ScreenOrientation }) => {
          ScreenOrientation.unlock().catch(() => {});
        }).catch(() => {});

        // Web PWA Unlock
        if (window.screen && window.screen.orientation && typeof window.screen.orientation.unlock === 'function') {
          window.screen.orientation.unlock();
        }
      } catch {
        // Ignore
      }
    };
  }, []);

  const [positions, setPositions] = useState<Position[]>([]);
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<DrawingTool>('cursor');
  const [eraserSize, setEraserSize] = useState(24);
  const [eraserMode, setEraserMode] = useState<'brush' | 'object'>('brush');
  const [showEraserMenu, setShowEraserMenu] = useState(false);
  const [eraserMenuPos, setEraserMenuPos] = useState({ top: 0, left: 0 });
  const [activeTab, setActiveTab] = useState<'formation' | 'attack' | 'defense' | 'situations'>('formation');
  const [history, setHistory] = useState<{ positions: Position[], lines: DrawingLine[] }[]>([]);
  const [historyStep, setHistoryStep] = useState(0);

  const [frames, setFrames] = useState<TacticalFrame[]>([{ id: 'frame-1', positions: [], lines: [] }]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPositions, setPlaybackPositions] = useState<Position[] | null>(null);
  const playRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  // Tactical Library & Help State
  const { savedTactics, activeBoard, setActiveBoard, addTactic, updateTactic, deleteTactic, duplicateTactic } = useTacticStore();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [activeHelpTab, setActiveHelpTab] = useState<'guide' | 'shortcuts'>('guide');
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState<'training' | 'opponent' | 'other'>('training');
  const [librarySearch, setLibrarySearch] = useState('');
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel?: () => void; variant: 'danger' | 'warning' | 'info'; confirmText?: string; cancelText?: string }>({ isOpen: false, title: '', message: '', onConfirm: () => { }, variant: 'danger' });
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; variant: 'success' | 'error' }>({ isVisible: false, message: '', variant: 'success' });
  const [pendingTextPos, setPendingTextPos] = useState<{ x: number, y: number } | null>(null);
  const [textInput, setTextInput] = useState('');
  
  const eraserBtnRef = useRef<HTMLButtonElement>(null);

  const updateEraserMenuPos = useCallback(() => {
    if (showEraserMenu && eraserBtnRef.current) {
      const rect = eraserBtnRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setShowEraserMenu(false);
      } else {
        setEraserMenuPos({ top: rect.top, left: rect.right + 12 });
      }
    }
  }, [showEraserMenu]);

  useEffect(() => {
    if (showEraserMenu) {
      window.addEventListener('resize', updateEraserMenuPos);
      return () => window.removeEventListener('resize', updateEraserMenuPos);
    }
  }, [showEraserMenu, updateEraserMenuPos]);

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ isVisible: true, message, variant });
    setTimeout(() => setToast(t => ({ ...t, isVisible: false })), 2500);
  };

  const ballImage = useBallImage();

  const saveHistory = (newPositions: Position[], newLines: DrawingLine[]) => {
    const newHistory = history.slice(0, historyStep + 1);
    const posCopy = JSON.parse(JSON.stringify(newPositions));
    const linesCopy = JSON.parse(JSON.stringify(newLines));
    newHistory.push({ positions: posCopy, lines: linesCopy });
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const step = historyStep - 1;
      setHistoryStep(step);
      setPositions(JSON.parse(JSON.stringify(history[step].positions)));
      setLines(JSON.parse(JSON.stringify(history[step].lines)));
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const step = historyStep + 1;
      setHistoryStep(step);
      setPositions(JSON.parse(JSON.stringify(history[step].positions)));
      setLines(JSON.parse(JSON.stringify(history[step].lines)));
    }
  };

  const handleResetBoard = () => {
    if (dimensions.width === 0) return;
    const w = dimensions.width;
    const h = dimensions.height;
    const l = dimensions.isLandscape;

    const getPos = (rx: number, ry: number) => {
      if (l) return { x: (1 - ry) * w, y: rx * h };
      return { x: rx * w, y: ry * h };
    };

    const enemies = [
      { id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.12) },
      { id: 'away-1', isEnemy: true, ...getPos(0.3, 0.25) },
      { id: 'away-2', isEnemy: true, ...getPos(0.7, 0.25) },
      { id: 'away-3', isEnemy: true, ...getPos(0.25, 0.42) },
      { id: 'away-4', isEnemy: true, ...getPos(0.75, 0.42) }
    ];

    const ball = { id: 'ball', isBall: true, ...getPos(0.5, 0.5) };

    const home = [
      { id: 'home-gk', label: 'GK', ...getPos(0.5, 0.88) },
      { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.72) },
      { id: 'home-ala1', label: 'ALA', ...getPos(0.25, 0.58) },
      { id: 'home-ala2', label: 'ALA', ...getPos(0.75, 0.58) },
      { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.46) }
    ];

    const initialPos = [...home, ball];
    setPositions(initialPos);
    setLines([]);

    const frameCopy = {
      id: frames.length > 0 ? frames[0].id : 'frame-1',
      positions: JSON.parse(JSON.stringify(initialPos)),
      lines: []
    };
    setFrames([frameCopy]);
    setCurrentFrameIndex(0);
    setHistory([{ positions: JSON.parse(JSON.stringify(initialPos)), lines: [] }]);
    setHistoryStep(0);
  };

  const syncCurrentFrame = () => {
    const updatedFrames = [...frames];
    updatedFrames[currentFrameIndex] = {
      ...updatedFrames[currentFrameIndex],
      positions: JSON.parse(JSON.stringify(positions)),
      lines: JSON.parse(JSON.stringify(lines))
    };
    return updatedFrames;
  };

  const handleAddFrame = () => {
    if (isPlaying) return;
    const currentFrames = syncCurrentFrame();
    currentFrames.push({
      id: `frame-${Date.now()}`,
      positions: JSON.parse(JSON.stringify(positions)),
      lines: [] // Xóa nét vẽ
    });
    setFrames(currentFrames);
    setCurrentFrameIndex(currentFrames.length - 1);
    setLines([]);
    setHistory([{ positions: JSON.parse(JSON.stringify(positions)), lines: [] }]);
    setHistoryStep(0);
  };

  const handleSelectFrame = (index: number) => {
    if (isPlaying || index === currentFrameIndex) return;
    const currentFrames = syncCurrentFrame();
    setFrames(currentFrames);
    setCurrentFrameIndex(index);
    setPositions(currentFrames[index].positions);
    setLines(currentFrames[index].lines);
    setHistory([{ positions: JSON.parse(JSON.stringify(currentFrames[index].positions)), lines: JSON.parse(JSON.stringify(currentFrames[index].lines)) }]);
    setHistoryStep(0);
  };

  const handleDeleteFrame = (index: number) => {
    if (isPlaying || frames.length <= 1) return;
    let currentFrames = syncCurrentFrame();
    currentFrames.splice(index, 1);
    setFrames(currentFrames);

    const newIndex = index >= currentFrames.length ? currentFrames.length - 1 : index;
    setCurrentFrameIndex(newIndex);
    setPositions(currentFrames[newIndex].positions);
    setLines(currentFrames[newIndex].lines);
    setHistory([{ positions: JSON.parse(JSON.stringify(currentFrames[newIndex].positions)), lines: JSON.parse(JSON.stringify(currentFrames[newIndex].lines)) }]);
    setHistoryStep(0);
  };

  const handleStop = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (playRef.current) cancelAnimationFrame(playRef.current);
    setPlaybackPositions(null);
  };

  const handlePlay = () => {
    if (frames.length < 2 || isPlaying) return;
    const currentFrames = syncCurrentFrame();
    setFrames(currentFrames);
    setIsPlaying(true);
    isPlayingRef.current = true;

    const duration = 1500; // 1.5s per step

    const playStep = (stepIndex: number) => {
      if (stepIndex >= currentFrames.length - 1 || !isPlayingRef.current) {
        handleStop();
        setCurrentFrameIndex(currentFrames.length - 1);
        setPositions(currentFrames[currentFrames.length - 1].positions);
        setLines(currentFrames[currentFrames.length - 1].lines);
        return;
      }

      const startPos = currentFrames[stepIndex].positions;
      const endPos = currentFrames[stepIndex + 1].positions;
      const startTime = performance.now();

      setLines(currentFrames[stepIndex].lines);

      const animate = (time: number) => {
        if (!isPlayingRef.current) return;

        let progress = (time - startTime) / duration;
        if (progress > 1) progress = 1;

        // easeInOutQuad
        const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentPos = startPos.map(p1 => {
          const p2 = endPos.find(p => p.id === p1.id) || p1;
          return {
            ...p1,
            x: p1.x + (p2.x - p1.x) * ease,
            y: p1.y + (p2.y - p1.y) * ease,
          };
        });

        setPlaybackPositions(currentPos);

        if (progress < 1) {
          playRef.current = requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            if (isPlayingRef.current) playStep(stepIndex + 1);
          }, 500);
        }
      };

      playRef.current = requestAnimationFrame(animate);
    };

    playStep(0);
  };

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const entry = entries[0];
      const containerWidth = entry.contentRect.width;
      const containerHeight = entry.contentRect.height;

      if (containerWidth <= 0 || containerHeight <= 0) return;

      const isLandscape = containerWidth > containerHeight;
      let width = containerWidth;
      let height = containerHeight;

      if (isLandscape) {
        width = height * COURT_RATIO;
        if (width > containerWidth) {
          width = containerWidth;
          height = width / COURT_RATIO;
        }
      } else {
        height = width * COURT_RATIO;
        if (height > containerHeight) {
          height = containerHeight;
          width = height / COURT_RATIO;
        }
      }

      setDimensions({ width, height, isLandscape });
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        case '1':
        case 'v':
          setTool('cursor');
          break;
        case '2':
        case 'm':
          setTool('move');
          break;
        case '3':
        case 'r':
          setTool('run');
          break;
        case '4':
        case 'a':
          setTool('pass');
          break;
        case '5':
        case 'e':
          setTool('eraser');
          break;
        case '6':
        case 'c':
          setTool('cone');
          break;
        case '7':
        case 'z':
          setTool('zone');
          break;
        case '8':
        case 't':
          setTool('text');
          break;
        case '0':
          e.preventDefault();
          handleResetBoard();
          break;
        case ' ':
          e.preventDefault();
          if (isPlaying) {
            handleStop();
          } else {
            handlePlay();
          }
          break;
        case 'delete':
        case 'backspace':
          setLines([]);
          saveHistory(positions, []);
          break;
        case '?':
        case 'k':
        case 'h':
          setActiveHelpTab('shortcuts');
          setIsHelpModalOpen(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, historyStep, history, positions, lines, frames, currentFrameIndex]);

  useEffect(() => {
    if (dimensions.width > 0) {
      const prev = prevDimRef.current;
      if (prev.w > 0 && (prev.w !== dimensions.width || prev.h !== dimensions.height)) {
        const isOrientChange = prev.isLandscape !== dimensions.isLandscape;

        if (positions.length > 0) {
          setPositions(curr => curr.map(p => {
            if (isOrientChange) {
              if (dimensions.isLandscape) {
                return { ...p, x: (1 - p.y / prev.h) * dimensions.width, y: (p.x / prev.w) * dimensions.height };
              } else {
                return { ...p, x: (p.y / prev.h) * dimensions.width, y: (1 - p.x / prev.w) * dimensions.height };
              }
            } else {
              return { ...p, x: (p.x / prev.w) * dimensions.width, y: (p.y / prev.h) * dimensions.height };
            }
          }));
        }

        if (lines.length > 0) {
          setLines(curr => curr.map(line => {
            const newPoints = [];
            for (let i = 0; i < line.points.length; i += 2) {
              const px = line.points[i];
              const py = line.points[i + 1];
              if (isOrientChange) {
                if (dimensions.isLandscape) {
                  newPoints.push((1 - py / prev.h) * dimensions.width);
                  newPoints.push((px / prev.w) * dimensions.height);
                } else {
                  newPoints.push((py / prev.h) * dimensions.width);
                  newPoints.push((1 - px / prev.w) * dimensions.height);
                }
              } else {
                newPoints.push((px / prev.w) * dimensions.width);
                newPoints.push((py / prev.h) * dimensions.height);
              }
            }
            return { ...line, points: newPoints };
          }));
        }

        setFrames(currFrames => currFrames.map(frame => {
          const updatedPos = frame.positions.map(p => {
            if (isOrientChange) {
              if (dimensions.isLandscape) {
                return { ...p, x: (1 - p.y / prev.h) * dimensions.width, y: (p.x / prev.w) * dimensions.height };
              } else {
                return { ...p, x: (p.y / prev.h) * dimensions.width, y: (1 - p.x / prev.w) * dimensions.height };
              }
            } else {
              return { ...p, x: (p.x / prev.w) * dimensions.width, y: (p.y / prev.h) * dimensions.height };
            }
          });

          const updatedLines = frame.lines.map(line => {
            const newPoints = [];
            for (let i = 0; i < line.points.length; i += 2) {
              const px = line.points[i];
              const py = line.points[i + 1];
              if (isOrientChange) {
                if (dimensions.isLandscape) {
                  newPoints.push((1 - py / prev.h) * dimensions.width);
                  newPoints.push((px / prev.w) * dimensions.height);
                } else {
                  newPoints.push((py / prev.h) * dimensions.width);
                  newPoints.push((1 - px / prev.w) * dimensions.height);
                }
              } else {
                newPoints.push((px / prev.w) * dimensions.width);
                newPoints.push((py / prev.h) * dimensions.height);
              }
            }
            return { ...line, points: newPoints };
          });

          return { ...frame, positions: updatedPos, lines: updatedLines };
        }));
      }
      prevDimRef.current = { w: dimensions.width, h: dimensions.height, isLandscape: dimensions.isLandscape };
    }
  }, [dimensions]);

  // Auto-restore & initialize positions
  useEffect(() => {
    if (dimensions.width > 0 && positions.length === 0) {
      if (activeBoard && activeBoard.positions && activeBoard.positions.length > 0) {
        setPositions(activeBoard.positions);
        setLines(activeBoard.lines || []);
        if (activeBoard.frames && activeBoard.frames.length > 0) {
          setFrames(activeBoard.frames);
          setCurrentFrameIndex(activeBoard.currentFrameIndex || 0);
        }
        if (history.length === 0) {
          setHistory([{ positions: JSON.parse(JSON.stringify(activeBoard.positions)), lines: JSON.parse(JSON.stringify(activeBoard.lines || [])) }]);
          setHistoryStep(0);
        }
      } else {
        const w = dimensions.width;
        const h = dimensions.height;
        const l = dimensions.isLandscape;

        const getPos = (rx: number, ry: number) => {
          if (l) return { x: (1 - ry) * w, y: rx * h };
          return { x: rx * w, y: ry * h };
        };

        const enemies = [
          { id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.05) },
          { id: 'away-1', isEnemy: true, ...getPos(0.3, 0.2) },
          { id: 'away-2', isEnemy: true, ...getPos(0.7, 0.2) },
          { id: 'away-3', isEnemy: true, ...getPos(0.4, 0.35) },
          { id: 'away-4', isEnemy: true, ...getPos(0.6, 0.35) }
        ];

        const ball = { id: 'ball', isBall: true, ...getPos(0.5, 0.5) };

        const gk = getPos(0.5, 0.9);
        const home = [
          { id: 'home-gk', label: 'GK', ...gk },
          { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.65) },
          { id: 'home-ala1', label: 'ALA', ...getPos(0.2, 0.4) },
          { id: 'home-ala2', label: 'ALA', ...getPos(0.8, 0.4) },
          { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.15) }
        ];

        const initialPos = [...home, ball];
        setPositions(initialPos);

        if (history.length === 0) {
          setHistory([{ positions: JSON.parse(JSON.stringify(initialPos)), lines: [] }]);
          setHistoryStep(0);
          setFrames([{ id: 'frame-1', positions: JSON.parse(JSON.stringify(initialPos)), lines: [] }]);
        }
      }
    }
  }, [dimensions.width, dimensions.height, dimensions.isLandscape, positions.length]);

  // Auto-persist active board state
  useEffect(() => {
    if (positions.length > 0) {
      setActiveBoard({
        positions,
        lines,
        frames,
        currentFrameIndex
      });
    }
  }, [positions, lines, frames, currentFrameIndex]);

  const exportAsPng = () => {
    if (stageRef.current) {
      const currentWidth = stageRef.current.width();
      const targetWidth = 1080;
      const exportRatio = Math.max(targetWidth / currentWidth, 2);

      const uri = stageRef.current.toDataURL({ pixelRatio: exportRatio });
      const link = document.createElement('a');
      link.download = '5tactiq-tactic.png';
      link.href = uri;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportAsGif = async () => {
    if (!stageRef.current) return;

    setIsExporting(true);
    showToast(t('tactics.msg_generating_gif'), 'success');

    try {
      // @ts-ignore
      const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
      const gif = GIFEncoder();

      const width = stageRef.current.width();
      const height = stageRef.current.height();

      // Keep GIF width reasonable (e.g., 800px) to prevent massive file sizes & slow processing
      const targetWidth = 800;
      const exportRatio = Math.max(targetWidth / width, 1);
      const scaledWidth = Math.round(width * exportRatio);
      const scaledHeight = Math.round(height * exportRatio);

      const originalIndex = currentFrameIndex;

      // Loop through frames to capture
      for (let i = 0; i < frames.length; i++) {
        setCurrentFrameIndex(i);
        setPositions(frames[i].positions);
        setLines(frames[i].lines);

        // Wait for React to render and Konva to draw
        await new Promise(resolve => setTimeout(resolve, 150));

        const canvas = stageRef.current.toCanvas({ pixelRatio: exportRatio });
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);

        const palette = quantize(imgData.data, 256);
        const index = applyPalette(imgData.data, palette);
        gif.writeFrame(index, scaledWidth, scaledHeight, { palette, delay: 1000 }); // 1 sec per frame
      }

      gif.finish();
      const buffer = gif.bytes();
      const blob = new Blob([buffer], { type: 'image/gif' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = '5tactiq-animation.gif';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Restore original state
      setCurrentFrameIndex(originalIndex);
      setPositions(frames[originalIndex].positions);
      setLines(frames[originalIndex].lines);

      showToast(t('tactics.msg_gif_success'), 'success');
    } catch (err) {
      console.error('Error generating GIF:', err);
      showToast(t('tactics.msg_gif_error'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (frames.length > 1) {
      exportAsGif();
    } else {
      exportAsPng();
    }
  };

  const setTactic = (tacticId: string) => {
    if (dimensions.width === 0) return;
    const w = dimensions.width;
    const h = dimensions.height;
    const l = dimensions.isLandscape;

    let newHomePos: any[] = [];
    let newEnemyPos: any[] = []; // Optional: adjust enemy based on tactic

    const getPos = (rx: number, ry: number) => {
      if (l) return { x: (1 - ry) * w, y: rx * h };
      return { x: rx * w, y: ry * h };
    };

    const gk = getPos(0.5, 0.95);

    // --- FORMATIONS ---
    if (tacticId === '1-2-1') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.7) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.2, 0.45) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.8, 0.45) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.2) }];
    } else if (tacticId === '2-2') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx1', label: 'FX', ...getPos(0.3, 0.7) }, { id: 'home-fx2', label: 'FX', ...getPos(0.7, 0.7) }, { id: 'home-pv1', label: 'PV', ...getPos(0.3, 0.3) }, { id: 'home-pv2', label: 'PV', ...getPos(0.7, 0.3) }];
    } else if (tacticId === '3-1') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.75) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.15, 0.55) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.85, 0.55) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.25) }];
    } else if (tacticId === '4-0') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-ala1', label: 'ALA', ...getPos(0.15, 0.6) }, { id: 'home-fx1', label: 'FX', ...getPos(0.38, 0.6) }, { id: 'home-fx2', label: 'FX', ...getPos(0.62, 0.6) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.85, 0.6) }];
    }
    // --- ATTACK ---
    else if (tacticId === 'att-wing') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.7) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.1, 0.3) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.9, 0.3) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.15) }];
      newEnemyPos = [{ id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.05) }, { id: 'away-1', isEnemy: true, ...getPos(0.4, 0.2) }, { id: 'away-2', isEnemy: true, ...getPos(0.6, 0.2) }, { id: 'away-3', isEnemy: true, ...getPos(0.45, 0.3) }, { id: 'away-4', isEnemy: true, ...getPos(0.55, 0.3) }];
    } else if (tacticId === 'att-center') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.6) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.35, 0.35) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.65, 0.35) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.15) }];
    } else if (tacticId === 'att-counter') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.8) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.2, 0.6) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.8, 0.6) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.3) }];
      newEnemyPos = [{ id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.05) }, { id: 'away-1', isEnemy: true, ...getPos(0.3, 0.7) }, { id: 'away-2', isEnemy: true, ...getPos(0.7, 0.7) }, { id: 'away-3', isEnemy: true, ...getPos(0.4, 0.85) }, { id: 'away-4', isEnemy: true, ...getPos(0.6, 0.85) }];
    } else if (tacticId === 'att-powerplay') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...getPos(0.5, 0.4) }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.25) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.15, 0.15) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.85, 0.15) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.05) }];
      newEnemyPos = [{ id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.02) }, { id: 'away-1', isEnemy: true, ...getPos(0.3, 0.1) }, { id: 'away-2', isEnemy: true, ...getPos(0.7, 0.1) }, { id: 'away-3', isEnemy: true, ...getPos(0.4, 0.2) }, { id: 'away-4', isEnemy: true, ...getPos(0.6, 0.2) }];
    }
    // --- DEFENSE ---
    else if (tacticId === 'def-zone') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.35, 0.75) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.65, 0.75) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.35, 0.55) }, { id: 'home-pv', label: 'PV', ...getPos(0.65, 0.55) }];
    } else if (tacticId === 'def-press') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.4) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.2, 0.2) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.8, 0.2) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.1) }];
      newEnemyPos = [{ id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.05) }, { id: 'away-1', isEnemy: true, ...getPos(0.2, 0.15) }, { id: 'away-2', isEnemy: true, ...getPos(0.8, 0.15) }, { id: 'away-3', isEnemy: true, ...getPos(0.4, 0.3) }, { id: 'away-4', isEnemy: true, ...getPos(0.6, 0.3) }];
    } else if (tacticId === 'def-anti-powerplay') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.8) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.3, 0.75) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.7, 0.75) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.65) }];
      newEnemyPos = [{ id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.4) }, { id: 'away-1', isEnemy: true, ...getPos(0.2, 0.2) }, { id: 'away-2', isEnemy: true, ...getPos(0.8, 0.2) }, { id: 'away-3', isEnemy: true, ...getPos(0.3, 0.6) }, { id: 'away-4', isEnemy: true, ...getPos(0.7, 0.6) }];
    }
    // --- SITUATIONS ---
    else if (tacticId === 'sit-freekick' || tacticId === 'sit-setpiece') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.1, 0.15) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.3, 0.2) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.4, 0.25) }, { id: 'home-pv', label: 'PV', ...getPos(0.6, 0.2) }];
      newEnemyPos = [{ id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.05) }, { id: 'away-1', isEnemy: true, ...getPos(0.2, 0.15) }, { id: 'away-2', isEnemy: true, ...getPos(0.3, 0.15) }, { id: 'away-3', isEnemy: true, ...getPos(0.5, 0.25) }, { id: 'away-4', isEnemy: true, ...getPos(0.6, 0.1) }];
    } else if (tacticId === 'sit-corner') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.95, 0.05) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.8, 0.15) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.65, 0.1) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.2) }];
      newEnemyPos = [{ id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.05) }, { id: 'away-1', isEnemy: true, ...getPos(0.8, 0.08) }, { id: 'away-2', isEnemy: true, ...getPos(0.7, 0.15) }, { id: 'away-3', isEnemy: true, ...getPos(0.55, 0.1) }, { id: 'away-4', isEnemy: true, ...getPos(0.4, 0.2) }];
    } else if (tacticId === 'sit-kickin') {
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.05, 0.4) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.2, 0.4) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.3, 0.3) }, { id: 'home-pv', label: 'PV', ...getPos(0.6, 0.3) }];
      newEnemyPos = [{ id: 'away-gk', isEnemy: true, ...getPos(0.5, 0.05) }, { id: 'away-1', isEnemy: true, ...getPos(0.25, 0.35) }, { id: 'away-2', isEnemy: true, ...getPos(0.35, 0.3) }, { id: 'away-3', isEnemy: true, ...getPos(0.45, 0.4) }, { id: 'away-4', isEnemy: true, ...getPos(0.6, 0.35) }];
    } else {
      // Fallback for others that don't have explicit positions mapped yet
      newHomePos = [{ id: 'home-gk', label: 'GK', ...gk }, { id: 'home-fx', label: 'FX', ...getPos(0.5, 0.65) }, { id: 'home-ala1', label: 'ALA', ...getPos(0.2, 0.4) }, { id: 'home-ala2', label: 'ALA', ...getPos(0.8, 0.4) }, { id: 'home-pv', label: 'PV', ...getPos(0.5, 0.15) }];
    }

    setPositions(curr => {
      let finalPositions = [...curr];

      // Update Home
      if (newHomePos.length > 0) {
        finalPositions = finalPositions.filter(p => p.isEnemy || p.isBall);
        finalPositions = [...newHomePos, ...finalPositions];
      }

      // Update Enemy if explicitly defined
      if (newEnemyPos.length > 0) {
        finalPositions = finalPositions.filter(p => !p.isEnemy);
        finalPositions = [...finalPositions, ...newEnemyPos];
      }

      setTimeout(() => saveHistory(finalPositions, lines), 0);
      return finalPositions;
    });
  };

  const handleDragEnd = (e: any, id: string) => {
    const newPositions = positions.map(p => {
      if (p.id === id) {
        return { ...p, x: e.target.x(), y: e.target.y() };
      }
      return p;
    });
    setPositions(newPositions);
    saveHistory(newPositions, lines);
  };

  const handleTextSubmit = () => {
    if (pendingTextPos && textInput.trim()) {
      const newPos = { id: `text-${Date.now()}`, x: pendingTextPos.x, y: pendingTextPos.y, isText: true, text: textInput.trim() };
      const updatedPositions = [...positions, newPos];
      setPositions(updatedPositions);
      saveHistory(updatedPositions, lines);
    }
    setPendingTextPos(null);
    setTextInput('');
  };

  const handleMouseDown = (e: any) => {
    if (tool === 'cursor') return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    if (tool === 'cone') {
      const newPos = { id: `cone-${Date.now()}`, x: point.x, y: point.y, isCone: true };
      const updatedPositions = [...positions, newPos];
      setPositions(updatedPositions);
      saveHistory(updatedPositions, lines);
      return;
    }

    if (tool === 'text') {
      setPendingTextPos({ x: point.x, y: point.y });
      setTextInput('');
      return;
    }

    if (tool === 'eraser' && eraserMode === 'object') {
      return;
    }

    setIsDrawing(true);
    let color = '#ffea00'; // Default pen
    if (tool === 'eraser') color = '#ffffff';
    if (tool === 'move' || tool === 'run') color = '#ffffff'; // White for move/run
    if (tool === 'pass') color = '#fbbf24'; // Yellow-amber for pass
    if (tool === 'zone') color = 'rgba(255, 255, 255, 0.2)'; // Semi-transparent white

    setLines([...lines, { tool, points: [point.x, point.y, point.x, point.y], color, size: tool === 'eraser' ? eraserSize : 3 }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || tool === 'cursor' || tool === 'cone' || tool === 'text') return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    let lastLine = lines[lines.length - 1];
    const pts = lastLine.points;

    if (tool === 'zone') {
      // For zone, we only need start and end coordinates
      lastLine.points = [pts[0], pts[1], point.x, point.y];
    } else {
      // Smooth the line by ignoring points that are too close to the previous point
      if (pts.length >= 2) {
        const lastX = pts[pts.length - 2];
        const lastY = pts[pts.length - 1];
        const dist = Math.sqrt(Math.pow(point.x - lastX, 2) + Math.pow(point.y - lastY, 2));

        const isArrow = tool === 'move' || tool === 'run' || tool === 'pass';
        const threshold = isArrow ? 20 : 5; // Tactical lines (arrows) need to be very smooth

        if (dist < threshold) return; // Skip this point
      }

      lastLine.points = lastLine.points.concat([point.x, point.y]);
    }

    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory(positions, lines);
    }
  };

  // Rendering standard Futsal Pitch
  const renderFutsalPitch = () => {
    const L_WIDTH = 200;
    const L_HEIGHT = 400;
    const scale = dimensions.isLandscape ? dimensions.height / L_WIDTH : dimensions.width / L_WIDTH;
    const courtColor = "#15803d"; // Artificial Grass Green (green-700)
    const lineColor = "rgba(255,255,255,0.7)";
    const lineWidth = 3 / scale;

    return (
      <Group
        x={dimensions.isLandscape ? 0 : 0}
        y={dimensions.isLandscape ? dimensions.height : 0}
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

        {/* Top Penalty Area */}
        <Path
          data={`M 25 0 A 60 60 0 0 0 85 60 L 115 60 A 60 60 0 0 0 175 0`}
          stroke={lineColor}
          strokeWidth={lineWidth}
        />
        {/* Top Goal Area Base */}
        <Rect x={85} y={0} width={30} height={15} stroke={lineColor} strokeWidth={lineWidth} opacity={0.2} fill="white" />
        {/* Top Penalty Marks */}
        <Circle x={100} y={60} radius={3 / scale} fill={lineColor} />
        <Circle x={100} y={100} radius={3 / scale} fill={lineColor} />

        {/* Bottom Penalty Area */}
        <Path
          data={`M 25 400 A 60 60 0 0 1 85 340 L 115 340 A 60 60 0 0 1 175 400`}
          stroke={lineColor}
          strokeWidth={lineWidth}
        />
        {/* Bottom Goal Area Base */}
        <Rect x={85} y={385} width={30} height={15} stroke={lineColor} strokeWidth={lineWidth} opacity={0.2} fill="white" />
        {/* Bottom Penalty Marks */}
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

  if (isLoading) {
    return <TacticsSkeleton />;
  }

  return (
    <>
      {/* Overlay for Portrait Mobile */}
      <div className="flex sm:hidden fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm items-center justify-center p-4 portrait:flex landscape:hidden">
        <div className="bg-surface w-full max-w-sm flex flex-col border-4 border-primary shadow-2xl p-8 items-center text-center animate-in zoom-in-95 duration-200">
          <div className="mb-6 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <RotateCcw size={32} className="text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary uppercase mb-3">{t('tactics.rotate_screen')}</h2>
          <p className="text-text-muted text-sm mb-8 font-medium">{t('tactics.rotate_desc')}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-primary text-white border-4 border-primary shadow-[4px_4px_0px_0px_#475C44] hover:shadow-[2px_2px_0px_0px_#475C44] hover:translate-x-[2px] hover:translate-y-[2px] font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft size={18} /> {t('tactics.back')}
          </button>
        </div>
      </div>

      <div className="min-h-screen h-screen bg-background flex flex-col font-sans overflow-hidden">
        {/* Header */}
        <div className="bg-surface px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between border-b-2 border-border-main shadow-sm relative z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all"
              title={t('tactics.back')}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary uppercase tracking-tight">
              {t('tactics.title')}
            </h1>
          </div>

          <button
            onClick={() => { setActiveHelpTab('guide'); setIsHelpModalOpen(true); }}
            className="flex items-center gap-1.5 font-display uppercase tracking-widest text-sm text-secondary hover:text-primary transition-colors font-bold"
            title={t('tactics.help_shortcut')}
          >
            <HelpCircle size={18} />
            <span className="hidden sm:inline">{t('tactics.help')}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden relative p-3 sm:p-4 gap-3 sm:gap-4 max-w-[1920px] mx-auto w-full">

          {/* Left Vertical Toolbar */}
          <div 
            onScroll={updateEraserMenuPos}
            className="flex w-14 sm:w-16 bg-surface border-2 border-border-main p-1 sm:p-2 flex-col gap-2 sm:gap-3 relative z-10 items-center py-2 sm:py-4 shrink-0 overflow-y-auto hide-scrollbar shadow-sm"
          >

            {/* Tools Group */}
            <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
              <button
                onClick={() => setTool('cursor')}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'cursor' ? 'bg-primary text-white border-primary shadow-sm' : 'text-primary border-transparent hover:bg-primary/10'}`}
                title={`${t('tactics.tool_cursor')} (V)`}
              >
                <MousePointer2 size={20} />
              </button>
              <button
                onClick={() => setTool('move')}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'move' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'text-primary border-transparent hover:bg-primary/10'}`}
                title={`${t('tactics.tool_move')} (M)`}
              >
                <TrendingUp size={20} />
              </button>
              <button
                onClick={() => setTool('run')}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'run' ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'text-primary border-transparent hover:bg-primary/10'}`}
                title={`${t('tactics.tool_run')} (R)`}
              >
                <FastForward size={20} />
              </button>
              <button
                onClick={() => setTool('pass')}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'pass' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'text-primary border-transparent hover:bg-primary/10'}`}
                title={`${t('tactics.tool_pass')} (A)`}
              >
                <CornerUpRight size={20} />
              </button>
              <div className="relative w-full">
                <button
                  ref={eraserBtnRef}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setEraserMenuPos({ top: rect.top, left: rect.right + 12 });
                    
                    if (tool === 'eraser' && eraserMode === 'brush') {
                      setShowEraserMenu(!showEraserMenu);
                    } else {
                      setTool('eraser');
                      setEraserMode('brush');
                      setShowEraserMenu(false);
                    }
                  }}
                  className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'eraser' && eraserMode === 'brush' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'text-primary border-transparent hover:bg-primary/10'}`}
                  title={`${t('tactics.tool_eraser')} (E)`}
                >
                  <Eraser size={20} />
                </button>
                {showEraserMenu && tool === 'eraser' && (
                  <div 
                    className="fixed bg-surface border-2 border-border-main shadow-2xl p-3.5 flex flex-col gap-2.5 z-[100] w-52 text-text-main animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: Math.max(10, eraserMenuPos.top - 15), left: eraserMenuPos.left }}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center pb-1 border-b border-border-main">
                      <span className="font-display text-xs uppercase tracking-widest font-bold text-secondary">
                        {t('tactics.eraser_size', 'KÍCH THƯỚC')}
                      </span>
                      <span className="font-display text-sm font-bold text-primary">
                        {eraserSize}PX
                      </span>
                    </div>

                    {/* Range Slider */}
                    <div className="flex items-center gap-2.5 px-2.5 py-2 bg-surface-2 border border-border-main">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                      <input
                        type="range"
                        min="5"
                        max="80"
                        value={eraserSize}
                        onChange={(e) => setEraserSize(Number(e.target.value))}
                        className="flex-1 w-full accent-primary cursor-pointer h-1.5 bg-border-main rounded-lg"
                      />
                      <div className="w-3.5 h-3.5 rounded-full bg-primary shrink-0" />
                    </div>
                  </div>
                )}
              </div>
              <div className="w-8 h-px bg-primary/20 mx-auto my-1"></div>
              <button
                onClick={handleUndo}
                disabled={historyStep === 0}
                className="p-2 transition-all flex items-center justify-center text-primary hover:bg-primary/10 w-full aspect-square disabled:opacity-30 disabled:cursor-not-allowed"
                title={`${t('tactics.tool_undo')} (Ctrl+Z)`}
              >
                <Undo2 size={20} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyStep >= history.length - 1}
                className="p-2 transition-all flex items-center justify-center text-primary hover:bg-primary/10 w-full aspect-square disabled:opacity-30 disabled:cursor-not-allowed"
                title={`${t('tactics.tool_redo')} (Ctrl+Y)`}
              >
                <Redo2 size={20} />
              </button>
              <div className="w-8 h-px bg-primary/20 mx-auto my-1"></div>
              <button
                onClick={() => setTool('cone')}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'cone' ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'text-primary border-transparent hover:bg-primary/10'}`}
                title={`${t('tactics.tool_cone')} (C)`}
              >
                <Triangle size={20} />
              </button>
              <button
                onClick={() => setTool('zone')}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'zone' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'text-primary border-transparent hover:bg-primary/10'}`}
                title={`${t('tactics.tool_zone')} (Z)`}
              >
                <SquareDashed size={20} />
              </button>
              <button
                onClick={() => setTool('text')}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'text' ? 'bg-pink-600 text-white border-pink-600 shadow-sm' : 'text-primary border-transparent hover:bg-primary/10'}`}
                title={`${t('tactics.tool_text')} (T)`}
              >
                <Type size={20} />
              </button>
              <div className="w-8 h-px bg-primary/20 mx-auto my-1"></div>
              <button
                onClick={() => {
                  if (dimensions.width === 0) return;
                  const hasEnemies = positions.some(p => p.isEnemy);
                  if (hasEnemies) {
                    const newPos = positions.filter(p => !p.isEnemy);
                    setPositions(newPos);
                    setTimeout(() => saveHistory(newPos, lines), 0);
                  } else {
                    const w = dimensions.width;
                    const h = dimensions.height;
                    const l = dimensions.isLandscape;
                    const getPos = (rx: number, ry: number) => {
                      if (l) return { x: (1 - ry) * w, y: rx * h };
                      return { x: rx * w, y: ry * h };
                    };
                    const enemies = [
                      { id: `away-gk-${Date.now()}`, isEnemy: true, ...getPos(0.5, 0.05) },
                      { id: `away-1-${Date.now()}`, isEnemy: true, ...getPos(0.3, 0.2) },
                      { id: `away-2-${Date.now()}`, isEnemy: true, ...getPos(0.7, 0.2) },
                      { id: `away-3-${Date.now()}`, isEnemy: true, ...getPos(0.4, 0.35) },
                      { id: `away-4-${Date.now()}`, isEnemy: true, ...getPos(0.6, 0.35) }
                    ];
                    const newPos = [...positions, ...enemies];
                    setPositions(newPos);
                    setTimeout(() => saveHistory(newPos, lines), 0);
                  }
                }}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${positions.some(p => p.isEnemy) ? 'bg-secondary text-white border-secondary shadow-inner' : 'text-text-muted border-transparent hover:text-primary hover:bg-primary/10'}`}
                title={t('tactics.tool_toggle_opponent')}
              >
                <Users size={20} />
              </button>
              <div className="w-8 h-px bg-primary/20 mx-auto my-1"></div>
              <button
                onClick={() => {
                  setTool('eraser');
                  setEraserMode('object');
                  setShowEraserMenu(false);
                }}
                className={`p-2 transition-all flex items-center justify-center w-full aspect-square border ${tool === 'eraser' && eraserMode === 'object' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'text-text-muted border-transparent hover:text-red-500 hover:bg-red-50'}`}
                title={t('tactics.eraser_object', 'Xóa theo chỉ thị')}
              >
                <Scissors size={20} />
              </button>
              <button
                onClick={handleResetBoard}
                className="p-2 transition-all flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 w-full aspect-square border border-transparent"
                title={`${t('tactics.tool_reset')} (0)`}
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => {
                  setLines([]);
                  const newPositions = positions.filter(p => !p.isCone && !p.isText);
                  setPositions(newPositions);
                  saveHistory(newPositions, []);
                }}
                className="p-2 transition-all flex items-center justify-center text-red-600 hover:bg-red-50 w-full aspect-square"
                title={`${t('tactics.tool_clear')} (Del)`}
              >
                <Trash2 size={20} />
              </button>
            </div>

            {/* Actions Group */}
            <div className="flex flex-col gap-1.5 sm:gap-2 w-full mt-auto">
              <div className="w-8 h-px bg-primary/20 mx-auto mb-1"></div>
              <button
                onClick={() => setIsTemplatesModalOpen(true)}
                className="lg:hidden p-2 transition-all flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 w-full aspect-square border border-transparent"
                title={t('tactics.templates')}
              >
                <LayoutTemplate size={20} />
              </button>
              <button
                onClick={() => setIsLibraryModalOpen(true)}
                className="p-2 transition-all flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 w-full aspect-square"
                title={t('tactics.library')}
              >
                <BookOpen size={20} />
              </button>
              <button
                onClick={handleExport}
                className="p-2 transition-all flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 w-full aspect-square"
                title={t('tactics.export')}
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="p-2 transition-all flex items-center justify-center text-primary bg-primary/10 border border-primary/30 hover:bg-primary hover:text-white w-full aspect-square"
                title={t('tactics.save_playbook')}
              >
                <Save size={20} />
              </button>
            </div>
          </div>

          {/* Right Column: Canvas + Bottom Panel */}
          <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">

            {/* Center Canvas */}
            <div className="flex-1 bg-surface border-2 border-border-main p-2 sm:p-4 flex justify-center items-center relative min-h-0 min-w-0 overflow-hidden shadow-sm" ref={containerRef} id="tactical-board-container">
              {dimensions.width > 0 && (
                <div className="overflow-hidden shadow-2xl rounded-xl sm:rounded-2xl relative bg-[#15803d]">
                  <Stage
                    width={dimensions.width}
                    height={dimensions.height}
                    ref={stageRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchEnd={handleMouseUp}
                  >
                    <Layer>
                      {renderFutsalPitch()}
                    </Layer>
                    <Layer>
                      {lines.map((line, i) => {
                        const isArrow = line.tool === 'move' || line.tool === 'run' || line.tool === 'pass';
                        const dashPattern = line.tool === 'run' ? [10, 10] : [];
                        
                        const handleObjectErase = (e: any) => {
                          if (tool === 'eraser' && eraserMode === 'object') {
                            e.cancelBubble = true;
                            const updatedLines = lines.filter((_, index) => index !== i);
                            setLines(updatedLines);
                            saveHistory(positions, updatedLines);
                          }
                        };

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
                              draggable={tool === 'cursor' && !isPlaying}
                              onMouseDown={handleObjectErase}
                              onTouchStart={handleObjectErase}
                              onDragEnd={(e) => {
                                const newX = e.target.x();
                                const newY = e.target.y();
                                const updatedLines = [...lines];
                                updatedLines[i] = {
                                  ...updatedLines[i],
                                  points: [newX, newY, newX + rectW, newY + rectH]
                                };
                                setLines(updatedLines);
                                saveHistory(positions, updatedLines);
                              }}
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
                              onMouseDown={handleObjectErase}
                              onTouchStart={handleObjectErase}
                            />
                          );
                        }

                        return (
                          <Line
                            key={i}
                            points={line.points}
                            stroke={line.color}
                            strokeWidth={line.tool === 'eraser' ? (line.size || 24) : (line.size || 3)}
                            tension={0.5}
                            lineCap="round"
                            lineJoin="round"
                            globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                            onMouseDown={handleObjectErase}
                            onTouchStart={handleObjectErase}
                          />
                        );
                      })}
                    </Layer>
                    <Layer>
                      {(playbackPositions || positions).map((pos) => (
                        <Group
                          key={pos.id}
                          draggable={(tool === 'cursor' || tool === 'cone' || tool === 'text') && !isPlaying}
                          x={pos.x}
                          y={pos.y}
                          onClick={() => {
                            if (tool === 'eraser' && (pos.isCone || pos.isText)) {
                              const newPositions = positions.filter(p => p.id !== pos.id);
                              setPositions(newPositions);
                              saveHistory(newPositions, lines);
                            }
                          }}
                          onTap={() => {
                            if (tool === 'eraser' && (pos.isCone || pos.isText)) {
                              const newPositions = positions.filter(p => p.id !== pos.id);
                              setPositions(newPositions);
                              saveHistory(newPositions, lines);
                            }
                          }}
                          onDragStart={() => hapticImpact('light')}
                          onDragEnd={(e) => {
                            hapticImpact('heavy');
                            handleDragEnd(e, pos.id);
                          }}
                          dragBoundFunc={(pos) => {
                            return {
                              x: Math.max(0, Math.min(pos.x, dimensions.width)),
                              y: Math.max(0, Math.min(pos.y, dimensions.height))
                            };
                          }}
                        >
                          {pos.isText ? (
                            <Text
                              text={pos.text || ''}
                              fontSize={18}
                              fontFamily="Arial"
                              fill="#ffffff"
                              shadowColor="black"
                              shadowBlur={4}
                              shadowOpacity={0.8}
                              shadowOffset={{ x: 1, y: 1 }}
                              fontStyle="bold"
                              offsetX={20} // Approximate centering
                              offsetY={10}
                            />
                          ) : pos.isCone ? (
                            <Group>
                              <Circle radius={10} fill="#f97316" stroke="#ffffff" strokeWidth={2} shadowColor="black" shadowBlur={4} shadowOpacity={0.4} />
                              <Circle radius={3} fill="#ffffff" />
                            </Group>
                          ) : pos.isBall ? (
                            <Group>
                              {ballImage ? (
                                <KonvaImage
                                  image={ballImage}
                                  x={-12}
                                  y={-12}
                                  width={24}
                                  height={24}
                                  shadowColor="black"
                                  shadowBlur={5}
                                  shadowOpacity={0.3}
                                />
                              ) : (
                                <Circle
                                  radius={10}
                                  fill="#ffffff"
                                  stroke="#1e293b"
                                  strokeWidth={2}
                                />
                              )}
                            </Group>
                          ) : (
                            <Circle
                              radius={pos.isEnemy ? 14 : 16}
                              fill={pos.isEnemy ? "#3b82f6" : "#ef4444"}
                              stroke="#ffffff"
                              strokeWidth={2}
                              shadowColor="black"
                              shadowBlur={5}
                              shadowOpacity={0.3}
                            />
                          )}

                          {!pos.isEnemy && !pos.isBall && (
                            <Text
                              text={pos.label || ''}
                              fontSize={11}
                              fontFamily="Arial"
                              fill="white"
                              align="center"
                              verticalAlign="middle"
                              x={-16} y={-5} width={32}
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

            {/* Bottom Tactics Panel */}
            <div className="hidden lg:flex w-full bg-surface border-2 border-border-main flex-col shrink-0 shadow-sm">
              <div className="flex border-b-2 border-primary/10 overflow-x-auto hide-scrollbar px-2 sm:px-4 bg-background">
                {[
                  { id: 'formation', label: t('tactics.tab_formation') },
                  { id: 'attack', label: t('tactics.tab_attack') },
                  { id: 'defense', label: t('tactics.tab_defense') },
                  { id: 'situations', label: t('tactics.tab_situations') }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 text-sm font-display uppercase tracking-widest transition-colors whitespace-nowrap border-b-2 ${activeTab === tab.id ? 'border-primary text-primary font-bold bg-surface' : 'border-transparent text-text-muted hover:text-text-main'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div
                ref={bottomScrollRef}
                onMouseDown={handleScrollMouseDown}
                onMouseLeave={handleScrollMouseLeave}
                onMouseUp={handleScrollMouseUp}
                onMouseMove={handleScrollMouseMove}
                className="p-3 sm:p-4 w-full overflow-x-auto hide-scrollbar cursor-grab active:cursor-grabbing"
              >
                <div className="flex flex-row gap-2 sm:gap-3 w-max min-w-full">
                  {activeTab === 'formation' && [
                    { id: '1-2-1', title: '1-2-1', sub: '', desc: t('tactics.form_121') },
                    { id: '2-2', title: '2-2', sub: '', desc: t('tactics.form_22') },
                    { id: '3-1', title: '3-1', sub: '', desc: t('tactics.form_31') },
                    { id: '4-0', title: '4-0', sub: '', desc: t('tactics.form_40') }
                  ].map(item => (
                    <button key={item.id} onClick={() => setTactic(item.id)} className="flex flex-col text-left p-3 border-2 border-border-main hover:border-primary hover:bg-primary/5 transition-all group bg-surface shrink-0 w-64 sm:w-72 h-[104px]">
                      <div className="font-display uppercase font-bold text-primary mb-1 text-sm sm:text-base">{item.title} <span className="text-[10px] sm:text-xs font-sans normal-case opacity-60 font-medium">{item.sub}</span></div>
                      <div className="text-xs text-text-muted leading-tight">{item.desc}</div>
                    </button>
                  ))}

                  {activeTab === 'attack' && [
                    { id: 'att-wing', title: t('tactics.att_wing'), sub: '', desc: t('tactics.att_wing_desc') },
                    { id: 'att-center', title: t('tactics.att_center'), sub: '', desc: t('tactics.att_center_desc') },
                    { id: 'att-2p', title: t('tactics.att_2p'), sub: '', desc: t('tactics.att_2p_desc') },
                    { id: 'att-counter', title: t('tactics.att_counter'), sub: '', desc: t('tactics.att_counter_desc') },
                    { id: 'att-powerplay', title: t('tactics.att_powerplay'), sub: '', desc: t('tactics.att_powerplay_desc') },
                  ].map(item => (
                    <button key={item.id} onClick={() => setTactic(item.id)} className="flex flex-col text-left p-3 border-2 border-border-main hover:border-emerald-600 hover:bg-emerald-50/50 transition-all group bg-surface shrink-0 w-64 sm:w-72 h-[104px]">
                      <div className="font-display uppercase font-bold text-emerald-700 mb-1 text-sm sm:text-base">{item.title} <span className="text-[10px] sm:text-xs font-sans normal-case opacity-60 font-medium">{item.sub}</span></div>
                      <div className="text-xs text-text-muted leading-tight">{item.desc}</div>
                    </button>
                  ))}

                  {activeTab === 'defense' && [
                    { id: 'def-man', title: t('tactics.def_man'), sub: '', desc: t('tactics.def_man_desc') },
                    { id: 'def-zone', title: t('tactics.def_zone'), sub: '', desc: t('tactics.def_zone_desc') },
                    { id: 'def-cover', title: t('tactics.def_cover'), sub: '', desc: t('tactics.def_cover_desc') },
                    { id: 'def-anti-powerplay', title: t('tactics.def_anti_powerplay'), sub: '', desc: t('tactics.def_anti_powerplay_desc') },
                  ].map(item => (
                    <button key={item.id} onClick={() => setTactic(item.id)} className="flex flex-col text-left p-3 border-2 border-border-main hover:border-amber-600 hover:bg-amber-50/50 transition-all group bg-surface shrink-0 w-64 sm:w-72 h-[104px]">
                      <div className="font-display uppercase font-bold text-amber-700 mb-1 text-sm sm:text-base">{item.title} <span className="text-[10px] sm:text-xs font-sans normal-case opacity-60 font-medium">{item.sub}</span></div>
                      <div className="text-xs text-text-muted leading-tight">{item.desc}</div>
                    </button>
                  ))}

                  {activeTab === 'situations' && [
                    { id: 'sit-freekick', title: t('tactics.sit_freekick'), sub: '< 10m', desc: t('tactics.sit_freekick_desc') },
                    { id: 'sit-corner', title: t('tactics.sit_corner'), sub: '', desc: t('tactics.sit_corner_desc') },
                    { id: 'sit-kickin', title: t('tactics.sit_kickin'), sub: '', desc: t('tactics.sit_kickin_desc') },
                    { id: 'sit-gk', title: t('tactics.sit_gk'), sub: '', desc: t('tactics.sit_gk_desc') }
                  ].map(item => (
                    <button key={item.id} onClick={() => setTactic(item.id)} className="flex flex-col text-left p-3 border-2 border-border-main hover:border-purple-600 hover:bg-purple-50/50 transition-all group bg-surface shrink-0 w-64 sm:w-72 h-[104px]">
                      <div className="font-display uppercase font-bold text-purple-700 mb-1 text-sm sm:text-base">{item.title} <span className="text-[10px] sm:text-xs font-sans normal-case opacity-60 font-medium">{item.sub}</span></div>
                      <div className="text-xs text-text-muted leading-tight">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Animation Timeline (Desktop & Landscape Mobile) */}
          <div className="flex bg-surface border-2 border-border-main p-1 sm:p-2 py-2 sm:py-4 flex-col gap-2 sm:gap-3 overflow-y-auto overflow-x-hidden hide-scrollbar shrink-0 w-14 sm:w-[72px] h-full items-center relative z-10 shadow-sm">
            <button
              onClick={isPlaying ? handleStop : handlePlay}
              disabled={frames.length < 2}
              className={`w-10 h-10 flex justify-center items-center font-semibold transition-all shrink-0 mt-2 border ${isPlaying ? 'bg-red-600 text-white border-red-600 shadow-sm' : frames.length < 2 ? 'bg-background text-text-muted border-border-main' : 'bg-primary text-white border-primary shadow-sm hover:bg-primary/90'}`}
              title={isPlaying ? t('tactics.stop') : t('tactics.play')}
            >
              {isPlaying ? <Square fill="currentColor" size={16} /> : <Play fill="currentColor" size={18} className="ml-0.5" />}
            </button>

            <div className="w-8 h-px bg-primary/20 shrink-0 my-1"></div>

            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-3 items-center w-full py-2">
              {frames.map((frame, idx) => (
                <div key={frame.id} className="relative group shrink-0 w-full flex justify-center">
                  <button
                    onClick={() => handleSelectFrame(idx)}
                    className={`w-10 h-10 font-display font-bold text-sm transition-all flex justify-center items-center border overflow-hidden ${currentFrameIndex === idx && !isPlaying ? 'bg-primary text-white border-primary shadow-sm scale-110' : 'bg-surface text-text-muted border-border-main hover:bg-primary/5 hover:text-primary'} ${isPlaying ? 'opacity-50 pointer-events-none' : ''}`}
                    title={`${t('tactics.step')} ${idx + 1}`}
                  >
                    {idx + 1}
                    {frames.length > 1 && !isPlaying && (
                      <div
                        onClick={(e) => { e.stopPropagation(); handleDeleteFrame(idx); }}
                        className="absolute top-0 right-0 bg-red-600 text-white p-1 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 flex justify-center items-center z-10"
                        title={t('tactics.delete_step')}
                      >
                        <Trash2 size={10} />
                      </div>
                    )}
                  </button>
                </div>
              ))}

              <button
                onClick={handleAddFrame}
                disabled={isPlaying}
                className="w-10 h-10 transition-all border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 flex items-center justify-center shrink-0 disabled:opacity-50 group mt-1"
                title={t('tactics.next_step')}
              >
                <Plus size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
        {/* Save Modal */}
        <BottomSheet
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          title={t('tactics.save_playbook')}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">{t('tactics.save_name')}</label>
              <input
                type="text"
                inputMode="text"
                enterKeyHint="done"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={t('tactics.save_placeholder')}
                className="w-full px-4 py-2 bg-background border border-border-main focus:outline-none focus:ring-0 focus:border-primary transition-all text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1">{t('tactics.category')}</label>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setSaveCategory('training')} className={`px-3 py-2 text-sm font-bold uppercase transition-all border ${saveCategory === 'training' ? 'bg-primary text-white border-primary shadow-sm' : 'bg-background text-text-muted border-border-main hover:bg-surface'}`}>{t('tactics.cat_training')}</button>
                <button onClick={() => setSaveCategory('opponent')} className={`px-3 py-2 text-sm font-bold uppercase transition-all border ${saveCategory === 'opponent' ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-background text-text-muted border-border-main hover:bg-surface'}`}>{t('tactics.cat_opponent')}</button>
                <button onClick={() => setSaveCategory('other')} className={`px-3 py-2 text-sm font-bold uppercase transition-all border ${saveCategory === 'other' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-background text-text-muted border-border-main hover:bg-surface'}`}>{t('tactics.cat_other')}</button>
              </div>
            </div>
            <button
              onClick={() => {
                if (!saveName.trim()) return showToast(t('tactics.err_empty_name'), 'error');

                const finalFrames = frames.map((f, i) =>
                  i === currentFrameIndex ? { ...f, positions, lines } : f
                );

                addTactic({
                  name: saveName.trim(),
                  category: saveCategory,
                  frames: finalFrames
                });
                setIsSaveModalOpen(false);
                setSaveName('');
                showToast(t('tactics.msg_saved'));
              }}
              className="w-full mt-2 bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95 flex items-center justify-center gap-2"
            >
              <Save size={18} /> {t('tactics.save_btn')}
            </button>
          </div>
        </BottomSheet>

        {/* Library Modal */}
        <BottomSheet
          isOpen={isLibraryModalOpen}
          onClose={() => setIsLibraryModalOpen(false)}
          title={t('tactics.library')}
        >
          <div className="flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                placeholder={t('tactics.search_placeholder')}
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="block w-full pl-9 pr-3 py-3 border-2 border-border-main bg-surface focus:outline-none focus:border-primary transition-colors text-sm font-bold placeholder:font-normal"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {savedTactics.filter(t => t.name.toLowerCase().includes(librarySearch.toLowerCase())).length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center text-primary/40 bg-surface border-2 border-dashed border-border-main h-[300px]">
                  <FolderOpen size={40} className="mb-3 opacity-30" />
                  <p className="text-sm sm:text-lg font-bold text-text-muted uppercase tracking-wide">{t('tactics.empty_library')}</p>
                  <p className="text-xs sm:text-sm mt-1">{t('tactics.empty_library_desc')}</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:gap-3">
                  {savedTactics.filter(t => t.name.toLowerCase().includes(librarySearch.toLowerCase())).map((tactic) => (
                    <div key={tactic.id} className="bg-surface border-2 border-border-main p-3 flex items-center gap-3 hover:border-primary transition-colors">
                      <div className={`p-2 shrink-0 border-2 ${tactic.category === 'training' ? 'bg-primary/10 text-primary border-border-main' : tactic.category === 'opponent' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-surface-2 text-text-muted border-border-main'}`}>
                        {tactic.category === 'training' ? <FastForward size={16} /> : tactic.category === 'opponent' ? <Users size={16} /> : <Settings size={16} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-text-main text-xs sm:text-base uppercase tracking-wide truncate">{tactic.name}</h4>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 text-[10px] sm:text-xs font-bold text-text-muted">
                          <span className={`px-1.5 py-0.5 border text-[9px] sm:text-[10px] uppercase tracking-wider rounded ${tactic.category === 'training' ? 'bg-primary/10 text-primary border-border-main' : tactic.category === 'opponent' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-surface-2 text-text-muted border-border-main'}`}>
                            {tactic.category === 'training' ? t('tactics.cat_training') : tactic.category === 'opponent' ? t('tactics.cat_opponent') : t('tactics.cat_other')}
                          </span>
                          <span>•</span>
                          <span>{new Date(tactic.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      <div className="flex items-stretch gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: t('tactics.delete_title'),
                              message: t('tactics.delete_msg'),
                              variant: 'danger',
                              onConfirm: () => { deleteTactic(tactic.id); setConfirmDialog(d => ({ ...d, isOpen: false })); }
                            });
                          }}
                          className="px-4 py-2 font-display text-sm font-bold text-red-500 bg-transparent border-2 border-red-500/50 hover:bg-red-500/10 flex items-center gap-1 transition-colors uppercase tracking-wider active:scale-95"
                          title={t('tactics.delete')}
                        >
                          <Trash2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: t('tactics.load_title'),
                              message: t('tactics.load_msg'),
                              variant: 'warning',
                              onConfirm: () => {
                                setFrames(tactic.frames);
                                setCurrentFrameIndex(0);
                                setPositions(tactic.frames[0].positions);
                                setLines(tactic.frames[0].lines);
                                setIsLibraryModalOpen(false);
                                setConfirmDialog(d => ({ ...d, isOpen: false }));
                              }
                            });
                          }}
                          className="px-6 py-2 font-display text-sm font-bold text-white bg-primary hover:bg-[#323d29] border-2 border-primary flex items-center gap-1 transition-colors ml-2 uppercase tracking-wider active:scale-95"
                        >
                          <Play size={14} className="fill-white" /> {t('tactics.load')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </BottomSheet>

        {/* Custom Confirm Dialog */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200">
            <div className={`bg-surface w-full max-w-sm border-2 animate-in zoom-in-95 duration-200 ${
              confirmDialog.variant === 'danger' 
                ? 'border-red-600/20 shadow-[8px_8px_0px_0px_#dc2626]' 
                : confirmDialog.variant === 'warning'
                  ? 'border-amber-600/20 shadow-[8px_8px_0px_0px_#d97706]'
                  : 'border-border-main shadow-[8px_8px_0px_0px_var(--color-primary)]'
            }`}>
              <div className="p-6">
                <h3 className={`font-display text-xl uppercase tracking-wide mb-3 flex items-center gap-2 ${confirmDialog.variant === 'danger' ? 'text-red-600' : confirmDialog.variant === 'warning' ? 'text-amber-600' : 'text-primary'}`}>
                  {confirmDialog.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">{confirmDialog.message}</p>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => {
                    if (confirmDialog.onCancel) confirmDialog.onCancel();
                    else setConfirmDialog(d => ({ ...d, isOpen: false }));
                  }}
                  className="flex-1 py-3 text-sm font-bold text-text-muted border border-slate-300 hover:bg-slate-50 transition-colors uppercase tracking-wider"
                >
                  {confirmDialog.cancelText || t('tactics.cancel', 'Hủy')}
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`flex-1 py-3 text-sm font-bold text-white transition-colors uppercase tracking-wider ${confirmDialog.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : confirmDialog.variant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {confirmDialog.confirmText || (confirmDialog.variant === 'danger' ? t('tactics.delete_now', 'Xóa ngay') : t('tactics.agree', 'Đồng ý'))}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        <BottomSheet
          isOpen={isHelpModalOpen}
          onClose={() => setIsHelpModalOpen(false)}
          title={activeHelpTab === 'guide' ? t('tactics.guide_title', 'Hướng dẫn sử dụng') : t('tactics.shortcuts_title', 'Bảng Phím tắt Thao tác')}
        >
          <div className="flex flex-col gap-4">
            {/* Modal Navigation Tabs */}
            <div className="flex border-2 border-border-main shrink-0 gap-0 mb-4 bg-surface">
              <button
                onClick={() => setActiveHelpTab('guide')}
                className={`flex-1 px-3 py-3 font-display text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeHelpTab === 'guide' ? 'bg-primary text-white' : 'bg-transparent text-text-muted hover:bg-surface'}`}
              >
                <HelpCircle size={16} /> {t('tactics.tab_guide', 'HƯỚNG DẪN')}
              </button>
              <div className="w-[2px] bg-primary/20"></div>
              <button
                onClick={() => setActiveHelpTab('shortcuts')}
                className={`flex-1 hidden sm:flex px-3 py-3 font-display text-sm font-bold uppercase tracking-widest transition-colors items-center justify-center gap-2 ${activeHelpTab === 'shortcuts' ? 'bg-primary text-white' : 'bg-transparent text-text-muted hover:bg-surface'}`}
              >
                <Keyboard size={16} /> {t('tactics.tab_shortcuts', 'PHÍM TẮT')}
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1 pb-4">
              {activeHelpTab === 'guide' ? (
                <div className="space-y-4 text-xs sm:text-sm text-text-muted">
                  {/* Left Bar */}
                  <div className="p-4 border-2 border-border-main bg-surface space-y-2">
                    <div className="flex items-center gap-2 font-display uppercase tracking-wider font-bold text-text-main text-sm">
                      <div className="w-7 h-7 bg-primary text-white flex items-center justify-center rounded shrink-0">
                        <MousePointer2 size={14} />
                      </div>
                      {t('tactics.left_toolbar', 'THANH CÔNG CỤ BÊN TRÁI')}
                    </div>
                    <ul className="space-y-1.5 pl-9 list-disc text-text-muted leading-relaxed text-xs sm:text-sm font-medium">
                      <li>{t('tactics.guide_pointer', 'Con trỏ: Kéo thả vị trí cầu thủ, bóng, cọc tiêu, chữ hoặc vùng Pressing trên mặt sân.')}</li>
                      <li>{t('tactics.guide_arrows', 'Mũi tên chiến thuật: Vẽ đường Di chuyển (nét liền), Chạy chỗ (nét đứt) và Đường chuyền.')}</li>
                      <li>{t('tactics.guide_objects', 'Vật thể & Vùng: Đặt cọc tiêu bài tập, vẽ vùng Pressing (kéo di chuyển được) và chèn chữ ghi chú.')}</li>
                      <li>{t('tactics.guide_manage', 'Sửa đổi & Quản lý: Cục tẩy, Hoàn tác, Làm lại, Xóa toàn bộ nét vẽ, Làm mới sa bàn, Lưu bài tập và Thư viện bài tập.')}</li>
                    </ul>
                  </div>

                  {/* Right Bar */}
                  <div className="p-4 border-2 border-emerald-600/20 bg-surface space-y-2">
                    <div className="flex items-center gap-2 font-display uppercase tracking-wider font-bold text-emerald-500 text-sm">
                      <div className="w-7 h-7 bg-emerald-600 text-white flex items-center justify-center rounded shrink-0">
                        <Play size={14} />
                      </div>
                      {t('tactics.sim_controls', 'THANH ĐIỀU KHIỂN MÔ PHỎNG (PHẢI/DƯỚI)')}
                    </div>
                    <ul className="space-y-1.5 pl-9 list-disc text-text-muted leading-relaxed text-xs sm:text-sm font-medium">
                      <li>{t('tactics.guide_play', 'Phát / Dừng: Xem mô phỏng chuyển động mượt mà giữa các bước chiến thuật.')}</li>
                      <li>{t('tactics.guide_step_counter', 'Bộ đếm bước: Hiển thị bước hiện tại (ví dụ: Bước 1/3).')}</li>
                      <li>{t('tactics.guide_add_step', 'Thêm bước mới (+): Tạo bước tiếp theo để di chuyển cầu thủ theo từng giai đoạn bài tập.')}</li>
                    </ul>
                  </div>

                  {/* Bottom Bar */}
                  <div className="p-4 border-2 border-amber-600/20 bg-surface space-y-2">
                    <div className="flex items-center gap-2 font-display uppercase tracking-wider font-bold text-amber-500 text-sm">
                      <div className="w-7 h-7 bg-amber-600 text-white flex items-center justify-center rounded shrink-0">
                        <Users size={14} />
                      </div>
                      {t('tactics.bottom_templates', 'THANH CHIẾN THUẬT & BÀI MẪU PHÍA DƯỚI')}
                    </div>
                    <ul className="space-y-1.5 pl-9 list-disc text-text-muted leading-relaxed text-xs sm:text-sm font-medium">
                      <li>{t('tactics.guide_tabs', '4 Tab bài tập: Sơ đồ đội hình (1-2-1, 2-2, 3-1, 4-0), Tấn công, Phòng ngự, Tình huống cố định.')}</li>
                      <li>{t('tactics.guide_load', 'Nạp bài mẫu: Nhấp vào bất kỳ thẻ chiến thuật nào để tự động xếp vị trí cầu thủ trên sa bàn.')}</li>
                      <li>{t('tactics.guide_drag', 'Kéo / Vuốt trượt: Nhấn giữ chuột trái và kéo qua lại để xem các thẻ bài tập dạng hàng ngang.')}</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Công cụ sa bàn */}
                  <div>
                    <h4 className="font-display text-sm font-bold uppercase tracking-widest text-primary mb-3">{t('tactics.draw_tools', 'CÔNG CỤ VẼ & SA BÀN')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.tool_pointer', 'Con trỏ')}</span>
                        <span className="flex gap-1"><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">V</kbd><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">1</kbd></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.tool_move', 'Mũi tên Di chuyển')}</span>
                        <span className="flex gap-1"><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">M</kbd><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">2</kbd></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.tool_run', 'Mũi tên Chạy chỗ')}</span>
                        <span className="flex gap-1"><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">R</kbd><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">3</kbd></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.tool_pass', 'Mũi tên Đường chuyền')}</span>
                        <span className="flex gap-1"><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">A</kbd><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">4</kbd></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.tool_eraser', 'Cục tẩy')}</span>
                        <span className="flex gap-1"><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">E</kbd><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">5</kbd></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.tool_cone', 'Cọc tiêu')}</span>
                        <span className="flex gap-1"><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">C</kbd><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">6</kbd></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.tool_zone', 'Vùng Pressing')}</span>
                        <span className="flex gap-1"><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">Z</kbd><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">7</kbd></span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.tool_text', 'Ghi chú chữ')}</span>
                        <span className="flex gap-1"><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">T</kbd><kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">8</kbd></span>
                      </div>
                    </div>
                  </div>

                  {/* Thao tác & Điều khiển */}
                  <div>
                    <h4 className="font-display text-sm font-bold uppercase tracking-widest text-primary mb-3 mt-6">{t('tactics.action_controls', 'THAO TÁC & ĐIỀU KHIỂN')}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.action_undo', 'Hoàn tác')}</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">Ctrl + Z</kbd>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.action_redo', 'Làm lại')}</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">Ctrl + Y</kbd>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.action_play', 'Phát / Dừng mô phỏng')}</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">Spacebar</kbd>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main">
                        <span className="text-text-main font-bold">{t('tactics.action_reset', 'Làm mới sa bàn')}</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">0</kbd>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main col-span-1 sm:col-span-2">
                        <span className="text-text-main font-bold">{t('tactics.action_clear', 'Xóa tất cả nét vẽ')}</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">Delete</kbd>
                      </div>
                      <div className="flex items-center justify-between p-2.5 bg-surface border border-border-main col-span-1 sm:col-span-2">
                        <span className="text-text-main font-bold">{t('tactics.action_toggle_shortcuts', 'Bật/tắt Bảng Phím tắt')}</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border-main text-text-muted font-mono font-bold shadow-sm">Shift + ? / K</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </BottomSheet>

        {/* Templates Modal (Mobile/Tablet only) */}
        <BottomSheet
          isOpen={isTemplatesModalOpen}
          onClose={() => setIsTemplatesModalOpen(false)}
          title="BÀI MẪU CÓ SẴN"
        >
          <div className="flex flex-col gap-4">
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex border-2 border-border-main shrink-0 mb-4 bg-surface overflow-x-auto hide-scrollbar">
                {[
                  { id: 'formation', label: 'SƠ ĐỒ' },
                  { id: 'attack', label: 'TẤN CÔNG' },
                  { id: 'defense', label: 'PHÒNG NGỰ' },
                  { id: 'situations', label: 'CỐ ĐỊNH' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-3 py-3 font-display text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors whitespace-nowrap border-r-2 border-border-main last:border-r-0 ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-transparent text-text-muted hover:bg-surface'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="w-full overflow-y-auto pr-1 pb-4">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {activeTab === 'formation' && [
                    { id: '1-2-1', title: '1-2-1', sub: '', desc: '1 hậu vệ, 2 cánh, 1 pivot' },
                    { id: '2-2', title: '2-2', sub: '', desc: '2 hậu vệ, 2 tiền đạo, cân bằng' },
                    { id: '3-1', title: '3-1', sub: '', desc: '3 hậu vệ, 1 pivot, an toàn' },
                    { id: '4-0', title: '4-0', sub: '', desc: 'Không pivot, hoán vị' }
                  ].map(item => (
                    <button key={item.id} onClick={() => { setTactic(item.id); setIsTemplatesModalOpen(false); }} className="flex flex-col text-left p-2 sm:p-3 border-2 border-border-main hover:border-primary hover:bg-primary/5 transition-all bg-surface min-h-[70px]">
                      <div className="font-display uppercase font-bold text-primary mb-0.5 text-xs sm:text-sm truncate w-full">{item.title}</div>
                      <div className="text-[10px] sm:text-xs text-text-muted leading-tight line-clamp-2">{item.desc}</div>
                    </button>
                  ))}

                  {activeTab === 'attack' && [
                    { id: 'att-wing', title: 'Tấn công biên', sub: '', desc: 'Kéo dãn đội hình ra biên' },
                    { id: 'att-center', title: 'Tấn công trung lộ', sub: '', desc: 'Khoét sâu vào trung tâm' },
                    { id: 'att-2p', title: 'Phối hợp 2 người', sub: '', desc: 'Đan bóng, chồng biên' },
                    { id: 'att-counter', title: 'Phản công', sub: '', desc: 'Chuyển trạng thái nhanh' },
                    { id: 'att-powerplay', title: 'Power Play', sub: '', desc: 'Thủ môn dâng cao' },
                  ].map(item => (
                    <button key={item.id} onClick={() => { setTactic(item.id); setIsTemplatesModalOpen(false); }} className="flex flex-col text-left p-2 sm:p-3 border-2 border-border-main hover:border-emerald-600 hover:bg-emerald-50/50 transition-all bg-surface min-h-[70px]">
                      <div className="font-display uppercase font-bold text-emerald-700 mb-0.5 text-xs sm:text-sm truncate w-full">{item.title}</div>
                      <div className="text-[10px] sm:text-xs text-text-muted leading-tight line-clamp-2">{item.desc}</div>
                    </button>
                  ))}

                  {activeTab === 'defense' && [
                    { id: 'def-man', title: 'Kèm người toàn sân', sub: '', desc: '1 kèm 1 theo sát' },
                    { id: 'def-zone', title: 'Khu vực nửa sân', sub: '', desc: 'Giữ khu vực cố định' },
                    { id: 'def-cover', title: 'Bọc lót', sub: '', desc: 'Hỗ trợ đồng đội' },
                    { id: 'def-anti-powerplay', title: 'Chống Power Play', sub: '', desc: 'Khi đối phương đá 5' },
                  ].map(item => (
                    <button key={item.id} onClick={() => { setTactic(item.id); setIsTemplatesModalOpen(false); }} className="flex flex-col text-left p-2 sm:p-3 border-2 border-border-main hover:border-amber-600 hover:bg-amber-50/50 transition-all bg-surface min-h-[70px]">
                      <div className="font-display uppercase font-bold text-amber-700 mb-0.5 text-xs sm:text-sm truncate w-full">{item.title}</div>
                      <div className="text-[10px] sm:text-xs text-text-muted leading-tight line-clamp-2">{item.desc}</div>
                    </button>
                  ))}

                  {activeTab === 'situations' && [
                    { id: 'sit-freekick', title: 'Đá phạt', sub: '< 10m', desc: 'Trực tiếp/gián tiếp' },
                    { id: 'sit-corner', title: 'Phạt góc', sub: '', desc: 'Bài bản không gian hẹp' },
                    { id: 'sit-kickin', title: 'Ném biên', sub: '', desc: 'Đá biên futsal' },
                    { id: 'sit-gk', title: 'Phát bóng', sub: '', desc: 'Phát bóng tấn công nhanh' }
                  ].map(item => (
                    <button key={item.id} onClick={() => { setTactic(item.id); setIsTemplatesModalOpen(false); }} className="flex flex-col text-left p-2 sm:p-3 border-2 border-border-main hover:border-purple-600 hover:bg-purple-50/50 transition-all bg-surface min-h-[70px]">
                      <div className="font-display uppercase font-bold text-purple-700 mb-0.5 text-xs sm:text-sm truncate w-full">{item.title}</div>
                      <div className="text-[10px] sm:text-xs text-text-muted leading-tight line-clamp-2">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </BottomSheet>
      </div>

      {/* Toast Notification */}
      {toast.isVisible && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-surface border-2 px-4 py-3 flex items-center gap-3 w-max max-w-[90%] animate-in slide-in-from-top-4 duration-200 ${toast.variant === 'success' ? 'border-primary shadow-[4px_4px_0px_0px_var(--color-primary)]' : 'border-red-600 shadow-[4px_4px_0px_0px_#dc2626]'}`}>
          {toast.variant === 'success' ? (
            <svg className="w-5 h-5 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          )}
          <span className={`text-sm font-bold ${toast.variant === 'success' ? 'text-primary' : 'text-red-600'}`}>{toast.message}</span>
          <button onClick={() => setToast(t => ({ ...t, isVisible: false }))} className="text-slate-400 hover:text-text-muted ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Text Input Modal */}
      <BottomSheet
        isOpen={pendingTextPos !== null}
        onClose={() => setPendingTextPos(null)}
        title={t('tactics.prompt_text')}
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          <input
            autoFocus
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSubmit();
            }}
            className="w-full px-4 py-3 bg-background border-2 border-border-main focus:outline-none focus:ring-0 focus:border-primary transition-colors text-sm font-bold placeholder:font-normal"
            placeholder={t('tactics.prompt_text')}
          />
          <button 
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
            className="w-full mt-2 bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {t('common.ok', 'OK')}
          </button>
        </div>
      </BottomSheet>

      {/* Exporting Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-[110]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-bold font-display uppercase tracking-widest text-lg">Đang tạo ảnh động GIF...</p>
          <p className="text-slate-300 text-sm mt-2">Vui lòng không đóng trang web</p>
        </div>
      )}

    </>
  );
}
