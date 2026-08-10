import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, History, Settings, ChevronRight, MapPin, RefreshCw, ShieldCheck, Info, Coffee, MessageSquare, Package, Eraser, AlertTriangle, Smartphone, BellRing, Globe, Check, Moon, Sun, Monitor, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppBadge } from '../hooks/useAppBadge';
import { useWebPush } from '../hooks/useWebPush';
import { useToastStore } from '../store/useToastStore';
import { MoreSkeleton } from '../components/ui/MoreSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import SettingsModal from './Settings';

import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import { useAppUpdateStore } from '../store/useAppUpdateStore';
import { APP_VERSION } from '../config/version';

export default function More() {
  const { t, i18n } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{title: string, message: string, image?: string, isAppInfo?: boolean} | null>(null);
  const [confirmInfo, setConfirmInfo] = useState<{title: string, message: string, onConfirm: () => void, requireInput?: string} | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  
  const { setBadge, clearBadge } = useAppBadge();
  const { permission: pushPermission, requestPermission, showLocalNotification } = useWebPush();
  const addToast = useToastStore(state => state.addToast);
  const teamName = useSettingsStore(state => state.settings.teamName);
  const { theme, setTheme } = useThemeStore();
  const { hasUpdate, latestVersion, setShowUpdateModal } = useAppUpdateStore();
  const [badgeCount, setBadgeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300); // 300ms is enough for this screen
    return () => clearTimeout(timer);
  }, []);

  const handleTestBadge = () => {
    const nextCount = badgeCount + 1;
    setBadgeCount(nextCount);
    setBadge(nextCount);
    addToast({ 
      type: 'success', 
      message: t('toast.badge_test', `Đã gắn badge số ${nextCount}. Hãy thoát ra màn hình chính để xem chấm đỏ.`),
      duration: 3000
    });
  };
  const featureItems = [
    { icon: <MapPin className="text-amber-600" size={24} />, title: t('more.venues_title'), path: '/venues', desc: t('more.venues_desc') },
    { icon: <HeartPulse className="text-rose-500" size={24} />, title: t('more.fitness_title'), path: '/fitness', desc: t('more.fitness_desc') },
    { 
      icon: <History className="text-emerald-600" size={24} />, 
      title: t('more.h2h_title'), 
      path: '/head-to-head', 
      desc: t('more.h2h_desc')
    },
    {
      icon: <Crown className="text-amber-500" size={24} />,
      title: t('more.tier_title'),
      path: '/tier-ranking',
      desc: t('more.tier_desc')
    },
  ];

  const languages = [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' },
    { code: 'ru', name: 'Русский' }
  ];

  const systemItems = [
    { icon: <Settings className="text-text-muted" size={24} />, title: t('more.settings_title'), action: () => setIsSettingsOpen(true), desc: t('more.settings_desc') },
    { icon: <RefreshCw className="text-blue-600" size={24} />, title: t('more.sync_title'), path: '/sync', desc: t('more.sync_desc') },
    { 
      icon: <Globe size={24} className="text-teal-500" />, 
      title: t('more.language', 'Ngôn ngữ'), 
      desc: t('more.language_desc', 'Thay đổi ngôn ngữ hiển thị'),
      action: () => setIsLanguageOpen(true)
    },
    {
      icon: theme === 'dark' ? <Moon size={24} className="text-indigo-400" /> : <Sun size={24} className="text-amber-500" />,
      title: t('more.theme_title'),
      desc: t('more.theme_desc'),
      action: () => setIsThemeOpen(true)
    },
    { 
      icon: <Eraser size={24} className="text-pink-500" />, 
      title: t('more.cache_title'), 
      desc: t('more.cache_desc'),
      action: async () => {
        try {
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          addToast({ 
            type: 'success', 
            message: t('toast.cache_cleared', 'Đã dọn dẹp bộ nhớ đệm cache'),
            duration: 3000
          });
        } catch (error) {
          addToast({ 
            type: 'error', 
            message: t('toast.cache_clear_error', 'Có lỗi xảy ra khi dọn dẹp bộ nhớ đệm.'),
            duration: 3000
          });
        }
      } 
    },
  ];

  const supportItems = [
    { icon: <ShieldCheck size={20} className="text-indigo-500" />, title: t('more.privacy_title'), action: () => setAlertInfo({ title: t('more.privacy_title'), message: `${t('more.privacy_msg_1')}\n\n${t('more.privacy_msg_2')}` }) },
    { icon: <Info size={20} className="text-fuchsia-500" />, title: t('more.app_info_title'), action: () => setAlertInfo({ title: t('more.app_info_title'), message: '', isAppInfo: true }) },
    { icon: <Coffee size={20} className="text-amber-500" />, title: t('more.donate_title'), action: () => setAlertInfo({ 
      title: t('more.donate_title'), 
      message: t('more.donate_msg'),
      image: 'https://img.vietqr.io/image/mbbank-0816158215-compact2.png?accountName=TRAN%20THANH%20TUNG'
    }) },
    { icon: <MessageSquare size={20} className="text-sky-500" />, title: t('more.feedback_title'), action: () => window.open('mailto:trevorthanhtung@gmail.com?subject=Góp ý ứng dụng 5TactiQ') },
    hasUpdate 
      ? { icon: <Package size={20} className="text-blue-500" />, title: `CẬP NHẬT PHIÊN BẢN (v${latestVersion})`, action: () => setShowUpdateModal(true) }
      : { icon: <Package size={20} className="text-text-muted" />, title: t('more.version_title'), value: APP_VERSION },
  ];

  const dangerItems = [
    { 
      icon: <AlertTriangle size={20} className="text-red-500" />, 
      title: t('more.reset_title'), 
      desc: t('more.reset_desc'),
      action: () => {
        setConfirmInput('');
        setConfirmInfo({
          title: t('more.reset_alert_title', 'CẢNH BÁO NGUY HIỂM'),
          message: t('more.reset_alert_msg', { teamName, defaultValue: `Hành động này sẽ xóa TOÀN BỘ dữ liệu đội bóng, cầu thủ và trận đấu của bạn.\nKhông thể khôi phục lại.\n\nVui lòng nhập đúng tên đội bóng "{{teamName}}" để xác nhận:` }),
          requireInput: teamName,
          onConfirm: async () => {
            localStorage.clear();
            try {
              const { Preferences } = await import('@capacitor/preferences');
              await Preferences.clear();
            } catch (e) {
              console.error("Failed to clear Capacitor preferences", e);
            }
            setTimeout(() => {
              // Avoid window.location.replace('/') in Electron (file:// protocol) as it redirects to system root C:/
              window.location.hash = '/';
              window.location.reload();
            }, 100);
          }
        });
      },
      isDanger: true
    },
  ];

  const renderSection = (items: any[]) => {
    return (
      <div className="flex flex-col gap-3 @sm:gap-4">
        {items.map((item, idx) => {
          const content = (
            <>
              <div className={`w-10 h-10 @sm:w-12 @sm:h-12 border-2 ${item.isDanger ? 'border-red-500/20 bg-red-500/10 group-hover:border-red-500' : 'border-border-main bg-primary/5 group-hover:border-primary'} flex items-center justify-center mr-3 @sm:mr-4 shrink-0 transition-colors`}>
                {item.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-display font-bold uppercase tracking-wider @sm:tracking-widest text-lg @sm:text-xl leading-tight ${item.isDanger ? 'text-red-600 group-hover:text-red-700' : 'text-primary group-hover:text-secondary'} transition-colors truncate`} title={item.title}>
                    {item.title}
                  </h3>
                </div>
                {item.desc && (
                  <p className="text-xs @sm:text-sm text-text-muted mt-1 font-sans">{item.desc}</p>
                )}
              </div>
              {item.value ? (
                <div className="px-2 py-1 bg-surface text-text-muted font-mono font-bold border-2 border-border-main shrink-0">
                  {item.value}
                </div>
              ) : (
                <div className={`w-8 h-8 flex items-center justify-center border-2 border-transparent ${item.isDanger ? 'group-hover:border-red-500 group-hover:bg-red-500/10' : 'group-hover:border-secondary group-hover:bg-secondary/10'} transition-all rounded-none shrink-0`}>
                  <ChevronRight className={`text-slate-300 ${item.isDanger ? 'group-hover:text-red-500' : 'group-hover:text-secondary'} transition-colors`} />
                </div>
              )}
            </>
          );

          if (item.path) {
            return (
              <Link 
                key={idx}
                to={item.path}
                className={`hallmark-card flex items-center p-4 transition-all group relative border-2 ${item.isDanger ? 'border-red-500/20 hover:shadow-[4px_4px_0px_0px_#ef4444]' : 'border-border-main hover:shadow-[4px_4px_0px_0px_var(--color-primary)]'} cursor-pointer hover:-translate-y-1`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div 
              key={idx}
              onClick={item.action}
              className={`hallmark-card flex items-center p-4 transition-all group relative border-2 ${item.isDanger ? 'border-red-500/20 hover:shadow-[4px_4px_0px_0px_#ef4444]' : 'border-border-main hover:shadow-[4px_4px_0px_0px_var(--color-primary)]'} ${item.action ? 'cursor-pointer hover:-translate-y-1' : ''}`}
            >
              {content}
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return <MoreSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8">
      <header className="mb-6 pt-2">
        <h1 className="text-4xl @sm:text-5xl font-display uppercase text-primary leading-none">{t('more.title', 'THÊM')}</h1>
        <div className="hallmark-divider"></div>
      </header>
      
      <div className="mb-8">
        <h2 className="text-sm font-display font-bold text-text-muted uppercase tracking-widest mb-4">{t('more.section_features')}</h2>
        {renderSection(featureItems)}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-display font-bold text-text-muted uppercase tracking-widest mb-4">{t('more.section_system')}</h2>
        {renderSection(systemItems)}
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-display font-bold text-text-muted uppercase tracking-widest mb-4">{t('more.section_support')}</h2>
        {renderSection(supportItems)}
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-display font-bold text-red-500 uppercase tracking-widest mb-4">{t('more.danger_zone', 'VÙNG NGUY HIỂM')}</h2>
        {renderSection(dangerItems)}
      </div>
      


      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Alert Modal */}
      <BottomSheet
        isOpen={!!alertInfo}
        onClose={() => setAlertInfo(null)}
        title={
          alertInfo?.isAppInfo ? (
            <span className="flex items-center gap-2">
              <Info size={24} /> {t('more.app_info_title')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Info size={24} /> {alertInfo?.title}
            </span>
          )
        }
      >
        <div className="flex flex-col">
          {alertInfo?.isAppInfo ? (
            <div className="flex flex-col items-center text-center mb-6 mt-2">
              <img src="./logo.png" alt="5TactiQ Logo" className="w-28 h-28 object-contain mb-4 drop-shadow-md" />
              <h4 className="text-2xl font-display font-bold text-primary mb-2">5TactiQ</h4>
              <div className="bg-primary text-[#f6f4ed] px-4 py-1.5 rounded-sm text-xs font-bold tracking-widest mb-4">{t('more.version_title')} {APP_VERSION}</div>
              <p className="text-text-muted text-sm leading-relaxed mb-4">{t('more.app_info_desc')}</p>
              <div className="w-12 h-1 bg-primary/20 mb-4 rounded-full"></div>
              <a href="https://www.youtube.com/@kat.thanhtungg" target="_blank" rel="noopener noreferrer" className="text-gray-400 text-xs font-medium uppercase tracking-wider hover:text-primary transition-colors cursor-pointer">{t('more.app_info_author')}</a>
            </div>
          ) : (
            <>
              {alertInfo?.image && (
                <div className="mb-4 flex justify-center">
                  <img src={alertInfo.image} alt="QR Code" className="w-full max-w-[200px] h-auto object-contain border-2 border-border-main p-2 bg-surface rounded-lg shadow-sm" />
                </div>
              )}
              <p className="text-text-muted text-sm md:text-base font-sans mb-8 whitespace-pre-line leading-relaxed">{alertInfo?.message}</p>
            </>
          )}
          <button 
            onClick={() => setAlertInfo(null)}
            className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95"
          >
            {t('more.understood')}
          </button>
        </div>
      </BottomSheet>

      {/* Confirm Modal */}
      <BottomSheet
        isOpen={!!confirmInfo}
        onClose={() => setConfirmInfo(null)}
        variant="danger"
        title={
          <span className="flex items-center gap-2">
            <AlertTriangle size={24} /> {confirmInfo?.title}
          </span>
        }
      >
        <div className="flex flex-col">
          <p className="text-text-muted text-sm md:text-base font-sans mb-4 whitespace-pre-line leading-relaxed">{confirmInfo?.message}</p>
          
          {confirmInfo?.requireInput && (
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={confirmInfo.requireInput}
              className="w-full border-2 border-slate-300 p-3 mb-8 outline-none focus:border-red-500 font-display text-center"
            />
          )}
          {!confirmInfo?.requireInput && <div className="mb-4"></div>}

          <div className="flex gap-3">
            <button 
              onClick={() => setConfirmInfo(null)}
              className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-slate-300 hover:bg-surface transition-colors active:scale-95"
            >
              {t('more.cancel')}
            </button>
            <button 
              onClick={() => {
                confirmInfo?.onConfirm();
                setConfirmInfo(null);
              }}
              disabled={confirmInfo?.requireInput ? confirmInput !== confirmInfo.requireInput : false}
              className="flex-1 bg-rose-600 text-white font-display uppercase tracking-wider py-3 border-2 border-rose-700 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95"
            >
              {t('more.confirm')}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Language Modal */}
      <BottomSheet
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Globe size={24} className="text-primary" /> {t('more.language', 'Ngôn ngữ')}
          </span>
        }
      >
        <div className="flex flex-col gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                i18n.changeLanguage(lang.code);
                setIsLanguageOpen(false);
                addToast({ 
                  type: 'success', 
                  message: `${t('more.language_changed')} ${lang.name}`,
                  duration: 3000
                });
              }}
              className={`flex items-center justify-between p-4 border-2 transition-all active:scale-95 ${i18n.language === lang.code ? 'border-primary bg-primary/5 text-primary shadow-[4px_4px_0px_0px_var(--color-primary)]' : 'border-border-main text-text-muted hover:border-primary/50'}`}
            >
              <span className="font-display uppercase tracking-wider font-bold text-lg">{lang.name}</span>
              {i18n.language === lang.code && <Check size={24} className="text-primary" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Theme Modal */}
      <BottomSheet
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Monitor size={24} className="text-primary" /> {t('more.theme_title')}
          </span>
        }
      >
        <div className="flex flex-col gap-3">
          {(
            [
              { value: 'light', label: t('more.theme_light'), icon: <Sun size={24} className="text-amber-500" /> },
              { value: 'dark', label: t('more.theme_dark'), icon: <Moon size={24} className="text-indigo-400" /> },
              { value: 'system', label: t('more.theme_system'), icon: <Monitor size={24} className="text-text-muted" /> }
            ] as const
          ).map((tOpt) => (
            <button
              key={tOpt.value}
              onClick={() => {
                setTheme(tOpt.value);
                setIsThemeOpen(false);
                addToast({ 
                  type: 'success', 
                  message: `${t('more.theme_changed')} ${tOpt.label}`,
                  duration: 3000
                });
              }}
              className={`flex items-center gap-3 p-4 border-2 transition-all active:scale-95 ${theme === tOpt.value ? 'border-primary bg-primary/5 text-primary shadow-[4px_4px_0px_0px_var(--color-primary)]' : 'border-border-main text-text-muted hover:border-primary/50'}`}
            >
              <div className="flex-1 flex items-center gap-3">
                {tOpt.icon}
                <span className="font-display uppercase tracking-wider font-bold text-lg">{tOpt.label}</span>
              </div>
              {theme === tOpt.value && <Check size={24} className="text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}

