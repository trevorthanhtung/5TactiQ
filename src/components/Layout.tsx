import { useOutlet, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { PageWrapper } from './ui/PageWrapper';
import { Home, Users, LayoutDashboard, Calendar, Menu, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/useSettingsStore';
import { useMatchStore } from '../store/useMatchStore';
import { useCloudSync } from '../hooks/useCloudSync';

export default function Layout() {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const outlet = useOutlet();
  const location = useLocation();
  const navigate = useNavigate();
  const { syncNow, syncStatus } = useCloudSync();

  
  const navItems = [
    { to: '/', icon: <Home size={24} />, label: t('nav.home', 'Trang chủ') },
    { to: '/roster', icon: <Users size={24} />, label: t('nav.roster', 'Đội hình') },
    { to: '/tactics', icon: <LayoutDashboard size={24} />, label: t('nav.tactics', 'Sa bàn') },
    { to: '/matchday', icon: <Calendar size={24} />, label: t('nav.match', 'Trận đấu') },
    { to: '/more', icon: <Menu size={24} />, label: t('nav.more', 'Thêm') },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = parseInt(e.key);
      if (key >= 1 && key <= navItems.length) {
        const item = navItems[key - 1];
        if (item.to === '/matchday') {
          useMatchStore.getState().selectMatch('');
        }
        navigate(item.to);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    const updateAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    updateAppHeight();
    window.addEventListener('resize', updateAppHeight);
    window.addEventListener('orientationchange', updateAppHeight);
    return () => {
      window.removeEventListener('resize', updateAppHeight);
      window.removeEventListener('orientationchange', updateAppHeight);
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-screen h-[100dvh] min-h-[100dvh] bg-surface overflow-hidden font-sans" style={{ height: 'var(--app-height, 100dvh)' }}>
      
      {/* Side Rail for lg+ screens (Tablet, Fold Inside) */}
      <nav className="hidden lg:flex flex-col w-24 bg-surface border-r-2 border-border-main shrink-0 z-40" style={{ paddingTop: 'var(--safe-top)' }}>
        <div className="p-4 flex justify-center border-b-2 border-border-main" title={settings.teamName || '5TactiQ'}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl.startsWith('/') ? '.' + settings.logoUrl : settings.logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
          ) : (
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
               <span className="font-display font-bold text-xl text-white">{settings.teamName ? settings.teamName.substring(0, 2).toUpperCase() : '5T'}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col flex-1 py-4 gap-2">
          {navItems.map((item, index) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              onClick={() => {
                if (item.to === '/matchday') {
                  useMatchStore.getState().selectMatch('');
                }
              }}
              className={({ isActive }) => `relative flex flex-col items-center py-4 transition-colors border-l-4 ${isActive ? 'border-secondary text-primary bg-primary/5' : 'border-transparent text-text-muted hover:bg-surface-2 hover:text-text-main'}`}
            >
              {item.icon}
              <span className="text-[10px] font-bold uppercase mt-2 font-display tracking-widest ml-[0.1em]">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Main Content Area - Uses Container Queries */}
      <main id="main-content" className="flex-1 overflow-hidden lg:pb-0 @container bg-accent/30 relative">
        <AnimatePresence mode="wait">
          <PageWrapper key={location.pathname} className="absolute inset-0 overflow-y-auto pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0" style={{ paddingTop: 'var(--safe-top)' }}>
            {outlet}
          </PageWrapper>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation for < lg screens (Phones, small tablets) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-surface border-t-2 border-border-main flex flex-col z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex justify-around items-center h-16 px-1 w-full relative">
          {navItems.map((item) => {
            const isTactics = item.to === '/tactics';
            return (
              <NavLink 
                key={item.to}
                to={item.to} 
                onClick={() => {
                  if (item.to === '/matchday') {
                    useMatchStore.getState().selectMatch('');
                  }
                }}
                className={({ isActive }) => {
                  if (isTactics) {
                    return `relative flex flex-col items-center justify-center w-14 h-14 rounded-full border-4 border-[#f8f8f6] shadow-lg -translate-y-5 transition-transform hover:scale-105 active:scale-95 z-50 shrink-0 bg-primary text-white ${isActive ? 'shadow-[0_0_15px_rgba(71,92,68,0.5)]' : 'animate-pulse-ring'}`;
                  }
                  return `flex flex-col items-center justify-center h-full transition-colors flex-1 py-1 ${isActive ? 'text-primary' : 'text-text-muted'}`;
                }}
              >
                {item.icon}
                {!isTactics && (
                  <span className="text-[10px] font-bold uppercase mt-1 font-display tracking-widest hidden min-[360px]:block ml-[0.1em] whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
