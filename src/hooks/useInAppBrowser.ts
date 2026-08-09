import { useState, useEffect } from 'react';

export function useInAppBrowser() {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Pattern to match common in-app browsers
    // FB (Facebook), Instagram, Line, TikTok, Zalo, Messenger, etc.
    const rules = [
      'FBAN', 'FBAV', 'Instagram', 'Line', 'TikTok', 'Zalo', 'Messenger',
      'Bytedance', 'WebView', 'WV'
    ];

    const isMatch = rules.some(rule => userAgent.indexOf(rule) > -1);
    
    // Also check if standalone (if standalone, it's installed, so it's not a restricted in-app browser)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone === true);

    setIsInApp(isMatch && !isStandalone);
  }, []);

  return isInApp;
}
