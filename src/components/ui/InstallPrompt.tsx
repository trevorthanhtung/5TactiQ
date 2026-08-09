import React, { useState, useEffect } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { X, Download, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function InstallPrompt() {
  const { t } = useTranslation();
  const { isInstallable, isIOS, promptInstall } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [isAndroidWeb, setIsAndroidWeb] = useState(false);

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      const isNative = Capacitor.isNativePlatform();
      const isAndroid = !isNative && /android/i.test(navigator.userAgent || '');
      setIsAndroidWeb(isAndroid);
      const isHidden = localStorage.getItem('hideInstallPrompt') === 'true';

      if (isHidden || isNative) {
        setIsVisible(false);
        return;
      }

      if (isAndroid || isInstallable) {
        // Delay showing the prompt by a few seconds to not be too aggressive
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(false);
      }
    });
  }, [isInstallable]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-[100px] left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-surface border-2 border-border-main p-4 shadow-[8px_8px_0px_0px_var(--color-primary)] z-[6000] flex gap-4 items-start"
      >
        <div className="w-12 h-12 shrink-0 bg-primary/10 border-2 border-border-main flex items-center justify-center p-2">
          <img src="/splash.png" alt="5TactiQ Logo" className="w-full h-full object-contain" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-display font-bold text-primary uppercase text-sm mb-1">{t('install_prompt.title')}</h4>
          
          {isIOS ? (
            <>
              <p className="text-xs text-text-muted mb-3 font-sans">
                {t('install_prompt.desc_ios_1')} <br/>
                <span className="font-bold text-primary">{t('install_prompt.desc_ios_2')}</span>
              </p>
            </>
          ) : isAndroidWeb ? (
            <>
              <p className="text-xs text-text-muted mb-3 font-sans">
                Tải bản App chính thức (APK) để có trải nghiệm mượt mà, kết nối P2P siêu tốc và chơi không cần mạng!
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    window.open('https://github.com/trevorthanhtung/5TactiQ/raw/main/releases/5TactiQ.apk', '_blank');
                    setIsVisible(false);
                    localStorage.setItem('hideInstallPrompt', 'true');
                  }}
                  className="flex-1 hallmark-btn bg-primary text-white py-2 text-xs flex items-center justify-center gap-1"
                >
                  <Download size={14} /> TẢI APP NGAY
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-text-muted mb-3 font-sans">{t('install_prompt.desc_android')}</p>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    const accepted = await promptInstall();
                    if (accepted) {
                      setIsVisible(false);
                      localStorage.setItem('hideInstallPrompt', 'true');
                    }
                  }}
                  className="flex-1 hallmark-btn bg-primary text-white py-2 text-xs flex items-center justify-center gap-1"
                >
                  <Download size={14} /> {t('install_prompt.add_now')}
                </button>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={() => {
            setIsVisible(false);
            localStorage.setItem('hideInstallPrompt', 'true');
          }}
          className="absolute -top-3 -right-3 w-8 h-8 bg-surface border-2 border-primary text-primary flex items-center justify-center hover:bg-secondary hover:text-white transition-colors active:scale-95"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
