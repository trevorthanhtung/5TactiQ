import React, { useState, useEffect } from 'react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { X, Download, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function InstallPrompt() {
  const { t } = useTranslation();
  const { isInstallable, isIOS, promptInstall } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isInstallable) {
      // Delay showing the prompt by a few seconds to not be too aggressive
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
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
          ) : (
            <>
              <p className="text-xs text-text-muted mb-3 font-sans">{t('install_prompt.desc_android')}</p>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    const accepted = await promptInstall();
                    if (accepted) setIsVisible(false);
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
          onClick={() => setIsVisible(false)}
          className="absolute -top-3 -right-3 w-8 h-8 bg-surface border-2 border-primary text-primary flex items-center justify-center hover:bg-secondary hover:text-white transition-colors active:scale-95"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
