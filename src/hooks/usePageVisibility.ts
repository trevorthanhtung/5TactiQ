import { useEffect, useState } from 'react';

export function usePageVisibility(onVisibilityChange?: (isVisible: boolean) => void) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      if (onVisibilityChange) {
        onVisibilityChange(visible);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial check
    handleVisibilityChange();
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onVisibilityChange]);

  return isVisible;
}
