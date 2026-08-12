import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Download,
  Smartphone,
  Monitor,
  X,
  Trophy,
  MapPin,
  Activity,
  Sun,
  Moon,
  Check,
  ArrowRight,
  LayoutGrid,
  Phone,
  ChevronDown,
  MessageCircle,
  Mail,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { isInstalledApp } from '../utils/platform';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../components/ui/BottomSheet';

type FormationKey = 'diamond5' | 'square5' | 'pyramid5' | 'powerplay40';

interface PlayerPos {
  id: string;
  num: string;
  name: string;
  role: 'GK' | 'FX' | 'ALA' | 'PV';
  top: string;
  left: string;
  team: 'home' | 'away';
}

const FORMATIONS: Record<FormationKey, { name: string; label: string; players: PlayerPos[] }> = {
  diamond5: {
    name: '5v5 Kim Cương',
    label: '1-2-1 Kim Cương (Sân 5: 5 Mình vs 5 Đối)',
    players: [
      { id: 'h1', num: '1', name: 'Tuấn (GK)', role: 'GK', top: '50%', left: '8%', team: 'home' },
      { id: 'h4', num: '4', name: 'Dũng (FX)', role: 'FX', top: '50%', left: '26%', team: 'home' },
      { id: 'h8', num: '8', name: 'Quang (ALA)', role: 'ALA', top: '22%', left: '44%', team: 'home' },
      { id: 'h7', num: '7', name: 'Hùng (ALA)', role: 'ALA', top: '78%', left: '44%', team: 'home' },
      { id: 'h10', num: '10', name: 'Hải (PV)', role: 'PV', top: '50%', left: '62%', team: 'home' },
      { id: 'a1', num: '1', name: 'Đăng (GK)', role: 'GK', top: '50%', left: '92%', team: 'away' },
      { id: 'a3', num: '3', name: 'Sơn (FX)', role: 'FX', top: '50%', left: '74%', team: 'away' },
      { id: 'a5', num: '5', name: 'Việt (ALA)', role: 'ALA', top: '26%', left: '56%', team: 'away' },
      { id: 'a6', num: '6', name: 'Long (ALA)', role: 'ALA', top: '74%', left: '56%', team: 'away' },
      { id: 'a9', num: '9', name: 'Bình (PV)', role: 'PV', top: '50%', left: '38%', team: 'away' },
    ]
  },
  square5: {
    name: '5v5 Song Song',
    label: '2-2 Song Song Mở Biên (Sân 5: 5 Mình vs 5 Đối)',
    players: [
      { id: 'h1', num: '1', name: 'Tuấn (GK)', role: 'GK', top: '50%', left: '8%', team: 'home' },
      { id: 'h3', num: '3', name: 'Minh (ALA)', role: 'ALA', top: '28%', left: '32%', team: 'home' },
      { id: 'h4', num: '4', name: 'Đức (FX)', role: 'FX', top: '72%', left: '32%', team: 'home' },
      { id: 'h9', num: '9', name: 'Phong (PV)', role: 'PV', top: '28%', left: '64%', team: 'home' },
      { id: 'h10', num: '10', name: 'Bình (PV)', role: 'PV', top: '72%', left: '64%', team: 'home' },
      { id: 'a1', num: '1', name: 'Đăng (GK)', role: 'GK', top: '50%', left: '92%', team: 'away' },
      { id: 'a2', num: '2', name: 'Tuấn (FX)', role: 'FX', top: '28%', left: '68%', team: 'away' },
      { id: 'a5', num: '5', name: 'Huy (FX)', role: 'FX', top: '72%', left: '68%', team: 'away' },
      { id: 'a7', num: '7', name: 'Khang (ALA)', role: 'ALA', top: '28%', left: '42%', team: 'away' },
      { id: 'a8', num: '8', name: 'Quốc (ALA)', role: 'ALA', top: '72%', left: '42%', team: 'away' },
    ]
  },
  pyramid5: {
    name: '5v5 Tháp Thủ',
    label: '3-1 Tháp Thủ Phòng Ngự (Sân 5: 5 Mình vs 5 Đối)',
    players: [
      { id: 'h1', num: '1', name: 'Tuấn (GK)', role: 'GK', top: '50%', left: '8%', team: 'home' },
      { id: 'h2', num: '2', name: 'Huy (ALA)', role: 'ALA', top: '22%', left: '26%', team: 'home' },
      { id: 'h4', num: '4', name: 'Dũng (FX)', role: 'FX', top: '50%', left: '24%', team: 'home' },
      { id: 'h3', num: '3', name: 'Nam (ALA)', role: 'ALA', top: '78%', left: '26%', team: 'home' },
      { id: 'h10', num: '10', name: 'Hải (PV)', role: 'PV', top: '50%', left: '68%', team: 'home' },
      { id: 'a1', num: '1', name: 'Đăng (GK)', role: 'GK', top: '50%', left: '92%', team: 'away' },
      { id: 'a4', num: '4', name: 'Phúc (FX)', role: 'FX', top: '50%', left: '72%', team: 'away' },
      { id: 'a8', num: '8', name: 'Thiện (ALA)', role: 'ALA', top: '24%', left: '54%', team: 'away' },
      { id: 'a7', num: '7', name: 'Thành (ALA)', role: 'ALA', top: '76%', left: '54%', team: 'away' },
      { id: 'a9', num: '9', name: 'Kiên (PV)', role: 'PV', top: '50%', left: '40%', team: 'away' },
    ]
  },
  powerplay40: {
    name: '5v5 4-0 Tấn Công',
    label: '4-0 Xoay Tần Tấn Công (Sân 5: 5 Mình vs 5 Đối)',
    players: [
      { id: 'h1', num: '1', name: 'Tuấn (GK)', role: 'GK', top: '50%', left: '8%', team: 'home' },
      { id: 'h8', num: '8', name: 'Quang (ALA)', role: 'ALA', top: '18%', left: '42%', team: 'home' },
      { id: 'h4', num: '4', name: 'Dũng (FX)', role: 'FX', top: '38%', left: '36%', team: 'home' },
      { id: 'h5', num: '5', name: 'Sơn (FX)', role: 'FX', top: '62%', left: '36%', team: 'home' },
      { id: 'h7', num: '7', name: 'Hùng (ALA)', role: 'ALA', top: '82%', left: '42%', team: 'home' },
      { id: 'a1', num: '1', name: 'Đăng (GK)', role: 'GK', top: '50%', left: '92%', team: 'away' },
      { id: 'a3', num: '3', name: 'Bảo (FX)', role: 'FX', top: '32%', left: '76%', team: 'away' },
      { id: 'a4', num: '4', name: 'Lâm (FX)', role: 'FX', top: '68%', left: '76%', team: 'away' },
      { id: 'a6', num: '6', name: 'Trí (ALA)', role: 'ALA', top: '28%', left: '58%', team: 'away' },
      { id: 'a11', num: '11', name: 'Nghĩa (ALA)', role: 'ALA', top: '72%', left: '58%', team: 'away' },
    ]
  }
};

