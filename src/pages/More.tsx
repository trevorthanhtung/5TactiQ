import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, History, Settings, ChevronRight, MapPin, RefreshCw, ShieldCheck, Info, Coffee, MessageSquare, Package, Eraser, AlertTriangle, Smartphone, BellRing, Globe, Check, Moon, Sun, Monitor, Crown, LogOut, User as UserIcon, LogIn, Save, Cloud, CloudOff, Wifi, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAppBadge } from '../hooks/useAppBadge';
import { useWebPush } from '../hooks/useWebPush';
import { useToastStore } from '../store/useToastStore';
import { MoreSkeleton } from '../components/ui/MoreSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import SettingsModal from './Settings';

import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import { useAppUpdateStore } from '../store/useAppUpdateStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCloudSync } from '../hooks/useCloudSync';
import { APP_VERSION } from '../config/version';

export default function More() {
  const { t, i18n } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{title: string, message: string, image?: string, isAppInfo?: boolean, isDonate?: boolean, paypalUrl?: string} | null>(null);
  const [confirmInfo, setConfirmInfo] = useState<{title: string, message: string, onConfirm: () => void, requireInput?: string} | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const { isOnline, syncStatus, lastSyncedAt, syncNow } = useCloudSync();
  
  const { setBadge, clearBadge } = useAppBadge();
  const { permission: pushPermission, requestPermission, showLocalNotification } = useWebPush();
  const { settings, updateSettings } = useSettingsStore();
  const teamName = settings.teamName;
  const { theme, setTheme } = useThemeStore();
  const { hasUpdate, latestVersion, setShowUpdateModal } = useAppUpdateStore();
  const { session, isGuest, signOut, setGuest } = useAuthStore();
  const addToast = useToastStore(state => state.addToast);
  const [badgeCount, setBadgeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300); // 300ms is enough for this screen
    return () => clearTimeout(timer);
  }, []);

  const handleOpenProfile = () => {
    if (session) {
      const currentName = session.user.user_metadata?.custom_display_name || session.user.user_metadata?.full_name || settings.userDisplayName || '';
      setEditFullName(currentName);
      setIsProfileOpen(true);
    } else {
      setGuest(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) return;
    setIsUpdatingProfile(true);
    try {
      const existingMeta = session?.user?.user_metadata || {};
      const newFullName = editFullName.trim();

      const { data, error } = await supabase.auth.updateUser({
        data: {
          ...existingMeta,
          custom_display_name: newFullName,
          full_name: newFullName
        }
      });
      if (error) throw error;

      // Update settings store so it persists in cloud sync
      updateSettings({ userDisplayName: newFullName });

      // Also upsert to public.profiles table in Supabase DB
      try {
        if (session?.user?.id) {
          await supabase.from('profiles').upsert({
            id: session.user.id,
            full_name: newFullName,
            updated_at: new Date().toISOString()
          });
        }
      } catch (dbErr) {
        console.warn('Could not update profiles table:', dbErr);
      }

      // Update local auth store reactively without reloading the browser
      if (data.user && session) {
        useAuthStore.setState({
          session: { ...session, user: data.user },
          user: data.user
        });
      }

      addToast({ type: 'success', message: t('toast.profile_updated', 'Cập nhật thông tin thành công!') });
      setIsProfileOpen(false);
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

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
    { code: 'vi', name: 'Tiếng Việt', label: 'VN' },
    { code: 'en', name: 'English', label: 'GB' },
    { code: 'es', name: 'Español', label: 'ES' },
    { code: 'pt', name: 'Português', label: 'PT' },
    { code: 'ru', name: 'Русский', label: 'RU' },
    { code: 'ar', name: 'العربية', label: 'SA' }
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
      image: './qr.png',
      isDonate: true,
      paypalUrl: 'https://paypal.me/trevorthanhtung'
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
                  <h3 className={`font-display font-bold uppercase tracking-wider @sm:tracking-widest text-lg @sm:text-xl leading-snug pt-0.5 ${item.isDanger ? 'text-red-600 group-hover:text-red-700' : 'text-primary group-hover:text-secondary'} transition-colors truncate`} title={item.title}>
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
        <h1 className="text-4xl @sm:text-5xl font-display uppercase text-primary leading-normal pt-0.5">{t('more.title', 'THÊM')}</h1>
        <div className="hallmark-divider"></div>
      </header>
      
      {/* Account Section */}
      <div className="mb-8">
        <h2 className="text-sm font-display font-bold text-text-muted uppercase tracking-widest mb-4">
          {t('more.account_section', 'TÀI KHOẢN & XÁC THỰC')}
        </h2>
        <div>
          {/* Account Profile Card */}
          <div 
            onClick={handleOpenProfile}
            className="hallmark-card p-4 flex items-center border-2 border-border-main hover:border-primary transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 border-2 border-primary bg-primary/10 flex items-center justify-center mr-4 shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
              {session?.user?.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={28} className="text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-xl uppercase text-primary truncate">
                  {session?.user?.user_metadata?.custom_display_name || 
                   session?.user?.user_metadata?.full_name || 
                   settings.userDisplayName || 
                   (session ? t('more.member_default', 'Thành viên 5TactiQ') : t('more.guest_title', 'Tài khoản Khách'))}
                </h3>
              </div>
              <p className="text-xs text-text-muted mt-1 truncate">
                {session?.user?.email || t('more.guest_desc', 'Dữ liệu chỉ lưu trên trình duyệt thiết bị này')}
              </p>
              {!session && (
                <button
                  onClick={() => setGuest(false)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-display font-bold uppercase text-secondary hover:underline cursor-pointer"
                >
                  <LogIn size={14} /> {t('more.login_signup_btn', 'Đăng nhập / Tạo tài khoản')}
                </button>
              )}
            </div>
            {session && (
              <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors shrink-0 ml-2" />
            )}
          </div>
        </div>
      </div>
      
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
      
      {/* Logout Card (Only shown when user is logged in with an account) */}
      {session && (
        <div className="mt-2 mb-6">
          <button
            onClick={() => {
              setConfirmInfo({
                title: t('more.logout_confirm_title', 'XÁC NHẬN ĐĂNG XUẤT'),
                message: t('more.logout_confirm_msg', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này không?'),
                onConfirm: async () => {
                  await signOut();
                  addToast({ message: t('more.logout_success', 'Đã đăng xuất tài khoản thành công'), type: 'info' });
                }
              });
            }}
            className="w-full hallmark-card p-4 flex items-center border-2 border-red-500/30 bg-red-500/5 hover:border-red-500 hover:bg-red-500/10 transition-all cursor-pointer group text-left shadow-sm active:scale-[0.99]"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-red-500/40 bg-red-500/10 flex items-center justify-center mr-4 shrink-0 group-hover:border-red-500 transition-colors">
              <LogOut size={24} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg sm:text-xl uppercase text-red-600 group-hover:text-red-700 transition-colors">
                {t('more.logout_btn', 'ĐĂNG XUẤT TÀI KHOẢN')}
              </h3>
            </div>
            <ChevronRight className="text-red-400 group-hover:text-red-600 transition-colors shrink-0 ml-2" />
          </button>
        </div>
      )}
      



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
                  <div className="w-full max-w-[200px] p-2 bg-white rounded-xl border-2 border-border-main shadow-sm overflow-hidden flex justify-center items-center">
                    <img src={alertInfo.image} alt="QR Code" className="w-full h-auto object-contain rounded-lg" />
                  </div>
                </div>
              )}
              <p className="text-text-muted text-sm md:text-base font-sans mb-6 whitespace-pre-line leading-relaxed">{alertInfo?.message}</p>
              
              {alertInfo?.isDonate && alertInfo?.paypalUrl && (
                <a 
                  href={alertInfo.paypalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-display uppercase tracking-wider py-3 px-4 border-2 border-[#005ea6] flex items-center justify-center gap-2 mb-4 transition-colors active:scale-95 text-sm"
                >
                  <Globe size={18} />
                  <span>{t('more.donate_paypal', 'ỦNG HỘ QUA PAYPAL')}</span>
                </a>
              )}
            </>
          )}
          <button 
            onClick={() => setAlertInfo(null)}
            className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95"
          >
            {t('more.understood', 'ĐÃ HIỂU')}
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
              className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-slate-300 hover:bg-surface transition-colors active:scale-95 cursor-pointer"
            >
              {t('more.cancel', 'HỦY')}
            </button>
            <button 
              onClick={() => {
                confirmInfo?.onConfirm();
                setConfirmInfo(null);
              }}
              disabled={confirmInfo?.requireInput ? confirmInput !== confirmInfo.requireInput : false}
              className="flex-1 bg-rose-600 text-white font-display uppercase tracking-wider py-3 border-2 border-rose-700 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 cursor-pointer"
            >
              {t('more.confirm', 'XÁC NHẬN')}
            </button>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <Globe size={24} className="text-primary" /> {t('more.language', 'Ngôn ngữ')}
          </span>
        }
      >
        <div className="flex flex-col gap-3 p-1">
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
              className={`flex items-center justify-between p-4 border-2 transition-all cursor-pointer active:scale-95 ${i18n.language === lang.code ? 'border-primary bg-primary/5 text-primary shadow-[4px_4px_0px_0px_var(--color-primary)]' : 'border-border-main text-text-muted hover:border-primary/50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold px-2 py-0.5 border border-border-main bg-surface-2">{lang.label}</span>
                <span className="font-display font-bold uppercase tracking-wider">{lang.name}</span>
              </div>
              {i18n.language === lang.code && <ShieldCheck size={20} className="text-primary" />}
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

      {/* Profile Edit Modal */}
      <BottomSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <UserIcon size={24} className="text-primary" /> {t('more.profile_title', 'Hồ sơ tài khoản')}
          </span>
        }
      >
        <div className="flex flex-col gap-4 p-1">
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                {t('auth.fullname_label', 'Họ và tên')}
              </label>
              <input
                type="text"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-4 py-3 bg-surface-2 border-2 border-border-main text-text-main focus:outline-none focus:border-primary transition-colors text-sm font-medium"
                placeholder={t('auth.fullname_placeholder', 'Nhập họ và tên...')}
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1 uppercase font-display tracking-widest">
                {t('auth.email_label', 'Email')}
              </label>
              <input
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-surface-2 opacity-70 border-2 border-border-main text-text-muted cursor-not-allowed text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="hallmark-btn w-full flex items-center justify-center py-3.5 mt-2 bg-secondary text-white font-display uppercase tracking-widest transition-all shadow-md gap-2 cursor-pointer"
            >
              {isUpdatingProfile ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><Save size={18} /> {t('common.save_changes', 'LƯU THAY ĐỔI')}</>
              )}
            </button>
          </form>

          <div className="hallmark-divider my-1"></div>

          {/* Cloud Sync Status Card */}
          <div className="bg-surface-2 border-2 border-border-main p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold uppercase tracking-wider text-sm text-primary">
                {t('sync.cloud_sync_title', 'Đồng bộ Đám mây')}
              </h4>
              <span 
                className={`w-3 h-3 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}
                title={isOnline ? t('sync.online', 'Trực tuyến') : t('sync.offline', 'Ngoại tuyến')}
              ></span>
            </div>

            <div className="flex flex-col gap-1 text-xs font-sans text-text-muted">
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-main">{t('sync.status_label', 'Trạng thái:')}</span>
                {syncStatus === 'syncing' && (
                  <span className="text-secondary font-semibold">
                    {t('sync.syncing', 'Đang đồng bộ dữ liệu...')}
                  </span>
                )}
                {syncStatus === 'synced' && (
                  <span className="text-emerald-600 font-semibold">
                    {t('sync.synced', 'Đã đồng bộ mới nhất')}
                  </span>
                )}
                {syncStatus === 'pending' && (
                  <span className="text-amber-600 font-semibold">
                    {t('sync.pending', 'Sẵn sàng đồng bộ')}
                  </span>
                )}
                {syncStatus === 'offline' && (
                  <span className="text-text-muted font-semibold">
                    {t('sync.offline_desc', 'Chế độ ngoại tuyến (Lưu tại máy)')}
                  </span>
                )}
                {syncStatus === 'error' && (
                  <span className="text-rose-600 font-semibold">
                    {t('sync.error', 'Thất bại - Thử lại')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bold text-text-main">{t('sync.last_synced', 'Đồng bộ lần cuối:')}</span>
                <span>
                  {lastSyncedAt
                    ? new Date(lastSyncedAt).toLocaleString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })
                    : t('sync.never_synced', 'Chưa đồng bộ')}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => syncNow(true)}
              disabled={syncStatus === 'syncing' || !isOnline}
              className="hallmark-btn w-full flex items-center justify-center py-2.5 bg-primary text-white font-display text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.99] transition-all gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{syncStatus === 'syncing' ? t('sync.syncing_btn', 'ĐANG ĐỒNG BỘ...') : t('sync.sync_now_btn', 'ĐỒNG BỘ NGAY')}</span>
            </button>
          </div>

          {/* Danger Zone Section inside Profile Modal */}
          <div className="mt-4 pt-3 border-t border-border-main">
            <h4 className="font-display font-bold uppercase tracking-widest text-xs text-red-500 mb-3">
              {t('more.danger_zone', 'VÙNG NGUY HIỂM')}
            </h4>
            <div 
              onClick={() => {
                setIsProfileOpen(false);
                setConfirmInput('');
                setConfirmInfo({
                  title: t('more.reset_alert_title', 'CẢNH BÁO NGUY HIỂM'),
                  message: t('more.reset_alert_msg', { teamName, defaultValue: `Hành động này sẽ xóa TOÀN BỘ dữ liệu đội bóng, cầu thủ và trận đấu của bạn.\nKhông thể khôi phục lại.\n\nVui lòng nhập đúng tên đội bóng "${teamName}" để xác nhận:` }),
                  requireInput: teamName,
                  onConfirm: async () => {
                    localStorage.clear();
                    try {
                      const { Preferences } = await import('@capacitor/preferences');
                      await Preferences.clear();
                    } catch (e) {}
                    addToast({ message: t('toast.all_data_cleared', 'Đã xóa toàn bộ dữ liệu ứng dụng'), type: 'info' });
                    setTimeout(() => window.location.reload(), 500);
                  }
                });
              }}
              className="bg-red-500/5 border-2 border-red-500/40 hover:border-red-600 p-3.5 flex items-center justify-between gap-3 transition-all cursor-pointer group shadow-sm"
            >
              <div className="w-10 h-10 border-2 border-red-500/50 bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-display font-bold text-base text-red-600 uppercase tracking-wide">
                  {t('more.reset_title', 'KHÔI PHỤC CÀI ĐẶT GỐC')}
                </h5>
                <p className="text-xs text-text-muted font-sans truncate mt-0.5">
                  {t('more.reset_desc', 'Xóa vĩnh viễn toàn bộ dữ liệu')}
                </p>
              </div>
              <div className="w-8 h-8 border-2 border-red-500/40 flex items-center justify-center shrink-0 text-red-500 group-hover:border-red-600 group-hover:translate-x-0.5 transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

