import { useState, useEffect } from 'react';

export function useVirtualKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const handleResize = () => {
      // Calculate the difference between the full window innerHeight and the visual viewport
      const heightDiff = window.innerHeight - visualViewport.height;
      setKeyboardHeight(Math.max(0, heightDiff));
    };

    visualViewport.addEventListener('resize', handleResize);
    visualViewport.addEventListener('scroll', handleResize);
    
    // Initial check
    handleResize();
    
    return () => {
      visualViewport.removeEventListener('resize', handleResize);
      visualViewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return keyboardHeight;
}