const LANGUAGES = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { setGuest, session } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { isInstallable, promptInstall } = useInstallPrompt();

  const [activeFormation, setActiveFormation] = useState<FormationKey>('diamond5');
  const [activeFeatureTab, setActiveFeatureTab] = useState<'tactics' | 'matchday' | 'venues' | 'fitness'>('tactics');
  const [showPWAInstructionModal, setShowPWAInstructionModal] = useState(false);
  const [downloadModalTab, setDownloadModalTab] = useState<'options' | 'apple_pwa'>('options');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const pitchRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-skip Landing Page if app is opened in installed/native mode
  useEffect(() => {
    if (isInstalledApp()) {
      if (session || localStorage.getItem('katfc_is_guest') === 'true') {
        navigate('/', { replace: true });
      }
    }
  }, [navigate, session]);

  const handleStartApp = () => {
    if (session) {
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  };

  const currentLang = LANGUAGES.find((l) => l.code === (i18n.language || 'vi')) || LANGUAGES[0];

  return (
    <div className="w-full h-full min-h-screen overflow-y-auto landing-scrollbar bg-background text-text-main font-sans selection:bg-secondary/30 selection:text-secondary transition-colors duration-300 scroll-smooth">

      {/* HALLMARK HEADER NAVBAR */}
      <header className="sticky top-0 z-50 bg-surface border-b-2 border-border-main transition-colors shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="./logo.png" alt="5TactiQ Logo" className="w-9 h-9 object-contain drop-shadow-sm" />
            <span className="font-display text-2xl font-bold tracking-widest text-primary uppercase">
              5TACTIQ
            </span>
          </div>

          {/* Tools & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 bg-surface-2 border-2 border-border-main hover:border-primary text-text-main flex items-center justify-center transition-all cursor-pointer shadow-sm"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            {/* Language Selector Dropdown (Icon Only) */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                className="w-10 h-10 bg-surface-2 border-2 border-border-main hover:border-primary text-text-main flex items-center justify-center transition-all cursor-pointer shadow-sm"
                title="Select Language / Chọn ngôn ngữ"
              >
                <Globe className="w-4 h-4 text-primary" />
              </button>

              <AnimatePresence>
                {showLangDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-44 bg-surface border-2 border-border-main shadow-[4px_4px_0px_0px_#323d29] py-1.5 z-50 overflow-hidden font-display text-xs"
                  >
                    {LANGUAGES.map((lang) => {
                      const isSelected = (i18n.language || 'vi').startsWith(lang.code);
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            i18n.changeLanguage(lang.code);
                            setShowLangDropdown(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 flex items-center gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 text-primary font-extrabold'
                              : 'text-text-main hover:bg-surface-2'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION — HALLMARK BRUTALISM STRUCTURE */}
      <section className="pt-12 sm:pt-20 pb-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center space-y-6">
        {/* Main Title */}
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-text-main uppercase leading-tight">
          {t('landing.title_1', 'QUẢN LÝ ĐỘI BÓNG')} <br />
          <span className="text-secondary">{t('landing.title_2', '& CHIẾN THUẬT SÂN 5')}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-2xl mx-auto font-medium">
          {t('landing.subtitle', 'Công cụ đắc lực cho Đội trưởng & HLV Sân 5: Vẽ sơ đồ chiến thuật, quản lý đội hình, ghi nhận lịch sử đối đầu và chia đội tự động.')}
        </p>

        {/* Hero Quick Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleStartApp}
            className="w-full sm:w-auto hallmark-btn bg-secondary text-white border-2 border-secondary hover:brightness-110 px-8 py-3.5 font-display text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#323d29] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t('landing.start_guest', 'Trải Nghiệm Ngay')}</span>
          </button>

          <button
            onClick={() => setShowPWAInstructionModal(true)}
            className="w-full sm:w-auto hallmark-btn-outline bg-surface text-text-main border-2 border-border-main hover:bg-surface-2 px-8 py-3.5 font-display text-sm uppercase tracking-widest font-bold flex items-center justify-center gap-2.5 shadow-[4px_4px_0px_0px_#323d29] cursor-pointer"
          >
            <Download className="w-5 h-5 text-primary" />
            <span>{t('landing.install_app', 'Cài Đặt Ứng Dụng')}</span>
          </button>
        </div>

        {/* Feature Badges Grid */}
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t-2 border-border-main/40 text-xs font-sans">
          <div className="hallmark-card bg-surface p-3.5 border-2 border-border-main shadow-sm text-center">
            <span className="font-display font-bold text-text-main text-sm block uppercase tracking-wider mb-0.5">{t('landing.offline_badge', 'HỖ TRỢ OFFLINE')}</span>
            <span className="text-text-muted">{t('landing.offline_desc', 'Sử dụng không cần mạng')}</span>
          </div>
          <div className="hallmark-card bg-surface p-3.5 border-2 border-border-main shadow-sm text-center">
            <span className="font-display font-bold text-text-main text-sm block uppercase tracking-wider mb-0.5">{t('landing.sync_badge', 'ĐỒNG BỘ DỮ LIỆU')}</span>
            <span className="text-text-muted">{t('landing.sync_desc', 'Đám mây an toàn & bảo mật')}</span>
          </div>
          <div className="hallmark-card bg-surface p-3.5 border-2 border-border-main shadow-sm text-center">
            <span className="font-display font-bold text-text-main text-sm block uppercase tracking-wider mb-0.5">{t('landing.device_badge', 'ĐA THIẾT BỊ')}</span>
            <span className="text-text-muted">{t('landing.device_desc', 'Điện thoại, Máy tính & Web')}</span>
          </div>
        </div>
      </section>

      {/* 3 PAIN POINTS OF 5V5 CAPTAINS & 5TACTIQ SOLUTIONS */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-border-main">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-text-main">
            {t('landing.pain_points_title', '3 NỖI ĐAU ĐỘI TRƯỜNG SÂN 5 & GIẢI PHÁP 5TACTIQ')}
          </h2>
          <p className="text-text-muted text-sm mt-2 font-medium">
            {t('landing.pain_points_subtitle', 'Giải quyết dứt điểm những rắc rối nhức đầu nhất khi đi đá bóng hàng tuần.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Xếp hạng & Chia đội nội bộ */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_#323d29]">
            <div className="space-y-4">
              <div className="border-b-2 border-border-main/40 pb-3">
                <span className="font-display text-2xl font-extrabold text-secondary tracking-widest">01</span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-extrabold uppercase text-text-main leading-snug">
                {t('landing.pain_1_title', 'CHIA ĐỘI ĐÁ NỘI BỘ LỆCH TRÌNH')}
              </h3>

              <p className="text-xs text-text-muted leading-relaxed font-medium">
                {t('landing.pain_1_desc', 'Chia đội nội bộ theo cảm tính rất dễ lệch trình — một bên quá mạnh, bên kia quá yếu, đá một chiều nhanh chán.')}
              </p>
            </div>

            <div className="mt-6 border-l-4 border-emerald-500 bg-emerald-500/5 p-3.5 space-y-1 text-xs">
              <span className="font-display font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                {t('landing.pain_1_sol_title', 'GIẢI PHÁP 5TACTIQ')}
              </span>
              <p className="text-text-main leading-relaxed font-medium">
                {t('landing.pain_1_sol_desc', 'Hệ thống đánh giá Tier (S/A/B/C) tự động chia 2 đội cân bằng sức mạnh, đảm bảo kèo đấu luôn kịch tính và công bằng.')}
              </p>
            </div>
          </div>

          {/* Card 2: Chia quỹ đá kèo */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_#323d29]">
            <div className="space-y-4">
              <div className="border-b-2 border-border-main/40 pb-3">
                <span className="font-display text-2xl font-extrabold text-secondary tracking-widest">02</span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-extrabold uppercase text-text-main leading-snug">
                {t('landing.pain_2_title', 'CHIA TIỀN & QUỸ KÈO NHỨC ĐẦU')}
              </h3>

              <p className="text-xs text-text-muted leading-relaxed font-medium">
                {t('landing.pain_2_desc', 'Nhức đầu với việc chia tiền sân, tiền nước sau trận — cứ phải tự chia tiền lẻ rồi ngại ngùng đi đòi từng người.')}
              </p>
            </div>

            <div className="mt-6 border-l-4 border-emerald-500 bg-emerald-500/5 p-3.5 space-y-1 text-xs">
              <span className="font-display font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                {t('landing.pain_2_sol_title', 'GIẢI PHÁP 5TACTIQ')}
              </span>
              <p className="text-text-main leading-relaxed font-medium">
                {t('landing.pain_2_sol_desc', 'Tự động cưa đôi, cưa ba chi phí ngay sau trận. Quản lý rõ ràng ai đã đóng, ai còn nợ, giúp đội trưởng thảnh thơi hơn.')}
              </p>
            </div>
          </div>

          {/* Card 3: Vẽ sơ đồ & Bài tập 5v5 */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-6 flex flex-col justify-between shadow-[6px_6px_0px_0px_#323d29]">
            <div className="space-y-4">
              <div className="border-b-2 border-border-main/40 pb-3">
                <span className="font-display text-2xl font-extrabold text-secondary tracking-widest">03</span>
              </div>

              <h3 className="font-display text-lg sm:text-xl font-extrabold uppercase text-text-main leading-snug">
                {t('landing.pain_3_title', 'VẼ SƠ ĐỒ GIẤY KHÓ HÌNH DUNG')}
              </h3>

              <p className="text-xs text-text-muted leading-relaxed font-medium">
                {t('landing.pain_3_desc', 'Vẽ sơ đồ ra giấy rồi chụp gửi nhóm Zalo thường rất khó hiểu, anh em khó hình dung được nhịp chạy chỗ khi vào sân.')}
              </p>
            </div>

            <div className="mt-6 border-l-4 border-emerald-500 bg-emerald-500/5 p-3.5 space-y-1 text-xs">
              <span className="font-display font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                {t('landing.pain_3_sol_title', 'GIẢI PHÁP 5TACTIQ')}
              </span>
              <p className="text-text-main leading-relaxed font-medium">
                {t('landing.pain_3_sol_desc', 'Sa bàn điện tử 5v5 chuyên nghiệp. Kéo thả vị trí & xuất ngay ảnh động GIF gửi Zalo cho anh em hiểu bài ngay.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES EXPLORER — TABBED SECTION */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t-2 border-border-main">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight">
            {t('landing.core_title', 'TÍNH NĂNG CỐT LÕI CHO ĐỘI BÓNG')}
          </h2>
          <p className="text-text-muted text-sm mt-2 font-medium">
            {t('landing.core_subtitle', 'Mọi công cụ huấn luyện & quản lý được tích hợp trong một giao diện duy nhất.')}
          </p>
        </div>
        {/* Tab Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { id: 'tactics', label: t('landing.tab_tactics', 'Quản Lý Chiến Thuật') },
            { id: 'matchday', label: t('landing.tab_matchday', 'Lịch Sử Đối Đầu') },
            { id: 'venues', label: t('landing.tab_venues', 'Danh Bạ Sân Bóng') },
            { id: 'fitness', label: t('landing.tab_fitness', 'Xếp Loại Cầu Thủ') },
          ].map((tab) => {
            const isActive = activeFeatureTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFeatureTab(tab.id as any)}
                className={`px-4 py-2.5 font-display text-xs sm:text-sm uppercase tracking-wider font-bold transition-all border-2 cursor-pointer ${isActive
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-surface text-text-muted border-border-main hover:border-primary/50 hover:text-text-main'
                  }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Detail Display Card */}
        <div className="hallmark-card bg-surface border-2 border-border-main p-6 sm:p-8 shadow-[8px_8px_0px_0px_#323d29]">
          {activeFeatureTab === 'tactics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="font-display text-xs font-bold text-secondary uppercase tracking-widest">
                  {t('landing.card_tactics_sub', 'Mô phỏng & Thiết kế bài tập Sân 5')}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-primary">
                  {t('landing.card_tactics_title', 'SA BÀN CHIẾN THUẬT DÀNH RIÊNG CHO SÂN 5')}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed font-medium">
                  {t('landing.card_tactics_desc', 'Giao diện trực quan, cực kỳ dễ sử dụng. Tích hợp sẵn các form chiến thuật (1-2-1, 2-2, 3-1), giúp đội trưởng dễ dàng dàn trận và truyền bài cho anh em.')}
                </p>
                <ul className="space-y-2 text-xs font-semibold text-text-main pt-2">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_tactics_check1', 'Thao tác đơn giản, dễ dàn trận và sử dụng cho người mới bắt đầu')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_tactics_check2', 'Đề xuất sẵn các mẫu chiến thuật gợi ý đa dạng cho Sân 5')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_tactics_check3', 'Hỗ trợ xuất ảnh sơ đồ sắc nét & tự động tạo GIF hoạt hình chuyển động')}</span>
                  </li>
                </ul>
              </div>

              {/* Pitch Preview Canvas */}
              <div className="border-2 border-border-main bg-surface-2 p-3 shadow-md">
                <div ref={pitchRef} className="relative w-full aspect-[2/1] bg-[#1e7e34] border-2 border-emerald-950 shadow-md p-1.5 touch-none select-none overflow-hidden">
                  {/* Field Markings */}
                  <div className="absolute inset-2 border-2 border-white/80 pointer-events-none" />
                  <div className="absolute inset-y-2 left-1/2 w-0.5 bg-white/80 pointer-events-none" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-28 sm:h-28 rounded-full border-2 border-white/80 pointer-events-none" />

                  {/* Futsal D-shaped Penalty Area Left */}
                  <div className="absolute left-2 top-1/6 bottom-1/6 w-14 sm:w-20 border-2 border-l-0 border-white/80 rounded-r-full pointer-events-none" />
                  {/* Futsal D-shaped Penalty Area Right */}
                  <div className="absolute right-2 top-1/6 bottom-1/6 w-14 sm:w-20 border-2 border-r-0 border-white/80 rounded-l-full pointer-events-none" />

                  {/* Goal nets */}
                  <div className="absolute left-0 top-3/8 bottom-3/8 w-2 bg-white/40 border border-white" />
                  <div className="absolute right-0 top-3/8 bottom-3/8 w-2 bg-white/40 border border-white" />

                  {/* Draggable Ball */}
                  <motion.img
                    drag
                    dragConstraints={pitchRef}
                    dragElastic={0.05}
                    dragMomentum={false}
                    src="/ball.png"
                    alt="ball"
                    className="absolute left-[49.5%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 object-contain drop-shadow-md z-30 cursor-grab active:cursor-grabbing"
                  />

                  {/* Draggable Players */}
                  {FORMATIONS[activeFormation].players.map((player) => {
                    const isHome = player.team === 'home';
                    return (
                      <motion.div
                        key={player.id}
                        drag
                        dragConstraints={pitchRef}
                        dragElastic={0.05}
                        dragMomentum={false}
                        layout
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{ top: player.top, left: player.left }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-grab active:cursor-grabbing z-20"
                      >
                        <div
                          className={`rounded-full text-white font-mono font-extrabold text-[9px] sm:text-[10px] flex items-center justify-center shadow-md border-2 ${isHome
                              ? 'w-6 h-6 sm:w-7 sm:h-7 bg-[#d94833] border-white'
                              : 'w-5 h-5 sm:w-6 sm:h-6 bg-[#2563eb] border-white'
                            }`}
                        >
                          {isHome ? player.role : ''}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'matchday' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="font-display text-xs font-bold text-secondary uppercase tracking-widest">
                  {t('landing.card_matchday_sub', 'Lịch sử đối đầu & Thống kê')}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-primary">
                  {t('landing.card_matchday_title', 'LƯU LỊCH SỬ ĐỐI ĐẦU & THỐNG KÊ ĐỘI BÓNG')}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed font-medium">
                  {t('landing.card_matchday_desc', 'Lưu trữ chi tiết lịch sử đối đầu. Ghi nhận tỷ số, cầu thủ ghi bàn, kiến tạo và tự động tổng hợp phong độ cho toàn đội.')}
                </p>
                <ul className="space-y-2 text-xs font-semibold text-text-main pt-2">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_matchday_check1', 'Lưu trữ & tra cứu chi tiết lịch sử đối đầu giữa các đối thủ')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_matchday_check2', 'Cập nhật tỷ số trận đấu, ghi nhận danh sách cầu thủ ghi bàn & kiến tạo')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_matchday_check3', 'Tự động tổng hợp chỉ số hiệu suất & phong độ toàn đội bóng')}</span>
                  </li>
                </ul>
              </div>

              {/* Scoreboard Preview Card */}
              <div className="hallmark-card border-2 border-border-main bg-surface p-5 space-y-4 font-sans text-left shadow-[4px_4px_0px_0px_#323d29]">
                <div className="flex items-center justify-between border-b-2 border-border-main pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-display font-bold text-primary uppercase tracking-wider">{t('landing.card_matchday_h2h', 'LỊCH SỬ ĐỐI ĐẦU')}</span>
                  </div>
                  <span className="text-[10px] font-display font-bold uppercase tracking-wider px-2.5 py-0.5 bg-surface-2 border border-border-main text-text-main">
                    {t('landing.card_matchday_last', 'LẦN GẶP GẦN NHẤT')}
                  </span>
                </div>

                <div className="p-4 bg-surface-2 border-2 border-border-main flex items-center justify-between shadow-sm">
                  <div className="flex flex-col items-center gap-1 text-center flex-1">
                    <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-primary text-primary flex items-center justify-center font-display font-bold text-xs uppercase">
                      KAT
                    </div>
                    <span className="font-display font-extrabold text-sm sm:text-base text-text-main uppercase tracking-wider">KAT FC</span>
                  </div>

                  <div className="px-5 py-2 bg-primary text-white border-2 border-primary font-display text-2xl font-black tracking-widest shadow-sm">
                    5 - 3
                  </div>

                  <div className="flex flex-col items-center gap-1 text-center flex-1">
                    <div className="w-9 h-9 rounded-full bg-secondary/10 border-2 border-secondary text-secondary flex items-center justify-center font-display font-bold text-xs uppercase">
                      ARB
                    </div>
                    <span className="font-display font-extrabold text-sm sm:text-base text-text-main uppercase tracking-wider">ARB FC</span>
                  </div>
                </div>

                <div className="p-3 bg-surface-2 border border-border-main flex items-center justify-between text-xs">
                  <span className="font-display font-bold text-text-muted uppercase tracking-wider">{t('landing.card_matchday_goals', 'GHI BÀN:')}</span>
                  <span className="font-sans font-bold text-secondary">Bảo (3'), Khang (18'), Tùng (35')</span>
                </div>

                <div className="flex items-center justify-between text-xs font-display uppercase tracking-wider pt-2 text-text-muted border-t-2 border-border-main">
                  <span>{t('landing.card_matchday_record', 'THÀNH TÍCH ĐỐI ĐẦU')}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{t('landing.card_matchday_stats', '12 THẮNG - 3 HÒA - 2 THUA')}</span>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'venues' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="font-display text-xs font-bold text-secondary uppercase tracking-widest">
                  {t('landing.card_venues_sub', 'Địa điểm & Sân bóng')}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-primary">
                  {t('landing.card_venues_title', 'DANH BẠ SÂN BÓNG & GỌI ĐẶT SÂN NHANH CHÓNG')}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed font-medium">
                  {t('landing.card_venues_desc', 'Lưu danh bạ sân bóng quen thuộc. Nhấn 1 chạm để gọi điện đặt sân hoặc mở bản đồ chỉ đường cực kỳ nhanh chóng.')}
                </p>
                <ul className="space-y-2 text-xs font-semibold text-text-main pt-2">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_venues_check1', 'Tra cứu nhanh vị trí địa chỉ sân bóng & chỉ đường Google Maps')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_venues_check2', 'Một chạm gọi điện trực tiếp cho chủ sân để đặt lịch đá')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_venues_check3', 'Lưu thông tin giá thuê sân, loại mặt cỏ & khung giờ cố định')}</span>
                  </li>
                </ul>
              </div>

              {/* Venues Preview Card */}
              <div className="hallmark-card border-2 border-border-main bg-surface p-6 shadow-[4px_4px_0px_0px_#323d29] space-y-4 font-sans text-left">
                <h4 className="font-display text-xl sm:text-2xl font-extrabold uppercase text-secondary tracking-wide">
                  SÂN BÓNG ĐÁ BÌNH TRỊ ĐÔNG
                </h4>

                <div className="flex items-start gap-2 text-xs text-text-muted leading-relaxed">
                  <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                  <span>301/4 Chiến Lược, Bình Trị Đông, Hồ Chí Minh, Việt Nam</span>
                </div>

                <div className="pt-2 flex justify-end">
                  <div className="hallmark-btn bg-emerald-600 text-white border-2 border-emerald-600 px-5 py-3 inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider font-bold shadow-sm select-none pointer-events-none">
                    <Phone className="w-4 h-4 fill-current" />
                    <span>{t('landing.card_venues_call', 'GỌI ĐẶT SÂN:')} 0939363381</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'fitness' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <span className="font-display text-xs font-bold text-secondary uppercase tracking-widest">
                  {t('landing.card_fitness_sub', 'Chỉ số & Chia đội')}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold uppercase text-primary">
                  {t('landing.card_fitness_title', 'PHÂN HẠNG TIER CẦU THỦ S/A/B/C & CHIA TEAM THÔNG MINH')}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed font-medium">
                  {t('landing.card_fitness_desc', 'Phân loại trình độ theo các Tier S/A/B/C. Thuật toán chia 2 đội tự động dựa trên sức mạnh tổng, giúp kèo đấu nội bộ luôn cân bằng.')}
                </p>
                <ul className="space-y-2 text-xs font-semibold text-text-main pt-2">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_fitness_check1', 'Phân hạng trình độ cầu thủ rõ ràng theo các bậc Tier S / A / B / C')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_fitness_check2', 'Tự động chia 2 team đá nội bộ cân bằng 50% - 50% trình độ')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 border border-emerald-700 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{t('landing.card_fitness_check3', 'Theo dõi điểm phong độ, bàn thắng & hiệu suất từng cầu thủ')}</span>
                  </li>
                </ul>
              </div>

              {/* Tier Ranking Preview Card (Single-line per row Tiermaker UI) */}
              <div className="hallmark-card border-2 border-border-main bg-surface p-5 sm:p-6 space-y-4 font-sans text-left shadow-[6px_6px_0px_0px_#323d29]">
                
                {/* Tiermaker Rows Table */}
                <div className="space-y-2.5 font-display text-xs">
                  {/* Tier S Row */}
                  <div className="flex border-2 border-amber-500/40 bg-amber-500/5 overflow-hidden shadow-xs">
                    <div className="w-12 sm:w-14 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center p-2.5 border-r-2 border-amber-500/30 text-lg sm:text-xl shrink-0">
                      S
                    </div>
                    <div className="p-2 flex items-center gap-2 flex-1 bg-surface font-display overflow-x-auto whitespace-nowrap">
                      <span className="px-2.5 py-1 border-2 border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">LÝ AN</span>
                      <span className="px-2.5 py-1 border-2 border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">BÙI MINH KHANG</span>
                    </div>
                  </div>

                  {/* Tier A Row */}
                  <div className="flex border-2 border-emerald-500/40 bg-emerald-500/5 overflow-hidden shadow-xs">
                    <div className="w-12 sm:w-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center p-2.5 border-r-2 border-emerald-500/30 text-lg sm:text-xl shrink-0">
                      A
                    </div>
                    <div className="p-2 flex items-center gap-2 flex-1 bg-surface font-display overflow-x-auto whitespace-nowrap">
                      <span className="px-2.5 py-1 border-2 border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">GIA BẢO</span>
                      <span className="px-2.5 py-1 border-2 border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">NGUYỄN KHOA</span>
                      <span className="px-2.5 py-1 border-2 border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">MINH TẤN</span>
                    </div>
                  </div>

                  {/* Tier B Row */}
                  <div className="flex border-2 border-blue-500/40 bg-blue-500/5 overflow-hidden shadow-xs">
                    <div className="w-12 sm:w-14 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold flex items-center justify-center p-2.5 border-r-2 border-blue-500/30 text-lg sm:text-xl shrink-0">
                      B
                    </div>
                    <div className="p-2 flex items-center gap-2 flex-1 bg-surface font-display overflow-x-auto whitespace-nowrap">
                      <span className="px-2.5 py-1 border-2 border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">THANH LỘC</span>
                      <span className="px-2.5 py-1 border-2 border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">THÀNH VIỆT</span>
                    </div>
                  </div>

                  {/* Tier C Row */}
                  <div className="flex border-2 border-border-main/50 bg-surface-2 overflow-hidden shadow-xs">
                    <div className="w-12 sm:w-14 bg-surface-2 text-text-muted font-extrabold flex items-center justify-center p-2.5 border-r-2 border-border-main shrink-0 text-lg sm:text-xl">
                      C
                    </div>
                    <div className="p-2 flex items-center gap-2 flex-1 bg-surface font-display overflow-x-auto whitespace-nowrap">
                      <span className="px-2.5 py-1 border-2 border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">MAI TẤN ANH</span>
                    </div>
                  </div>
                </div>

                {/* Unranked Section */}
                <div className="pt-1 space-y-1.5">
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-text-muted block">
                    {t('landing.card_fitness_unranked', 'CHƯA XẾP HẠNG')} (2)
                  </span>
                  <div className="border-2 border-dashed border-border-main p-2.5 bg-surface-2 flex items-center gap-2 font-display overflow-x-auto whitespace-nowrap">
                    <span className="px-2.5 py-1 border border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">QUỐC ANH</span>
                    <span className="px-2.5 py-1 border border-border-main bg-surface font-bold text-xs uppercase tracking-wider text-text-main shadow-xs">THANH TÙNG</span>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ — CÂU HỎI THƯỜNG GẶP */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t-2 border-border-main">
        <div className="text-center space-y-2 mb-10">
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-text-main">
            {t('landing.faq_title', 'CÂU HỎI THƯỜNG GẶP (FAQ)')}
          </h2>
          <p className="text-sm text-text-muted max-w-lg mx-auto font-medium">
            {t('landing.faq_subtitle', 'Giải đáp tất cả thắc mắc về cách sử dụng, lưu trữ dữ liệu và tính phí của 5TactiQ.')}
          </p>
        </div>

        <div className="space-y-3 font-sans">
          {[
            {
              q: t('landing.faq_q1', 'Ứng dụng 5TactiQ có hoàn toàn miễn phí không?'),
              a: t('landing.faq_a1', 'Có. 5TactiQ hoàn toàn miễn phí cho anh em đội trưởng & HLV. Bạn có thể tạo sơ đồ, điểm danh và chia đội thoải mái mà không tốn phí.')
            },
            {
              q: t('landing.faq_q2', 'Dữ liệu sơ đồ chiến thuật và lịch sử đội bóng được lưu ở đâu?'),
              a: t('landing.faq_a2', 'Ở chế độ Khách, dữ liệu lưu ngay trên máy (offline). Khi bạn đăng nhập, toàn bộ dữ liệu sẽ tự động đồng bộ lên Đám mây, không lo mất dữ liệu và có thể xem trên nhiều thiết bị.')
            },
            {
              q: t('landing.faq_q3', 'Có ứng dụng để cài đặt lên Điện thoại & Máy tính không?'),
              a: t('landing.faq_a3', 'Có. Với iPhone/iPad, bạn có thể \'Thêm vào màn hình chính\' (PWA). Với Android, Windows & Linux, đã có sẵn bộ cài đặt tải về dùng như app bình thường.')
            },
            {
              q: t('landing.faq_q4', 'Làm thế nào để truyền tải chiến thuật cho các cầu thủ trong đội?'),
              a: t('landing.faq_a4', 'Bạn có thể mở sa bàn ngay trên sân để chỉ bài trực tiếp, hoặc tải về ảnh sơ đồ & ảnh GIF gửi thẳng vào nhóm Zalo để anh em dễ hình dung trước khi ra sân.')
            }
          ].map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="hallmark-card bg-surface border-2 border-border-main overflow-hidden transition-all shadow-sm"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-text-main flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-2/60 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-secondary' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t-2 border-border-main/50 bg-surface-2/40 px-4 sm:px-5 py-3.5 text-xs sm:text-sm text-text-muted leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t-2 border-border-main bg-surface text-text-muted text-xs font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8 pb-8 border-b-2 border-border-main/60">
          {/* Col 1: Brand & Bio */}
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold text-primary uppercase tracking-widest">5TACTIQ</span>
              <span className="text-xs text-text-muted">{t('landing.footer_brand_sub', '— Ứng dụng quản lý đội bóng thông minh')}</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed font-medium">
              {t('landing.footer_brand_desc', 'Hệ điều hành mini dành riêng cho Đội trưởng & HLV Sân 5: Sơ đồ chiến thuật, lịch sử đối đầu, danh bạ sân bóng và phân hạng cầu thủ.')}
            </p>
          </div>

          {/* Col 2: Support & Contact (Right-aligned) */}
          <div className="space-y-2.5">
            <span className="font-display font-bold text-text-main uppercase text-xs tracking-wider block">
              {t('landing.footer_support_title', 'KÊNH HỖ TRỢ ĐỘI TRƯỜNG')}
            </span>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <a href="https://www.facebook.com/tthanhtung2306?locale=vi_VN" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-text-muted hover:text-blue-600 transition-colors">
                  <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>{t('landing.footer_fb_label', 'Facebook: Thanh Tùng')}</span>
                </a>
              </li>
              <li>
                <a href="mailto:trevorthanhtung@gmail.com" className="flex items-center gap-2 text-text-muted hover:text-secondary transition-colors">
                  <Mail className="w-4 h-4 text-secondary" />
                  <span>{t('landing.footer_email_label', 'Email: trevorthanhtung@gmail.com')}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits Line */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-display uppercase tracking-wider text-text-muted">
          <div>
            <span>{t('landing.footer_rights', '© 2026 5TACTIQ. BẢO LƯU MỌI QUYỀN.')}</span>
          </div>

          <div className="normal-case font-sans italic">
            {t('landing.footer_made_by', 'thực hiện bởi')}{" "}
            <a
              href="https://tranthanhtung-trevor.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold text-emerald-600 dark:text-emerald-400 hover:text-secondary transition-colors"
            >
              thanhtungg.
            </a>
          </div>
        </div>
      </footer>

      {/* MULTI-PLATFORM DOWNLOAD SELECTION MODAL */}
      <BottomSheet
        isOpen={showPWAInstructionModal}
        onClose={() => {
          setShowPWAInstructionModal(false);
          setDownloadModalTab('options');
        }}
        title={t('landing.download_modal_title')}
        maxWidth="3xl"
      >
        {downloadModalTab === 'options' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {/* Android APK */}
            <a
              href="https://github.com/trevorthanhtung/5TactiQ/releases/latest/download/5TactiQ.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="hallmark-card bg-surface-2 hover:bg-surface border-2 border-border-main p-4 flex flex-col items-center justify-between text-center transition-all shadow-sm hover:shadow-md cursor-pointer group space-y-3"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-9 h-9 text-emerald-500 fill-current" viewBox="0 0 24 24">
                    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5516 0 .9997.4482.9997.9993s-.4481.9997-.9997.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5516 0 .9997.4482.9997.9993s-.4481.9997-.9997.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.3582 13.8533 8.001 12 8.001s-3.5902.3572-5.1368.9497L4.8409 5.4477a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.0664.4444 14.3015.4444 18.0667h23.1112c0-3.7652-2.2445-6.9993-5.6742-8.7453z" />
                  </svg>
                </div>
                <div>
                  <span className="font-display font-extrabold text-sm text-text-main uppercase block">Android</span>
                </div>
              </div>
              <div className="w-full hallmark-btn bg-emerald-600 text-white border-2 border-emerald-600 px-1.5 py-2 flex items-center justify-center gap-1 font-display text-[11px] sm:text-xs uppercase tracking-tight font-bold shadow-xs group-hover:bg-emerald-700 transition-colors">
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t('landing.download_now')}</span>
              </div>
            </a>

            {/* Windows EXE */}
            <a
              href="https://github.com/trevorthanhtung/5TactiQ/releases/latest/download/5TactiQ-1.0.0-Portable.exe"
              target="_blank"
              rel="noopener noreferrer"
              className="hallmark-card bg-surface-2 hover:bg-surface border-2 border-border-main p-4 flex flex-col items-center justify-between text-center transition-all shadow-sm hover:shadow-md cursor-pointer group space-y-3"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-blue-500 fill-current" viewBox="0 0 24 24">
                    <path d="M0 3.449L9.75 2.1v9.451H0m10.95-9.625L24 0v11.4H10.95M0 12.6h9.75v9.451L0 20.699M10.95 12.6H24V24l-13.05-1.801" />
                  </svg>
                </div>
                <div>
                  <span className="font-display font-extrabold text-sm text-text-main uppercase block">Windows</span>
                </div>
              </div>
              <div className="w-full hallmark-btn bg-blue-600 text-white border-2 border-blue-600 px-1.5 py-2 flex items-center justify-center gap-1 font-display text-[11px] sm:text-xs uppercase tracking-tight font-bold shadow-xs group-hover:bg-blue-700 transition-colors">
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t('landing.download_now')}</span>
              </div>
            </a>

            {/* Linux AppImage */}
            <a
              href="https://github.com/trevorthanhtung/5TactiQ/releases/latest/download/5TactiQ.AppImage"
              target="_blank"
              rel="noopener noreferrer"
              className="hallmark-card bg-surface-2 hover:bg-surface border-2 border-border-main p-4 flex flex-col items-center justify-between text-center transition-all shadow-sm hover:shadow-md cursor-pointer group space-y-3"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/ubuntu.svg" alt="Ubuntu" className="w-9 h-9 object-contain" />
                </div>
                <div>
                  <span className="font-display font-extrabold text-sm text-text-main uppercase block">Linux</span>
                </div>
              </div>
              <div className="w-full hallmark-btn bg-amber-600 text-white border-2 border-amber-600 px-1.5 py-2 flex items-center justify-center gap-1 font-display text-[11px] sm:text-xs uppercase tracking-tight font-bold shadow-xs group-hover:bg-amber-700 transition-colors">
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t('landing.download_now')}</span>
              </div>
            </a>

            {/* Apple iOS/macOS PWA */}
            <div
              onClick={() => setDownloadModalTab('apple_pwa')}
              className="hallmark-card bg-surface-2 hover:bg-surface border-2 border-border-main p-4 flex flex-col items-center justify-between text-center transition-all shadow-sm hover:shadow-md cursor-pointer group space-y-3"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <img src="/apple.png" alt="Apple" className="w-9 h-9 object-contain" />
                </div>
                <div>
                  <span className="font-display font-extrabold text-sm text-text-main uppercase block">Apple</span>
                </div>
              </div>
              <div className="w-full hallmark-btn bg-neutral-900 text-white border-2 border-neutral-900 px-1.5 py-2 flex items-center justify-center gap-1 font-display text-[11px] sm:text-xs uppercase tracking-tight font-bold shadow-xs group-hover:bg-black transition-colors">
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t('landing.download_now')}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Apple PWA Tab View */
          <div className="space-y-3 pt-1">
            <div className="p-3.5 bg-surface-2 border border-border-main space-y-1">
              <p className="font-bold text-text-main flex items-center gap-2 text-xs uppercase font-display">
                <Smartphone className="w-4 h-4 text-secondary" />
                {t('landing.apple_pwa_ios_title')}
              </p>
              <p className="text-xs text-text-muted">{t('landing.apple_pwa_ios_step1')}</p>
              <p className="text-xs text-text-muted">{t('landing.apple_pwa_ios_step2')}</p>
            </div>

            <div className="p-3.5 bg-surface-2 border border-border-main space-y-1">
              <p className="font-bold text-text-main flex items-center gap-2 text-xs uppercase font-display">
                <Monitor className="w-4 h-4 text-blue-500" />
                {t('landing.apple_pwa_mac_title')}
              </p>
              <p className="text-xs text-text-muted">{t('landing.apple_pwa_mac_step1')}</p>
              <p className="text-xs text-text-muted">{t('landing.apple_pwa_mac_step2')}</p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => setDownloadModalTab('options')}
                className="hallmark-btn-outline px-4 py-2 border-2 border-border-main text-text-main font-display text-xs uppercase tracking-wider font-bold cursor-pointer"
              >
                ← {t('landing.apple_pwa_back')}
              </button>
              <button
                onClick={() => {
                  setShowPWAInstructionModal(false);
                  setDownloadModalTab('options');
                }}
                className="hallmark-btn bg-primary text-white border-2 border-primary px-5 py-2 font-display text-xs uppercase tracking-wider font-bold cursor-pointer"
              >
                {t('landing.apple_pwa_got_it')}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
