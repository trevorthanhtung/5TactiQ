import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { hapticImpact } from './utils/haptics'
import './lib/i18n'; // Import i18n configuration
import { CloudSyncProvider } from './hooks/useCloudSync';

// Global Micro-interactions (Ripple + Haptics)
document.addEventListener('pointerdown', (e) => {
  const target = (e.target as HTMLElement).closest('.hallmark-btn, .hallmark-btn-outline, .ripple-target');
  if (target) {
    // 1. Haptic Feedback
    hapticImpact('light');

    // 2. Ripple Effect
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    
    // Ensure button is positioned relatively for the absolute ripple
    if (getComputedStyle(target).position === 'static') {
      (target as HTMLElement).style.position = 'relative';
    }
    (target as HTMLElement).style.overflow = 'hidden';

    // Calculate dimensions
    const diameter = Math.max(rect.width, rect.height);
    const radius = diameter / 2;

    ripple.style.width = ripple.style.height = `${diameter}px`;
    ripple.style.left = `${e.clientX - rect.left - radius}px`;
    ripple.style.top = `${e.clientY - rect.top - radius}px`;
    ripple.classList.add('ripple');

    // Remove old ripples
    const existingRipple = target.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }

    target.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 400); // 400ms is the duration of our ripple-animation
  }
});

// Chặn kéo-thả ảnh (desktop-like drag)
document.addEventListener('dragstart', (e) => {
  if (e.target && (e.target as HTMLElement).tagName === 'IMG') {
    e.preventDefault();
  }
});

// Chặn double-tap-to-zoom trên một số Android WebView và Safari cũ
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

const logWatermark = () => {
  console.log(
    '%c 5TactiQ %c \n%c thực hiện bởi thanhtungg. ',
    'font-size: 40px; font-weight: 900; color: #F6F3EB; background-color: #3B4E38; padding: 4px 20px; border-radius: 8px; font-family: sans-serif;',
    '',
    'font-size: 14px; color: #3B4E38; font-style: italic; font-weight: bold; padding: 8px 0;'
  );
};

logWatermark();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CloudSyncProvider>
      <App />
    </CloudSyncProvider>
  </StrictMode>,
)
