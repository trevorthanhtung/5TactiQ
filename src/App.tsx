import { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
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
import { useCloudSync } from './hooks/useCloudSync';
import { useThemeStore } from './store/useThemeStore';
import { useAppUpdateStore } from './store/useAppUpdateStore';
import { useToastStore } from './store/useToastStore';
import { useAuthStore } from './store/useAuthStore';
import { supabase } from './lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { useTranslation } from 'react-i18next';

function App() {
  usePersistentStorage();
  useBackgroundSync();
  useCloudSync();

  const theme = useThemeStore((state) => state.theme);
  const { checkUpdate, hasUpdate, latestVersion, setShowUpdateModal } = useAppUpdateStore();
  const addToast = useToastStore((state) => state.addToast);
  const { t } = useTranslation();

  useEffect(() => {
    // Initialize Auth state
    useAuthStore.getState().initialize();
  }, []);

  // Listen for Deep Link URL open events on Mobile (Capacitor Android APK)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener('appUrlOpen', async (data) => {
      console.log('[Capacitor DeepLink] URL opened:', data.url);
      if (data.url.includes('com.5tactiq.app://') || data.url.includes('access_token=')) {
        const rawUrl = data.url;
        const hashIndex = rawUrl.indexOf('#');
        if (hashIndex !== -1) {
          const hash = rawUrl.substring(hashIndex + 1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error) {
              addToast({
                message: t('auth.success_login', 'Đăng nhập thành công!'),
                type: 'success',
              });
            }
          }
        }
      }
    });

    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, [addToast, t]);

  useEffect(() => {
    // Check for updates on startup
    checkUpdate().then(() => {
      const currentHasUpdate = useAppUpdateStore.getState().hasUpdate;
      const currentLatest = useAppUpdateStore.getState().latestVersion;
      if (currentHasUpdate) {
        addToast({
          type: 'info',
          message: t('app.update_available', `Đã có bản cập nhật mới ({{version}}). Tải ngay để trải nghiệm tính năng mới!`, { version: currentLatest }),
          duration: 0,
          action: {
            label: t('app.update_now', 'CẬP NHẬT NGAY'),
            onClick: () => setShowUpdateModal(true)
          }
        });
      }
    });

    if (Capacitor.isNativePlatform()) {
      let backPressedOnce = false;
      
      const backListener = CapacitorApp.addListener('backButton', () => {
        const currentPath = window.location.hash;
        if (currentPath === '#/' || currentPath === '' || currentPath === '#') {
          if (backPressedOnce) {
            CapacitorApp.exitApp();
          } else {
            backPressedOnce = true;
            useToastStore.getState().addToast({
              message: t('app.exit_prompt', 'Bấm Trở về lần nữa để thoát'),
              type: 'info',
              duration: 2000
            });
            setTimeout(() => {
              backPressedOnce = false;
            }, 2000);
          }
        } else {
          window.history.back();
        }
      });
      
      return () => {
        backListener.then(listener => listener.remove());
      };
    }
  }, [t, checkUpdate, setShowUpdateModal, addToast]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    // Dynamic Safe Area Injection for Android Native
    if (Capacitor.isNativePlatform()) {
      root.style.setProperty('--safe-top', 'max(env(safe-area-inset-top, 0px), 2.5rem)');
    } else {
      root.style.setProperty('--safe-top', 'env(safe-area-inset-top, 0px)');
    }

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
    <div style={{ paddingBottom: `max(env(safe-area-inset-bottom), ${keyboardHeight}px)` }} className="w-full h-[100dvh] relative overflow-hidden transition-all duration-300 bg-background text-text-main">
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      {/* App Content */}
      <HashRouter>
        <InAppBrowserWarning />
        <AppStatusNotifier />
        <ToastContainer />
        <AnimatedRoutes />
        <InstallPrompt />
      </HashRouter>
    </div>
  );
}

export default App;
