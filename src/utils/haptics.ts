/**
 * Utility for triggering haptic feedback on supported devices.
 */

export const hapticImpact = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    switch (style) {
      case 'light':
        navigator.vibrate(15);
        break;
      case 'medium':
        navigator.vibrate(30);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
    }
  }
};

export const hapticSuccess = () => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([30, 50, 30]); // Pattern for success
  }
};

export const hapticError = () => {
  if (typeof window !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([50, 50, 50, 50, 50]); // Pattern for error
  }
};
