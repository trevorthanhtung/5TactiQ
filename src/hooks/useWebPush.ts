import { useState, useEffect } from 'react';
import { useToastStore } from '../store/useToastStore';
import { useTranslation } from 'react-i18next';

export function useWebPush() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if the browser supports notifications
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      useToastStore.getState().addToast({
        type: 'warning',
        message: t('toast.push_not_supported')
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        // Here we would normally register a service worker for push and subscribe to a server
        // const registration = await navigator.serviceWorker.ready;
        // const subscription = await registration.pushManager.subscribe({ ... });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const showLocalNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, options);
    }
  };

  return { permission, isSupported, requestPermission, showLocalNotification };
}
