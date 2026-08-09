import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function useInstallPrompt() {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Detect standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      ('standalone' in window.navigator && (window.navigator as any).standalone === true);
      
    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      setIsInstallable(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Xóa listener nếu app đã cài đặt
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setInstallPromptEvent(null);
      console.log('PWA was installed');
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPromptEvent) return false;

    // Show the prompt
    installPromptEvent.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await installPromptEvent.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
      return true;
    }
    
    return false;
  };

  return { isInstallable, isIOS, promptInstall };
}
