import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import { AnimatedRoutes } from './components/AnimatedRoutes';
import InstallPrompt from './components/ui/InstallPrompt';
import ToastContainer from './components/ui/ToastContainer';
import AppStatusNotifier from './components/ui/AppStatusNotifier';
import InAppBrowserWarning from './components/ui/InAppBrowserWarning';
import { useVirtualKeyboard } from './hooks/useVirtualKeyboard';
import { usePageVisibility } from './hooks/usePageVisibility';
import { usePersistentStorage } from './hooks/usePersistentStorage';
import { useBackgroundSync } from './hooks/useBackgroundSync';
import { useThemeStore } from './store/useThemeStore';

function App() {
  usePersistentStorage();
  useBackgroundSync();

  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    const updateThemeMeta = (isDark: boolean) => {
      const themeColor = isDark ? '#121212' : '#f6f4ed';
      
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', themeColor);

      let metaStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!metaStatusBar) {
        metaStatusBar = document.createElement('meta');
        metaStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(metaStatusBar);
      }
      metaStatusBar.setAttribute('content', isDark ? 'black' : 'default');
    };

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const isDark = systemTheme === 'dark';
      root.classList.add(systemTheme);
      updateThemeMeta(isDark);
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (useThemeStore.getState().theme === 'system') {
          root.classList.remove('light', 'dark');
          const isDarkNow = e.matches;
          root.classList.add(isDarkNow ? 'dark' : 'light');
          updateThemeMeta(isDarkNow);
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      const isDark = theme === 'dark';
      root.classList.add(theme);
      updateThemeMeta(isDark);
    }
  }, [theme]);

  const keyboardHeight = useVirtualKeyboard();
  const isVisible = usePageVisibility((visible) => {
    if (visible) {
      // Tự động đồng bộ/làm mới dữ liệu khi App quay lại foreground (Optimistic UI / Background Sync)
      console.log('App foregrounded - Optimistic Data Sync Triggered');
    }
  });

  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Determine which screens to show
    const hasOnboarded = localStorage.getItem('katfc_onboarded');
    const hasPromptedInstall = localStorage.getItem('katfc_install_prompted');
    
    if (!hasOnboarded) {
      setShowOnboarding(true);
    } else if (!hasPromptedInstall) {
      setShowInstallPrompt(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('katfc_onboarded', 'true');
    setShowOnboarding(false);
    
    // Check if we need to show install prompt after onboarding
    const hasPromptedInstall = localStorage.getItem('katfc_install_prompted');
    if (!hasPromptedInstall) {
      setShowInstallPrompt(true);
    }
  };

  const handleInstallComplete = () => {
    localStorage.setItem('katfc_install_prompted', 'true');
    setShowInstallPrompt(false);
  };

  return (
    <div style={{ paddingBottom: `max(env(safe-area-inset-bottom), ${keyboardHeight}px)`, paddingTop: 'env(safe-area-inset-top)' }} className="w-full h-[100dvh] relative overflow-hidden transition-all duration-300 bg-background text-text-main">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {/* App Content */}
      <BrowserRouter>
        <InAppBrowserWarning />
        <AppStatusNotifier />
        <ToastContainer />
        <AnimatedRoutes />
        <InstallPrompt />
      </BrowserRouter>
    </div>
  );
}

export default App;
