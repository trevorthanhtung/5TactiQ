import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Calculator, Copy, Check, Save, Users, Landmark, Coins, Scale, Trophy, RefreshCw, ChevronDown, ChevronUp, UserCheck, Sun, Moon, MapPin } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '../store/usePlayerStore';
import { useMatchStore } from '../store/useMatchStore';
import { useFundStore } from '../store/useFundStore';
import { useVenueStore } from '../store/useVenueStore';
import { useToastStore } from '../store/useToastStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { BottomSheet } from '../components/ui/BottomSheet';
import { MoneyInput } from '../components/MoneyInput';
import { FeeSplitterSkeleton } from '../components/ui/FeeSplitterSkeleton';
import { formatCurrencyAmount, getCurrencyConfig, LANGUAGE_DEFAULT_CURRENCY } from '../utils/currencyUtils';

export type MatchMode = 'internal' | 'opponent';
export type WagerPreset = 'even' | 'win0_lose100' | 'win30_lose70' | 'win40_lose60' | 'drinks' | 'custom';
export type MatchOutcome = 'win' | 'draw' | 'lose';
export type RoundingMode = 'none' | '5k' | '10k';

const BANK_STORAGE_KEY = '5tactiq_bank_info';

export default function FeeSplitter() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryMatchId = searchParams.get('matchId');
  const queryVenueId = searchParams.get('venueId');

  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const { players } = usePlayerStore();
  const { matches } = useMatchStore();
  const { venues } = useVenueStore();
  const { addTransaction } = useFundStore();
  const addToast = useToastStore(state => state.addToast);
  const { settings } = useSettingsStore();


  const activeCurrency = settings.currency || LANGUAGE_DEFAULT_CURRENCY[i18n.language] || 'VND';
  const currencyConfig = getCurrencyConfig(activeCurrency);

  // Basic Match & Fee inputs
  const [matchMode, setMatchMode] = useState<MatchMode>('opponent');
  const [pitchFee, setPitchFee] = useState<number>(currencyConfig.defaultPitchNight);
  const [hasExtraFee, setHasExtraFee] = useState<boolean>(false);
  const [extraFee, setExtraFee] = useState<number>(currencyConfig.defaultExtra);

  // Venue & Time Slot linking
  const [selectedVenueId, setSelectedVenueId] = useState<string>(queryVenueId || '');
  const [activeTimeSlot, setActiveTimeSlot] = useState<'day' | 'night' | null>('night');
  const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);

  
  // Opponent Wager inputs
  const [hasWager, setHasWager] = useState<boolean>(false);
  const [manualOutcome, setManualOutcome] = useState<MatchOutcome>('win');

  
  // Custom wager % (our team share %)
  const [customWinPercent, setCustomWinPercent] = useState<number>(30);
  const [customDrawPercent, setCustomDrawPercent] = useState<number>(50);
  const [customLosePercent, setCustomLosePercent] = useState<number>(70);

  // Handle changing losing % (auto syncs win %)
  const handleLosePercentChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setCustomLosePercent(clamped);
    setCustomWinPercent(100 - clamped);
  };

  // Handle changing winning % (auto syncs lose %)
  const handleWinPercentChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setCustomWinPercent(clamped);
    setCustomLosePercent(100 - clamped);
  };

  const applyWagerPreset = (losePct: number) => {
    setCustomLosePercent(losePct);
    setCustomWinPercent(100 - losePct);
    setCustomDrawPercent(50);
  };


  // Headcount & Match Selection
  const [headcountMode, setHeadcountMode] = useState<'number' | 'match'>('number');
  const [headcountNumber, setHeadcountNumber] = useState<number>(10);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [isMatchDropdownOpen, setIsMatchDropdownOpen] = useState(false);

  // Filter & Sort matches by current matchMode and date descending
  const filteredMatches = useMemo(() => {
    return matches
      .filter(m => matchMode === 'internal' ? m.matchType === 'internal' : m.matchType !== 'internal')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [matches, matchMode]);

  const selectedMatch = useMemo(() => {
    return matches.find(m => m.id === selectedMatchId) || null;
  }, [matches, selectedMatchId]);

  // Check if actively linked to a match (user chose match attendance mode)
  const isLinkedToMatch = headcountMode === 'match' && !!selectedMatch;

  // Derive outcome automatically from selectedMatch score if linked to a finished match, otherwise manual
  const matchOutcome: MatchOutcome = useMemo(() => {
    if (isLinkedToMatch && selectedMatch && selectedMatch.status === 'finished') {
      const us = Number(selectedMatch.scoreUs ?? 0);
      const them = Number(selectedMatch.scoreOpponent ?? 0);
      if (us > them) return 'win';
      if (us < them) return 'lose';
      return 'draw';
    }
    return manualOutcome;
  }, [isLinkedToMatch, selectedMatch, manualOutcome]);

  // Current matched venue (from selected venue or from match)
  const currentVenue = useMemo(() => {
    if (selectedVenueId === '__none__') {
      return null;
    }
    if (selectedVenueId) {
      return venues.find(v => v.id === selectedVenueId) || null;
    }
    if (headcountMode === 'match' && selectedMatch?.location) {
      return venues.find(v => v.name.trim().toLowerCase() === selectedMatch.location.trim().toLowerCase()) || null;
    }
    return null;
  }, [selectedVenueId, venues, headcountMode, selectedMatch]);

  // Handle URL Query Params
  useEffect(() => {
    if (queryMatchId) {
      const targetMatch = matches.find(m => m.id === queryMatchId);
      if (targetMatch) {
        setHeadcountMode('match');
        setSelectedMatchId(queryMatchId);
        setMatchMode(targetMatch.matchType === 'internal' ? 'internal' : 'opponent');
      }
    }
  }, [queryMatchId, matches]);

  useEffect(() => {
    if (queryVenueId) {
      const v = venues.find(item => item.id === queryVenueId);
      if (v) {
        setSelectedVenueId(v.id);
        const slot = v.priceNight ? 'night' : 'day';
        setActiveTimeSlot(slot);
        const price = slot === 'night' ? (v.priceNight || v.priceDay || 500000) : (v.priceDay || v.priceNight || 350000);
        setPitchFee(price);
      }
    }
  }, [queryVenueId, venues]);

  // Auto-sync venue price when selected match changes
  useEffect(() => {
    if (headcountMode === 'match' && selectedMatch) {
      const v = venues.find(item => item.name.trim().toLowerCase() === selectedMatch.location?.trim().toLowerCase());
      if (v) {
        setSelectedVenueId(v.id);

        let isNight = true;
        if (selectedMatch.time) {
          const parts = selectedMatch.time.split(':');
          if (parts.length > 0 && !isNaN(parseInt(parts[0]))) {
            const h = parseInt(parts[0]);
            isNight = h >= 17 || h < 6;
          }
        }
        const slot = selectedMatch.feeTimeSlot || (isNight ? 'night' : 'day');
        setActiveTimeSlot(slot);

        if (selectedMatch.pitchFee) {
          setPitchFee(selectedMatch.pitchFee);
        } else {
          const price = slot === 'night' 
            ? (v.priceNight || v.priceDay || 500000) 
            : (v.priceDay || v.priceNight || 350000);
          setPitchFee(price);
        }
      }
    }
  }, [selectedMatch, headcountMode, venues]);

  const handleSelectSlot = (slot: 'day' | 'night', venueToUse = currentVenue) => {
    setActiveTimeSlot(slot);
    if (venueToUse) {
      const price = slot === 'day' 
        ? (venueToUse.priceDay || venueToUse.priceNight) 
        : (venueToUse.priceNight || venueToUse.priceDay);
      if (price) {
        setPitchFee(price);
      }
    }
  };

  const handleSelectVenue = (venue: typeof venues[0] | null) => {
    if (!venue) {
      setSelectedVenueId('__none__');
      setActiveTimeSlot(null);
      setIsVenueDropdownOpen(false);
      return;
    }
    setSelectedVenueId(venue.id);
    setIsVenueDropdownOpen(false);
    const slot = activeTimeSlot || (venue.priceNight ? 'night' : 'day');
    setActiveTimeSlot(slot);
    const price = slot === 'day' 
      ? (venue.priceDay || venue.priceNight || 350000) 
      : (venue.priceNight || venue.priceDay || 500000);
    setPitchFee(price);
  };

  // Select first match of the filtered list if current selection is invalid for matchMode
  useEffect(() => {
    const isCurrentValid = filteredMatches.some(m => m.id === selectedMatchId);
    if (!isCurrentValid) {
      if (filteredMatches.length > 0) {
        setSelectedMatchId(filteredMatches[0].id);
      } else {
        setSelectedMatchId('');
      }
    }
  }, [filteredMatches, selectedMatchId]);



  // Compute present players for selected match
  const matchPresentPlayerIds = useMemo(() => {
    if (!selectedMatchId) return [];
    const targetMatch = matches.find(m => m.id === selectedMatchId);
    if (!targetMatch) return [];

    const presentFromAttendance = targetMatch.attendance
      ? Object.entries(targetMatch.attendance)
          .filter(([_, status]) => status === 'present')
          .map(([id]) => id)
      : [];

    const presentFromStats = targetMatch.stats
      ? targetMatch.stats.map(s => s.playerId)
      : [];

    return Array.from(new Set([...presentFromAttendance, ...presentFromStats]));
  }, [selectedMatchId, matches]);

  // Sync selected player headcount
  const effectiveHeadcount = useMemo(() => {
    if (headcountMode === 'match') {
      return matchPresentPlayerIds.length > 0 ? matchPresentPlayerIds.length : 1;
    }
    return headcountNumber > 0 ? headcountNumber : 1;
  }, [headcountMode, matchPresentPlayerIds, headcountNumber]);

  // Rounding & Bank Info
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('none');
  const [copied, setCopied] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });

  // Load saved bank details
  useEffect(() => {
    try {
      const saved = localStorage.getItem(BANK_STORAGE_KEY);
      if (saved) {
        setBankInfo(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Could not load saved bank info:', e);
    }
  }, []);

  const handleBankInfoChange = (field: keyof typeof bankInfo, value: string) => {
    const updated = { ...bankInfo, [field]: value };
    setBankInfo(updated);
    try {
      localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save bank info:', e);
    }
  };

  // Calculation Logic

  const calculation = useMemo(() => {
    const activeExtraFee = hasExtraFee ? extraFee : 0;
    const totalCost = pitchFee + activeExtraFee;

    if (matchMode === 'internal') {
      const ourShare = totalCost;
      const opponentShare = 0;
      const rawPerPerson = ourShare / effectiveHeadcount;
      
      let finalPerPerson = rawPerPerson;
      if (roundingMode === '5k') {
        finalPerPerson = Math.ceil(rawPerPerson / 5000) * 5000;
      } else if (roundingMode === '10k') {
        finalPerPerson = Math.ceil(rawPerPerson / 10000) * 10000;
      }

      return {
        totalCost,
        opponentShare,
        ourShare,
        rawPerPerson,
        finalPerPerson,
        ourPercent: 100,
        opponentPercent: 0
      };
    }

    // Opponent match with wager logic
    let ourPercent = 50; // default 50-50 when wager toggle is OFF

    if (hasWager) {
      if (matchOutcome === 'win') ourPercent = customWinPercent;
      else if (matchOutcome === 'draw') ourPercent = customDrawPercent;
      else ourPercent = customLosePercent;
    }

    const ourShare = Math.round((totalCost * ourPercent) / 100);
    const opponentShare = totalCost - ourShare;
    const rawPerPerson = ourShare / effectiveHeadcount;
    const finalPerPerson = rawPerPerson;

    return {
      totalCost,
      opponentShare,
      ourShare,
      rawPerPerson,
      finalPerPerson,
      ourPercent,
      opponentPercent: 100 - ourPercent
    };
  }, [pitchFee, extraFee, hasExtraFee, matchMode, hasWager, matchOutcome, customWinPercent, customDrawPercent, customLosePercent, effectiveHeadcount]);


  const formatMoney = (val: number) => {
    return formatCurrencyAmount(val, activeCurrency);
  };
  // Generate formatted message for Zalo / Group chat
  const generateGroupMessage = () => {
    const defaultTeamName = t('fee_splitter.msg_team_default', 'ĐỘI BÓNG');
    const teamTitle = settings.teamName || defaultTeamName;
    const lines: string[] = [];

    const msgHeader = t('fee_splitter.msg_header', 'BẢNG CHIA TIỀN SÂN TRẬN ĐẤU');
    const msgMode = t('fee_splitter.msg_mode', 'Hình thức');
    const msgInternal = t('fee_splitter.msg_internal', 'Nội bộ');
    const msgOpponent = t('fee_splitter.msg_opponent', 'Đối đầu');
    const msgPitchWater = t('fee_splitter.msg_pitch_water', 'Tiền sân & nước');
    const msgPitch = t('fee_splitter.msg_pitch', 'Sân');
    const msgWater = t('fee_splitter.msg_water', 'Nước');
    const msgParticipants = t('fee_splitter.msg_participants', 'Số người tham gia');
    const msgOutcome = t('fee_splitter.msg_outcome', 'Kết quả');
    const msgTotalCost = t('fee_splitter.msg_total_cost', 'Tổng chi phí');
    const msgOurPlayers = t('fee_splitter.msg_our_players', 'Cầu thủ đội mình');
    const msgPerPerson = t('fee_splitter.msg_per_person', 'MỖI NGƯỜI ĐÓNG');
    const msgAttendanceList = t('fee_splitter.msg_attendance_list', 'Danh sách điểm danh');
    const msgAutoCalculated = t('fee_splitter.msg_auto_calculated', 'Tính tự động bằng ứng dụng 5TactiQ');

    lines.push(`[${teamTitle}] ${msgHeader}`);
    lines.push(`----------------------------------------`);
    
    const extraText = hasExtraFee && extraFee > 0 ? ` | ${msgWater}: ${formatMoney(extraFee)}` : '';
    if (matchMode === 'internal') {
      lines.push(`- ${msgMode}: ${msgInternal}`);
      lines.push(`- ${msgPitchWater}: ${formatMoney(calculation.totalCost)} (${msgPitch}: ${formatMoney(pitchFee)}${extraText})`);
      lines.push(`- ${msgParticipants}: ${effectiveHeadcount} ${t('fee_splitter.players_unit', 'người')}`);
    } else {
      const outcomeText = matchOutcome === 'win' 
        ? t('fee_splitter.outcome_win', 'Thắng') 
        : matchOutcome === 'draw' 
          ? t('fee_splitter.outcome_draw', 'Hòa') 
          : t('fee_splitter.outcome_lose', 'Thua');

      let wagerDesc = t('fee_splitter.msg_even_wager', 'Chia đôi 50-50');
      if (hasWager) {
        const wagerPrefix = t('fee_splitter.msg_wager_prefix', 'Kèo %');
        const winLbl = t('fee_splitter.outcome_win', 'Thắng');
        const drawLbl = t('fee_splitter.outcome_draw', 'Hòa');
        const loseLbl = t('fee_splitter.outcome_lose', 'Thua');
        wagerDesc = `${wagerPrefix} (${winLbl} ${customWinPercent}% - ${drawLbl} ${customDrawPercent}% - ${loseLbl} ${customLosePercent}%)`;
      }

      lines.push(`- ${msgMode}: ${msgOpponent} (${wagerDesc})`);
      lines.push(`- ${msgOutcome}: ${outcomeText} (${t('fee_splitter.our_share', 'Đội mình trả')}: ${calculation.ourPercent}%)`);
      lines.push(`- ${msgTotalCost}: ${formatMoney(calculation.totalCost)} (${msgPitch}: ${formatMoney(pitchFee)}${extraText})`);
      lines.push(`- ${t('fee_splitter.opponent_share', 'Đội bạn trả')} (${calculation.opponentPercent}%): ${formatMoney(calculation.opponentShare)}`);
      lines.push(`- ${t('fee_splitter.our_share', 'Đội mình trả')} (${calculation.ourPercent}%): ${formatMoney(calculation.ourShare)}`);
      lines.push(`- ${msgOurPlayers}: ${effectiveHeadcount} ${t('fee_splitter.players_unit', 'người')}`);
    }

    lines.push(`- ${msgPerPerson}: ${formatMoney(calculation.finalPerPerson)}`);

    // Include Present Players if selected via match
    if (headcountMode === 'match' && selectedMatchId) {
      const selectedNames = players
        .filter(p => matchPresentPlayerIds.includes(p.id))
        .map(p => p.name)
        .join(', ');
      if (selectedNames) {
        lines.push(`- ${msgAttendanceList} (${matchPresentPlayerIds.length}): ${selectedNames}`);
      }
    }

    lines.push(`----------------------------------------`);
    lines.push(msgAutoCalculated);

    return lines.join('\n');
  };

  const handleCopyZalo = () => {
    const text = generateGroupMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast({
      type: 'success',
      message: t('fee_splitter.copy_success', 'Đã sao chép tin nhắn chia tiền sân vào Clipboard!')
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToFund = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const categoryName = 'Thuê sân';
    const noteText = matchMode === 'internal' 
      ? `Tiền sân đá nội bộ (${effectiveHeadcount} người)`
      : `Tiền sân đá đối (${matchOutcome === 'win' ? 'Thắng' : matchOutcome === 'draw' ? 'Hòa' : 'Thua'}, ${calculation.ourPercent}% - ${effectiveHeadcount} người)`;

    addTransaction({
      date: dateStr,
      type: 'Chi',
      category: categoryName,
      amount: calculation.ourShare,
      note: noteText,
      playerId: null
    });

    addToast({
      type: 'success',
      message: t('fee_splitter.saved_to_fund_success', 'Đã ghi nhận chi phí thuê sân vào Quỹ đội!')
    });
  };

  if (isLoading) {
    return <FeeSplitterSkeleton />;
  }

  return (
    <div className="p-4 flex flex-col max-w-6xl mx-auto w-full">
      {/* Header & Match Mode Switcher */}

      <div className="space-y-4 mb-5">
        <div className="flex items-center justify-between gap-2 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 font-bold text-text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} /> {t('fee_splitter.back_more', 'Về trang Thêm')}
          </button>
        </div>

        <div>
          <h1 className="text-3xl @sm:text-4xl font-display uppercase text-primary leading-none">
            {t('fee_splitter.title', 'CHIA TIỀN SÂN')}
          </h1>
        </div>

        {/* Match Mode Switcher */}
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setMatchMode('opponent')}
            className={`p-3.5 border-2 font-display uppercase tracking-widest flex items-center justify-center transition-all cursor-pointer ${
              matchMode === 'opponent'
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-surface text-text-muted border-border-main hover:border-primary/50'
            }`}
          >
            <span>{t('fee_splitter.mode_opponent', 'Đối đầu')}</span>
          </button>
          <button
            type="button"
            onClick={() => setMatchMode('internal')}
            className={`p-3.5 border-2 font-display uppercase tracking-widest flex items-center justify-center transition-all cursor-pointer ${
              matchMode === 'internal'
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-surface text-text-muted border-border-main hover:border-primary/50'
            }`}
          >
            <span>{t('fee_splitter.mode_internal', 'Nội bộ')}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* HÀNG 1: 1. BẢNG COI TIỀN (Mobile: 1st, Desktop: Right Column Row 1) */}
        <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4 lg:col-start-8 xl:col-start-9 lg:row-start-1 w-full">
          <div className="hallmark-card p-5 space-y-4">
            <div>
              <h3 className="font-display text-xl uppercase text-primary border-b border-border-main pb-2">
                {t('fee_splitter.row1_title', '1. BẢNG COI TIỀN')}
              </h3>
              <p className="text-[10px] text-text-muted mt-1 italic">{t('fee_splitter.auto_update_note', 'Tự động tính theo các bước bên cạnh')}</p>
            </div>

            {/* Big Per-Person Card */}
            <div className="py-5 flex flex-col items-center justify-center text-center bg-surface-2 border-2 border-border-main my-2">
              <span className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                {t('fee_splitter.per_player', 'Mỗi người đóng')}
              </span>
              <div className="text-4xl @sm:text-5xl font-display font-bold text-primary tracking-tight">
                {formatMoney(calculation.finalPerPerson)}
              </div>
            </div>

            {/* Financial Breakdown Rows */}
            <div className="text-xs text-text-muted border-t border-border-main pt-3 space-y-2 font-medium">
              <div className="flex justify-between items-center">
                <span>{t('fee_splitter.total_match_cost', 'Tổng chi phí trận đấu')}:</span>
                <span className="font-bold text-text-main font-display text-sm">{formatMoney(calculation.totalCost)}</span>
              </div>

              {matchMode === 'opponent' && (
                <>
                  <div className="flex justify-between items-center">
                    <span>{t('fee_splitter.opponent_share', 'Đội bạn trả')} ({calculation.opponentPercent}%):</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-display text-sm">{formatMoney(calculation.opponentShare)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('fee_splitter.our_share', 'Đội mình trả')} ({calculation.ourPercent}%):</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400 font-display text-sm">{formatMoney(calculation.ourShare)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center">
                <span>{t('fee_splitter.players_count', 'Số cầu thủ tham gia')}:</span>
                <span className="font-bold text-text-main">{effectiveHeadcount} {t('fee_splitter.players_unit', 'người')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* HÀNG 5: 5. TIN NHẮN NHANH (Mobile: 5th (Last), Desktop: Right Column Row 2) */}
        <div className="order-3 lg:order-3 lg:col-span-5 xl:col-span-4 lg:col-start-8 xl:col-start-9 lg:row-start-2 w-full">
          <div className="hallmark-card p-5 space-y-3 bg-surface border-2 border-border-main">
            <h3 className="font-display text-xl uppercase text-primary border-b border-border-main pb-2">
              {t('fee_splitter.row5_title', '5. TIN NHẮN NHANH')}
            </h3>
            <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
              {t('fee_splitter.preview_msg_label', 'Xem trước văn bản tin nhắn:')}
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap bg-surface-2 p-3 border-2 border-border-main text-text-main max-h-48 overflow-y-auto leading-relaxed">
              {generateGroupMessage()}
            </pre>
            <button
              type="button"
              onClick={handleCopyZalo}
              className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-display text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow cursor-pointer active:scale-95"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? t('fee_splitter.copied_btn', 'ĐÃ SAO CHÉP!') : t('fee_splitter.copy_msg_btn', 'SAO CHÉP NỘI DUNG TIN NHẮN')}</span>
            </button>
          </div>
        </div>

        {/* LEFT COLUMN: Input Form (Steps 2, 3, 4) (Mobile: 2nd, Desktop: Left Column) */}
        <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-8 lg:col-start-1 xl:col-start-1 lg:row-start-1 lg:row-span-2 w-full space-y-5">
          {/* HÀNG 2: 2. ĐIỂM DANH ĐẾM NGƯỜI */}
          <div className="hallmark-card p-5 space-y-4">
            <h3 className="font-display text-xl uppercase text-primary border-b border-border-main pb-2">
              {t('fee_splitter.row2_title', '2. ĐIỂM DANH ĐẾM NGƯỜI')}
            </h3>

        {/* Mode Switcher for Headcount */}
        <div className="flex border border-border-main overflow-hidden text-xs font-bold">
          <button
            type="button"
            onClick={() => setHeadcountMode('number')}
            className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
              headcountMode === 'number'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-muted hover:bg-primary/5'
            }`}
          >
            {t('fee_splitter.enter_number', 'Nhập số lượng người')}
          </button>
          <button
            type="button"
            onClick={() => setHeadcountMode('match')}
            className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
              headcountMode === 'match'
                ? 'bg-primary text-white'
                : 'bg-surface text-text-muted hover:bg-primary/5'
            }`}
          >
            {t('fee_splitter.select_from_match', 'Chọn từ trận đấu')}
          </button>
        </div>

        {headcountMode === 'number' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHeadcountNumber(Math.max(1, headcountNumber - 1))}
                className="w-12 h-12 bg-primary/10 text-primary border border-primary/30 font-display text-2xl hover:bg-primary/20 transition-colors cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max="50"
                value={headcountNumber}
                onChange={(e) => setHeadcountNumber(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 text-center font-display text-3xl text-primary bg-surface border-2 border-border-main py-2 focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setHeadcountNumber(headcountNumber + 1)}
                className="w-12 h-12 bg-primary/10 text-primary border border-primary/30 font-display text-2xl hover:bg-primary/20 transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Match Selector */}
            <div className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
                {t('fee_splitter.select_match_label', 'Chọn trận đấu điểm danh')}
              </label>
              {filteredMatches.length > 0 ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setIsMatchDropdownOpen(true)}
                    className="w-full flex items-center justify-between bg-surface border-2 border-border-main p-3 font-display uppercase tracking-wider text-primary text-sm font-bold focus:border-primary focus:outline-none transition-colors cursor-pointer hover:border-primary"
                  >
                    <span className="truncate">
                      {selectedMatch ? (
                        selectedMatch.matchType === 'internal'
                          ? `${t('fee_splitter.internal_match_label', 'TRẬN NỘI BỘ')} (${selectedMatch.date})`
                          : `VS ${selectedMatch.opponent.toUpperCase()} (${selectedMatch.date})`
                      ) : (
                        t('fee_splitter.select_match_placeholder', 'CHỌN TRẬN ĐẤU')
                      )}
                    </span>
                    <ChevronDown size={18} className="text-primary shrink-0 ml-2" />
                  </button>

                  <BottomSheet
                    isOpen={isMatchDropdownOpen}
                    onClose={() => setIsMatchDropdownOpen(false)}
                    title={
                      <span className="flex items-center gap-2">
                        <Calculator size={20} /> {t('fee_splitter.select_match_title', 'CHỌN TRẬN ĐẤU')}
                      </span>
                    }
                  >
                    <div className="flex flex-col gap-2.5">
                      {filteredMatches.map(m => {
                        const isSelected = m.id === selectedMatchId;
                        const label = m.matchType === 'internal'
                          ? t('fee_splitter.internal_match_label', 'TRẬN NỘI BỘ')
                          : `VS ${m.opponent.toUpperCase()}`;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setSelectedMatchId(m.id);
                              setIsMatchDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3.5 border-2 transition-all active:scale-[0.98] flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border-main bg-surface text-text-main hover:border-primary/40'
                            }`}
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-display text-sm font-bold uppercase tracking-wider leading-tight truncate">
                                {label}
                              </span>
                              <span className="text-xs text-text-muted mt-1">
                                {m.date} {m.time ? `• ${m.time}` : ''} {m.location ? `• ${m.location}` : ''}
                              </span>
                            </div>
                            {isSelected && <Check size={20} className="text-primary shrink-0 ml-2" />}
                          </button>
                        );
                      })}
                    </div>
                  </BottomSheet>
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">
                  {matchMode === 'internal'
                    ? t('fee_splitter.no_internal_match', 'Chưa có trận đấu nội bộ nào.')
                    : t('fee_splitter.no_opponent_match', 'Chưa có trận đấu đối đầu nào.')}
                </p>
              )}
            </div>

            {/* Present Players List */}
            {selectedMatchId && (
              <div className="border border-border-main p-3 bg-surface space-y-2">
                <div className="text-xs font-bold border-b border-border-main pb-2">
                  <span className="text-primary uppercase tracking-wider">{t('fee_splitter.present_players_label', 'Cầu thủ điểm danh có mặt')}</span>
                </div>

                {matchPresentPlayerIds.length > 0 ? (
                  <div className="grid grid-cols-2 @sm:grid-cols-3 gap-1.5 pt-1">
                    {players
                      .filter(p => matchPresentPlayerIds.includes(p.id))
                      .map(p => (
                        <div key={p.id} className="flex items-center gap-1.5 text-xs bg-primary/5 p-1.5 border border-primary/15 font-semibold text-primary">
                          <UserCheck size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate">
                            {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.name}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic py-2 text-center">
                    {t('fee_splitter.no_present_players', "Chưa có cầu thủ nào được điểm danh 'Có mặt' trong trận đấu này.")}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* HÀNG 3: 3. CHI PHÍ TRẬN ĐẤU */}
      <div className="hallmark-card p-5 space-y-4">
        <h3 className="font-display text-xl uppercase text-primary border-b border-border-main pb-2">
          {t('fee_splitter.row3_title', '3. CHI PHÍ TRẬN ĐẤU')}
        </h3>

        {/* Venue Price Integration / Selector */}
        {venues.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              {t('fee_splitter.choose_venue_for_price', 'Áp dụng giá nhanh từ Danh bạ Sân')}
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsVenueDropdownOpen(true)}
                className={`w-full flex items-center justify-between bg-surface border-2 ${
                  currentVenue ? 'border-primary' : 'border-border-main hover:border-primary'
                } p-3 font-display uppercase tracking-wider text-sm font-bold focus:border-primary focus:outline-none transition-colors cursor-pointer shadow-sm`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <MapPin size={16} className={currentVenue ? 'text-secondary shrink-0' : 'text-text-muted shrink-0'} />
                  <span className={`truncate ${currentVenue ? 'text-primary' : 'text-text-muted font-normal'}`}>
                    {currentVenue ? currentVenue.name : t('fee_splitter.select_venue_placeholder', 'Chọn sân bóng để áp dụng giá...')}
                  </span>
                </div>

                <ChevronDown size={18} className="text-primary shrink-0" />
              </button>

              <BottomSheet
                isOpen={isVenueDropdownOpen}
                onClose={() => setIsVenueDropdownOpen(false)}
                title={
                  <span className="flex items-center gap-2">
                    <MapPin size={20} /> {t('fee_splitter.select_venue_title', 'CHỌN SÂN BÓNG')}
                  </span>
                }
              >
                <div className="flex flex-col gap-2.5">
                  {/* Option: Không chọn sân */}
                  <button
                    type="button"
                    onClick={() => handleSelectVenue(null)}
                    className={`w-full text-left p-3.5 border-2 transition-all active:scale-[0.98] flex items-center justify-between gap-3 cursor-pointer ${
                      !currentVenue
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border-main bg-surface text-text-muted hover:border-primary/40'
                    }`}
                  >
                    <span className="font-display text-sm uppercase tracking-wider">
                      -- {t('fee_splitter.no_venue_selected', 'Không chọn sân')} --
                    </span>
                    {!currentVenue && <Check size={20} className="text-primary shrink-0 ml-2" />}
                  </button>

                  {venues.map(v => {
                    const isSelected = currentVenue?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleSelectVenue(v)}
                        className={`w-full text-left p-3.5 border-2 transition-all active:scale-[0.98] flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border-main bg-surface text-text-main hover:border-primary/40'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-display text-sm font-bold uppercase tracking-wider text-primary truncate">
                            {v.name}
                          </span>
                          {v.address && (
                            <span className="text-xs text-text-muted truncate mt-0.5">
                              {v.address}
                            </span>
                          )}
                          {(v.priceDay || v.priceNight) && (
                            <div className="flex items-center gap-3 text-xs font-medium text-text-muted mt-1.5 flex-wrap">
                              {v.priceDay ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  ☀️ {t('venues.day_slot', 'Sáng')}: {formatMoney(v.priceDay)}
                                </span>
                              ) : null}
                              {v.priceNight ? (
                                <span className="text-indigo-500 dark:text-indigo-400 font-semibold">
                                  🌙 {t('venues.night_slot', 'Tối')}: {formatMoney(v.priceNight)}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                        {isSelected && <Check size={20} className="text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </BottomSheet>
            </div>

            {/* Day / Night Rate Quick Toggles */}
            {currentVenue && (currentVenue.priceDay || currentVenue.priceNight) && (
              <div className="flex gap-2 pt-1">
                {currentVenue.priceDay ? (
                  <button
                    type="button"
                    onClick={() => handleSelectSlot('day', currentVenue)}
                    className={`flex-1 py-2 px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                      activeTimeSlot === 'day'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'bg-surface border-border-main text-text-muted hover:border-amber-500/50'
                    }`}
                  >
                    <Sun size={14} className="text-amber-500 shrink-0" />
                    <span className="truncate">
                      {t('venues.day_slot', 'Sáng')}: {formatMoney(currentVenue.priceDay)}
                    </span>
                  </button>
                ) : null}

                {currentVenue.priceNight ? (
                  <button
                    type="button"
                    onClick={() => handleSelectSlot('night', currentVenue)}
                    className={`flex-1 py-2 px-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                      activeTimeSlot === 'night'
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-500 dark:text-indigo-300 shadow-sm'
                        : 'bg-surface border-border-main text-text-muted hover:border-indigo-500/50'
                    }`}
                  >
                    <Moon size={14} className="text-indigo-400 shrink-0" />
                    <span className="truncate">
                      {t('venues.night_slot', 'Tối')}: {formatMoney(currentVenue.priceNight)}
                    </span>
                  </button>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* Pitch Fee */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-1">
            {t('fee_splitter.pitch_fee_label', 'Tiền thuê sân')}
          </label>
          <div className="relative">
            <MoneyInput
              value={pitchFee === 0 ? '' : pitchFee}
              onChange={(val) => setPitchFee(val)}
              placeholder={String(currencyConfig.defaultPitchNight)}
              className="w-full text-2xl font-display font-bold text-primary bg-surface border-2 border-border-main px-4 py-2 focus:border-primary focus:outline-none"
              currencySymbol={activeCurrency}
            />
          </div>
        </div>

        {/* Extra Fee (Drinks / Water) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              onClick={() => {
                const next = !hasExtraFee;
                setHasExtraFee(next);
                if (next && extraFee === 0) setExtraFee(currencyConfig.defaultExtra);
              }}
              className="text-xs font-bold uppercase tracking-wider text-text-muted cursor-pointer select-none"
            >
              {t('fee_splitter.extra_fee_label', 'Tiền nước & dịch vụ khác')}
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={hasExtraFee}
              onClick={() => {
                const next = !hasExtraFee;
                setHasExtraFee(next);
                if (next && extraFee === 0) setExtraFee(currencyConfig.defaultExtra);
              }}
              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                hasExtraFee ? 'bg-primary border-primary' : 'bg-surface border-border-main'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform transition duration-200 ease-in-out my-auto ${
                  hasExtraFee ? 'translate-x-6 bg-white' : 'translate-x-0.5 bg-text-muted'
                }`}
              />
            </button>
          </div>

          {hasExtraFee ? (
            <div className="space-y-2 pt-1">
              <div className="relative">
                <MoneyInput
                  value={extraFee === 0 ? '' : extraFee}
                  onChange={(val) => setExtraFee(val)}
                  placeholder={String(currencyConfig.defaultExtra)}
                  className="w-full text-2xl font-display font-bold text-primary bg-surface border-2 border-border-main px-4 py-2 focus:border-primary focus:outline-none"
                  currencySymbol={activeCurrency}
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted italic pt-1">
              {t('fee_splitter.no_extra_desc', 'Không bật: Không tính thêm phụ phí nước & dịch vụ khác.')}
            </p>
          )}
        </div>
      </div>

      {/* HÀNG 4: 4. KÈO BÓNG & KẾT QUẢ (chỉ hiển thị khi chọn ĐỐI ĐẦU) */}
      {matchMode === 'opponent' && (
        <div className="hallmark-card p-5 space-y-4">
          <h3 className="font-display text-xl uppercase text-primary border-b border-border-main pb-2">
            {t('fee_splitter.row4_title', '4. KÈO BÓNG & KẾT QUẢ')}
          </h3>

          {/* Match Score & Outcome Display (if linked to match) or Manual Outcome Selection (if manual/menu mode) */}
          {isLinkedToMatch && selectedMatch ? (
            <div className="bg-surface-2 p-3.5 border-2 border-border-main flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider min-w-0 flex-wrap">
                <span className="text-primary truncate">{(settings.teamName || '5TactiQ').toUpperCase()}</span>
                <span className="px-2 py-0.5 bg-surface border border-border-main text-primary font-display text-sm font-bold shrink-0 shadow-sm">
                  {selectedMatch.scoreUs ?? 0} - {selectedMatch.scoreOpponent ?? 0}
                </span>
                <span className="text-text-muted truncate">{(selectedMatch.opponent || t('matchday.opponent_placeholder')).toUpperCase()}</span>
              </div>

              {/* Auto Outcome Badge */}
              <div className="shrink-0">
                {matchOutcome === 'win' && (
                  <span className="px-3 py-1 bg-emerald-600 text-white font-display text-xs uppercase font-bold tracking-wider shadow-sm">
                    {t('fee_splitter.outcome_win', 'Thắng')}
                  </span>
                )}
                {matchOutcome === 'lose' && (
                  <span className="px-3 py-1 bg-rose-600 text-white font-display text-xs uppercase font-bold tracking-wider shadow-sm">
                    {t('fee_splitter.outcome_lose', 'Thua')}
                  </span>
                )}
                {matchOutcome === 'draw' && (
                  <span className="px-3 py-1 bg-amber-600 text-white font-display text-xs uppercase font-bold tracking-wider shadow-sm">
                    {t('fee_splitter.outcome_draw', 'Hòa')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                {t('fee_splitter.match_outcome_label', 'Kết quả đội mình')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setManualOutcome('win')}
                  className={`p-3 border-2 font-display uppercase tracking-wider text-center transition-all cursor-pointer ${
                    manualOutcome === 'win'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-surface text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {t('fee_splitter.outcome_win', 'Thắng')}
                </button>
                <button
                  type="button"
                  onClick={() => setManualOutcome('draw')}
                  className={`p-3 border-2 font-display uppercase tracking-wider text-center transition-all cursor-pointer ${
                    manualOutcome === 'draw'
                      ? 'bg-amber-600 text-white border-amber-600 shadow'
                      : 'bg-surface text-amber-700 border-amber-300 hover:bg-amber-50'
                  }`}
                >
                  {t('fee_splitter.outcome_draw', 'Hòa')}
                </button>
                <button
                  type="button"
                  onClick={() => setManualOutcome('lose')}
                  className={`p-3 border-2 font-display uppercase tracking-wider text-center transition-all cursor-pointer ${
                    manualOutcome === 'lose'
                      ? 'bg-rose-600 text-white border-rose-600 shadow'
                      : 'bg-surface text-rose-700 border-rose-300 hover:bg-rose-50'
                  }`}
                >
                  {t('fee_splitter.outcome_lose', 'Thua')}
                </button>
              </div>
            </div>
          )}

          {/* Custom Wager Toggle Switch */}
          <div className="border-t border-border-main pt-3">
            <div className="flex items-center justify-between mb-2">
              <label
                onClick={() => setHasWager(!hasWager)}
                className="text-xs font-bold uppercase tracking-wider text-text-muted cursor-pointer select-none"
              >
                {t('fee_splitter.wager_toggle_label', 'Kèo thi đấu')}
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={hasWager}
                onClick={() => setHasWager(!hasWager)}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasWager ? 'bg-primary border-primary' : 'bg-surface border-border-main'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform transition duration-200 ease-in-out my-auto ${
                    hasWager ? 'translate-x-6 bg-white' : 'translate-x-0.5 bg-text-muted'
                  }`}
                />
              </button>
            </div>

            {hasWager ? (
              <div className="pt-1">
                {/* Percentage inputs grid - Auto Linked */}
                <div className="bg-surface-2 p-3.5 border-2 border-border-main">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Thua trả */}
                    <div>
                      <label className="text-[11px] font-bold uppercase text-rose-700 block mb-1">
                        {t('fee_splitter.lose_pay_percent', '% THUA TRẢ')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={customLosePercent}
                          onChange={(e) => handleLosePercentChange(Number(e.target.value) || 0)}
                          className="w-full bg-surface border-2 border-rose-300 focus:border-rose-500 p-2.5 font-display text-2xl text-rose-700 font-bold text-center focus:outline-none shadow-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-rose-500">%</span>
                      </div>
                    </div>

                    {/* Thắng trả (Tự động tính) */}
                    <div>
                      <label className="text-[11px] font-bold uppercase text-emerald-700 block mb-1">
                        {t('fee_splitter.win_pay_percent', '% THẮNG TRẢ')}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={customWinPercent}
                          onChange={(e) => handleWinPercentChange(Number(e.target.value) || 0)}
                          className="w-full bg-surface border-2 border-emerald-300 focus:border-emerald-500 p-2.5 font-display text-2xl text-emerald-700 font-bold text-center focus:outline-none shadow-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-muted italic pt-1">
                {t('fee_splitter.no_wager_desc', 'Không bật kèo: Chi phí trận đấu mặc định chia đôi 50-50 cho 2 đội.')}
              </p>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
