import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToastStore } from '../../store/useToastStore';
import { useTranslation } from 'react-i18next';

export default function AppStatusNotifier() {
  const { t } = useTranslation();
  const { addToast, removeToast } = useToastStore();
  
  // 1. Service Worker Updates
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error: unknown) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      addToast({
        type: 'info',
        message: t('toast.update_available'),
        duration: 0, // Không tự tắt
        action: {
          label: t('toast.update_action'),
          onClick: () => updateServiceWorker(true)
        }
      });
    }
  }, [needRefresh, addToast, updateServiceWorker]);

  // 2. Network Status
  useEffect(() => {
    const handleOffline = () => {
      addToast({
        type: 'error',
        message: t('toast.offline'),
        duration: 0, // Không tự tắt cho đến khi có mạng lại
      });
    };

    const handleOnline = () => {
      // Clear offline toasts and show online success
      const state = useToastStore.getState();
      state.toasts.forEach(tToast => {
        if (tToast.type === 'error' && (tToast.message === t('toast.offline') || tToast.message.includes('ngoại tuyến'))) {
          removeToast(tToast.id);
        }
      });
      
      addToast({
        type: 'success',
        message: t('toast.online'),
        duration: 3000
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [addToast, removeToast]);

  return null; // Component này chỉ chạy logic ngầm
}
