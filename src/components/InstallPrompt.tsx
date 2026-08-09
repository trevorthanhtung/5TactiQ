import React, { useState, useEffect } from 'react';
import { Download, MonitorSmartphone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface InstallPromptProps {
  onComplete: () => void;
}

const InstallPrompt: React.FC<InstallPromptProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [legalDoc, setLegalDoc] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Ngăn Chrome hiển thị prompt mặc định
      e.preventDefault();
      // Lưu lại event để kích hoạt sau
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Hiển thị prompt cài đặt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
      onComplete(); // Cho phép vào app ngay sau khi có kết quả
    } else {
      // Show custom UI box instead of native alert
      setShowInstructions(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[4000] flex flex-col items-center justify-center bg-background p-4 sm:p-6 transition-opacity duration-500 overflow-y-auto">
      <div className="flex flex-col items-center text-center animate-fade-in-up w-full max-w-md bg-surface border-2 border-border-main p-6 md:p-10 relative my-auto">
        
        {/* Icon Container - Match Onboarding Style */}
        <div className="mb-8 p-6 bg-primary/5 border-2 border-primary/10">
          <MonitorSmartphone className="w-16 h-16 md:w-20 md:h-20 text-primary" strokeWidth={1.5} />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-display font-bold text-primary mb-4 uppercase tracking-wide">
          {t('install_prompt.full_title')}
        </h1>
        
        <p className="text-text-muted text-sm md:text-base leading-relaxed font-sans px-2 mb-10">
          {t('install_prompt.full_desc')}
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-display uppercase tracking-wider text-base md:text-lg px-6 py-4 rounded-none border-2 border-primary hover:bg-[#323d29] transition-all active:scale-95"
          >
            <Download className="w-5 h-5" />
            {t('install_prompt.install_now')}
          </button>
          
          <button 
            onClick={onComplete}
            className="w-full text-text-muted font-sans text-sm font-medium hover:text-primary transition-colors py-2"
          >
            {t('install_prompt.continue_web')}
          </button>
        </div>

        {/* Legal Text */}
        <p className="text-text-muted text-xs md:text-sm text-center mt-8 leading-relaxed font-sans px-2">
          {t('install_prompt.legal_pre')}<button onClick={(e) => { e.preventDefault(); setLegalDoc(t('install_prompt.legal_tos')); }} className="underline font-medium hover:text-primary transition-colors">{t('install_prompt.legal_tos')}</button>{t('install_prompt.legal_and')}<button onClick={(e) => { e.preventDefault(); setLegalDoc(t('install_prompt.legal_privacy')); }} className="underline font-medium hover:text-primary transition-colors">{t('install_prompt.legal_privacy')}</button>{t('install_prompt.legal_and2')}<button onClick={(e) => { e.preventDefault(); setLegalDoc(t('install_prompt.legal_cookie')); }} className="underline font-medium hover:text-primary transition-colors">{t('install_prompt.legal_cookie')}</button>{t('install_prompt.legal_post')}
        </p>

      </div>

      {/* Legal Doc Modal */}
      {legalDoc && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-surface border-2 border-border-main p-6 w-full max-w-md shadow-[8px_8px_0px_0px_var(--color-primary)] relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center shrink-0 mb-6 border-b-2 border-primary/10 pb-2">
              <h2 className="text-xl font-display font-bold text-primary uppercase">{legalDoc}</h2>
              <button 
                onClick={() => setLegalDoc(null)}
                className="text-primary hover:text-secondary transition-colors active:scale-95"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 text-sm text-text-muted font-sans mb-6 custom-scrollbar text-left flex-1">
              {legalDoc === t('install_prompt.legal_tos') && (
                <>
                  <p className="mb-3"><strong>{t('install_prompt.tos_content.p1_title')}</strong>{t('install_prompt.tos_content.p1_desc')}</p>
                  <p className="mb-3"><strong>{t('install_prompt.tos_content.p2_title')}</strong>{t('install_prompt.tos_content.p2_desc')}</p>
                  <p className="mb-3"><strong>{t('install_prompt.tos_content.p3_title')}</strong>{t('install_prompt.tos_content.p3_desc')}</p>
                  <p><strong>{t('install_prompt.tos_content.p4_title')}</strong>{t('install_prompt.tos_content.p4_desc')}</p>
                </>
              )}
              {legalDoc === t('install_prompt.legal_privacy') && (
                <>
                  <p className="mb-3"><strong>{t('install_prompt.privacy_content.p1_title')}</strong>{t('install_prompt.privacy_content.p1_desc')}</p>
                  <p className="mb-3"><strong>{t('install_prompt.privacy_content.p2_title')}</strong>{t('install_prompt.privacy_content.p2_desc')}</p>
                  <p className="mb-3"><strong>{t('install_prompt.privacy_content.p3_title')}</strong>{t('install_prompt.privacy_content.p3_desc')}</p>
                  <p><strong>{t('install_prompt.privacy_content.p4_title')}</strong>{t('install_prompt.privacy_content.p4_desc')}</p>
                </>
              )}
              {legalDoc === t('install_prompt.legal_cookie') && (
                <>
                  <p className="mb-3"><strong>{t('install_prompt.cookie_content.p1_title')}</strong>{t('install_prompt.cookie_content.p1_desc')}</p>
                  <p className="mb-3"><strong>{t('install_prompt.cookie_content.p2_title')}</strong>{t('install_prompt.cookie_content.p2_desc')}</p>
                  <p><strong>{t('install_prompt.cookie_content.p3_title')}</strong>{t('install_prompt.cookie_content.p3_desc')}</p>
                </>
              )}
            </div>
            
            <button 
              onClick={() => setLegalDoc(null)}
              className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95 mt-auto"
            >
              {t('install_prompt.got_it')}
            </button>
          </div>
        </div>
      )}

      {/* Custom Instructions Modal for iOS / unsupported browsers */}
      {showInstructions && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-surface border-2 border-border-main p-6 w-full max-w-md shadow-[8px_8px_0px_0px_var(--color-primary)] relative flex flex-col items-center">
            <button 
              onClick={() => setShowInstructions(false)}
              className="absolute top-3 right-3 text-primary hover:text-secondary transition-colors active:scale-95"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-4 p-3 bg-secondary/10 border-2 border-secondary/20">
              <MonitorSmartphone className="w-8 h-8 text-secondary" strokeWidth={1.5} />
            </div>
            
            <h2 className="text-xl font-display font-bold text-primary mb-3 uppercase text-center">{t('install_prompt.instructions_title')}</h2>
            
            <p className="text-text-main text-sm mb-6 leading-relaxed text-center font-sans">
              {t('install_prompt.instructions_desc_1')}<strong className="text-primary font-bold">{t('install_prompt.instructions_desc_2')}</strong>{t('install_prompt.instructions_desc_3')}<strong className="text-primary font-bold">{t('install_prompt.instructions_desc_4')}</strong>
            </p>
            
            <button 
              onClick={() => {
                setShowInstructions(false);
              }}
              className="w-full bg-primary text-white font-display uppercase tracking-wider py-3 border-2 border-primary hover:bg-[#323d29] transition-colors active:scale-95"
            >
              {t('install_prompt.understood')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
