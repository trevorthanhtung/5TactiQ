import React, { useState, useEffect } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { X, Download, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function InstallPrompt() {
  const { t } = useTranslation();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      // Hide if already running as a native app (Capacitor or Electron)
      const isNative = Capacitor.isNativePlatform() || navigator.userAgent.toLowerCase().includes('electron');
      const isHidden = localStorage.getItem('hideInstallPrompt') === 'true';

      if (isHidden || isNative) {
        setIsVisible(false);
        return;
      }

      // Detect Platform
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/i.test(ua)) {
        setPlatform('ios');
      } else if (/Mac/i.test(ua)) {
        setPlatform('mac');
      } else if (/Android/i.test(ua)) {
        setPlatform('android');
      } else if (/Win/i.test(ua)) {
        setPlatform('windows');
      } else if (/Linux/i.test(ua)) {
        setPlatform('linux');
      } else {
        setPlatform('pwa');
      }

      // Delay showing the prompt
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    });
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('hideInstallPrompt', 'true');
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
    handleDismiss();
  };

  if (!isVisible) return null;

  const renderContent = () => {
    if (platform === 'ios' || platform === 'mac') {
      return (
        <>
          <p className="text-xs text-text-muted mb-3 font-sans">
            {platform === 'ios' ? t('install_prompt.desc_ios_1') : "Mở menu trình duyệt (Safari/Chrome)"} <br/>
            <span className="font-bold text-primary">
              {platform === 'ios' ? t('install_prompt.desc_ios_2') : "Chọn 'Add to Dock' hoặc 'Install App' để cài đặt"}
            </span>
          </p>
        </>
      );
    }

    if (platform === 'android') {
      return (
        <>
          <p className="text-xs text-text-muted mb-3 font-sans">
            Tải bản App chính thức (APK) để có trải nghiệm cực mượt và đầy đủ tính năng nhất!
          </p>
          <button 
            onClick={() => handleDownload('https://github.com/trevorthanhtung/5TactiQ/raw/main/releases/5TactiQ.apk')}
            className="w-full hallmark-btn bg-primary text-white py-2 text-xs flex items-center justify-center gap-1"
          >
            <Download size={14} /> TẢI APK NGAY
          </button>
        </>
      );
    }

    if (platform === 'windows') {
      return (
        <>
          <p className="text-xs text-text-muted mb-3 font-sans">
            Tải phần mềm cài đặt (.exe) độc lập dành riêng cho Windows. Tận hưởng hiệu năng tối đa!
          </p>
          <button 
            onClick={() => handleDownload('https://github.com/trevorthanhtung/5TactiQ/raw/main/releases/5TactiQ-Setup.exe')}
            className="w-full hallmark-btn bg-primary text-white py-2 text-xs flex items-center justify-center gap-1"
          >
            <Download size={14} /> TẢI BẢN WINDOWS (.EXE)
          </button>
        </>
      );
    }

    if (platform === 'linux') {
      return (
        <>
          <p className="text-xs text-text-muted mb-3 font-sans">
            Tải phần mềm độc lập (.AppImage) dành riêng cho Linux. Tải về chạy luôn không cần cài đặt!
          </p>
          <button 
            onClick={() => handleDownload('https://github.com/trevorthanhtung/5TactiQ/raw/main/releases/5TactiQ.AppImage')}
            className="w-full hallmark-btn bg-primary text-white py-2 text-xs flex items-center justify-center gap-1"
          >
            <Download size={14} /> TẢI BẢN LINUX
          </button>
        </>
    );
    }

    // Default / Web Fallback (PWA)
    return (
      <>
        <p className="text-xs text-text-muted mb-3 font-sans">{t('install_prompt.desc_android')}</p>
        <button 
          onClick={async () => {
            const accepted = await promptInstall();
            if (accepted) handleDismiss();
          }}
          className="w-full hallmark-btn bg-primary text-white py-2 text-xs flex items-center justify-center gap-1"
        >
          <Download size={14} /> {t('install_prompt.add_now')}
        </button>
      </>
    );
  };

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
          {renderContent()}
        </div>

        <button 
          onClick={handleDismiss}
          className="absolute -top-3 -right-3 w-8 h-8 bg-surface border-2 border-primary text-primary flex items-center justify-center hover:bg-secondary hover:text-white transition-colors active:scale-95"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
