import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Bắt đầu fade out sau 2.1s (khi animation gần xong)
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2100);

    // Unmount hoàn toàn và gọi onComplete sau 2.5s
    const unmountTimer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete]);

  if (!isVisible) return null;

  // Fallback cho chế độ giảm chuyển động
  if (prefersReducedMotion) {
    return (
      <div 
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}
      >
        <img 
          src="/splash.png" 
          alt="5TactiQ Splash" 
          className="w-48 md:w-64 h-auto object-contain"
        />
      </div>
    );
  }

  const STRIPE_COUNT = 12;

  return (
    <div 
      className={`fixed inset-0 z-[9999] splash-root transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <style>{`
        .splash-root {
          --bg: #f6f4ed;
          --accent-primary: #20261b;
          --accent-secondary: #46543b;
          --accent-orange: #e35d2a;
          background: radial-gradient(ellipse at 50% 45%, #ffffff 0%, var(--bg) 70%);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* 5. Nền lưới grid tạo chiều sâu */
        .grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(32,38,27,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(32,38,27,.08) 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0;
          animation: grid-fade 1.2s ease forwards;
          animation-delay: 0.1s;
        }
        @keyframes grid-fade { to { opacity: 1; } }

        /* 4a. Vòng lan toả pulse-ring */
        .pulse-ring {
          position: absolute;
          width: 260px; height: 260px;
          border-radius: 50%;
          border: 2px solid var(--accent-orange);
          opacity: 0;
          animation: pulse-ring 1.1s ease-out forwards;
          animation-delay: 0.55s;
        }
        @keyframes pulse-ring {
          0%   { opacity: 0.8; transform: scale(0.4); }
          100% { opacity: 0; transform: scale(1.6); }
        }

        /* Khối chứa logo */
        .logo-wrap {
          position: relative;
          width: 200px;
          height: 200px;
          z-index: 2;
          /* 4c. Settle bounce */
          animation: settle-bounce 0.5s ease-out forwards;
          animation-delay: 0.95s;
        }
        @media (min-width: 768px) {
          .logo-wrap { width: 260px; height: 260px; }
        }
        @keyframes settle-bounce {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.045); }
          100% { transform: scale(1); }
        }

        /* 2. Lớp Glitch CMYK split (hoặc Brand colors) cho nền sáng */
        .chroma {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          mix-blend-mode: multiply; /* Đổi thành multiply vì nền sáng */
          opacity: 0;
          animation: chroma-in 0.55s cubic-bezier(0.3, 0.9, 0.3, 1) forwards;
        }
        .chroma.r { animation-delay: 0s;    --off: -15px; }
        .chroma.g { animation-delay: 0.03s; --off: 0px; }
        .chroma.b { animation-delay: 0.06s; --off: 15px; }
        
        /* Dùng CSS Mask để biến đổi màu của ảnh gốc thành CMYK solid */
        .logo-mask {
          width: 100%; height: 100%;
          -webkit-mask-image: url(/splash.png);
          -webkit-mask-size: contain;
          -webkit-mask-repeat: no-repeat;
          -webkit-mask-position: center;
        }
        .chroma.r .logo-mask { background: #00ffff; } /* Cyan */
        .chroma.g .logo-mask { background: #ff00ff; } /* Magenta */
        .chroma.b .logo-mask { background: #ffff00; } /* Yellow */

        @keyframes chroma-in {
          0%   { opacity: 0.9; transform: translateX(var(--off)) scale(1.15); filter: blur(6px); }
          70%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateX(0) scale(1); filter: blur(0); }
        }

        /* Container của các lát cắt (Slices) */
        .slice-layer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* 1 & 3. Từng lát cắt slice + Motion blur/brightness */
        .slice {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          clip-path: inset(calc(var(--i) * (100% / 12)) 0 calc(100% - (var(--i) + 1) * (100% / 12)) 0);
          transform: translateX(var(--dir, 90px)) scale(1.03);
          animation: slice-in 0.62s cubic-bezier(0.16, 0.9, 0.2, 1) forwards;
          animation-delay: calc(0.28s + var(--i) * 28ms);
          will-change: transform, opacity, filter;
        }
        .slice:nth-child(odd)  { --dir: -90px; }
        .slice:nth-child(even) { --dir: 90px; }
        
        .slice img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        @keyframes slice-in {
          0%   { opacity: 0; transform: translateX(var(--dir)) scale(1.05); filter: brightness(2) blur(4px); }
          60%  { opacity: 1; filter: brightness(1.3) blur(0); }
          100% { opacity: 1; transform: translateX(0) scale(1); filter: brightness(1) blur(0); }
        }

        /* Lóe sáng trên từng lát cắt (Glitch flash) */
        .slice.glitch::after {
          content: "";
          position: absolute;
          inset: 0;
          background: var(--accent-orange);
          mix-blend-mode: multiply; /* Đổi sang multiply cho nền sáng */
          opacity: 0;
          animation: glitch-flash 0.5s steps(3, end) forwards;
          animation-delay: calc(0.28s + var(--i) * 28ms);
        }
        @keyframes glitch-flash {
          0%   { opacity: 0.5; }
          33%  { opacity: 0; }
          55%  { opacity: 0.3; }
          100% { opacity: 0; }
        }

        /* 4b. Dải sáng lướt qua (Sheen sweep) */
        .sheen {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .sheen::after {
          content: "";
          position: absolute;
          top: -20%;
          left: -100%;
          width: 50%;
          height: 140%;
          background: linear-gradient(75deg, transparent, rgba(255,255,255,0.8), transparent);
          transform: skewX(-20deg);
          animation: sheen-sweep 0.9s ease forwards;
          animation-delay: 1.05s;
        }
        @keyframes sheen-sweep {
          to { left: 150%; }
        }
      `}</style>

      {/* Background layer */}
      <div className="grid-bg"></div>
      
      {/* Pulse ring layer */}
      <div className="pulse-ring"></div>
      
      {/* Main logo wrapper */}
      <div className="logo-wrap">
        
        {/* Chroma split layers (RGB) using CSS mask for solid colors */}
        <div className="chroma r"><div className="logo-mask"></div></div>
        <div className="chroma g"><div className="logo-mask"></div></div>
        <div className="chroma b"><div className="logo-mask"></div></div>
        
        {/* Slices layer for "slice reveal" animation */}
        <div className="slice-layer">
          {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
            <div 
              key={i} 
              className={`slice ${i % 3 === 0 ? 'glitch' : ''}`} 
              style={{ '--i': i } as React.CSSProperties}
            >
              <img src="/splash.png" alt="Logo Slice" />
            </div>
          ))}
        </div>
        
        {/* Sheen sweep layer */}
        <div className="sheen"></div>
        
      </div>
    </div>
  );
}
