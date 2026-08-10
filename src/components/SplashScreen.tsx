import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Thử phát âm thanh (có thể bị chặn nếu browser yêu cầu tương tác trước)
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext && !prefersReducedMotion) {
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        // 1. Âm thanh lướt (Swoosh) khi các lát cắt (slices) bay vào
        const swooshOsc = ctx.createOscillator();
        const swooshGain = ctx.createGain();
        swooshOsc.type = 'triangle';
        swooshOsc.frequency.setValueAtTime(150, now + 0.2);
        swooshOsc.frequency.exponentialRampToValueAtTime(800, now + 0.6);
        swooshGain.gain.setValueAtTime(0, now + 0.2);
        swooshGain.gain.linearRampToValueAtTime(0.05, now + 0.4);
        swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        swooshOsc.connect(swooshGain);
        swooshGain.connect(ctx.destination);
        swooshOsc.start(now + 0.2);
        swooshOsc.stop(now + 0.6);

        // 2. Tiếng nổ trầm (Bass impact) khi vòng lan toả (pulse ring) xuất hiện
        const boomOsc = ctx.createOscillator();
        const boomGain = ctx.createGain();
        boomOsc.type = 'sine';
        boomOsc.frequency.setValueAtTime(120, now + 0.55);
        boomOsc.frequency.exponentialRampToValueAtTime(30, now + 0.9);
        boomGain.gain.setValueAtTime(0, now + 0.55);
        boomGain.gain.linearRampToValueAtTime(0.2, now + 0.58);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        boomOsc.connect(boomGain);
        boomGain.connect(ctx.destination);
        boomOsc.start(now + 0.55);
        boomOsc.stop(now + 1.2);

        // 3. Tiếng "Ping" công nghệ cao (Tech Chime) khi logo ổn định và dải sáng lướt qua
        const pingOsc = ctx.createOscillator();
        const pingGain = ctx.createGain();
        pingOsc.type = 'sine';
        pingOsc.frequency.setValueAtTime(1200, now + 0.95);
        pingOsc.frequency.exponentialRampToValueAtTime(2400, now + 1.05);
        pingGain.gain.setValueAtTime(0, now + 0.95);
        pingGain.gain.linearRampToValueAtTime(0.1, now + 0.98);
        pingGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        pingOsc.connect(pingGain);
        pingGain.connect(ctx.destination);
        pingOsc.start(now + 0.95);
        pingOsc.stop(now + 1.8);
      }
    } catch (e) {
      console.warn('Audio autoplay blocked by browser', e);
    }

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
          src="./splash.png" 
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

      {/* Tactical Pitch & Diagram Background Overlay */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full z-[1]"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0, animation: 'grid-fade 1.2s ease forwards 0.1s' }}
      >
        <defs>
          <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(32,38,27,0.05)" strokeWidth="1" />
          </pattern>
          <marker id="arrowOrange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#e35d2a" opacity="0.75" />
          </marker>
          <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#15803d" opacity="0.75" />
          </marker>
        </defs>

        {/* Grid pattern fill */}
        <rect width="1000" height="600" fill="url(#tacticalGrid)" />

        {/* Outer Court Boundary Lines */}
        <rect x="50" y="40" width="900" height="520" fill="none" stroke="rgba(32,38,27,0.1)" strokeWidth="2" strokeDasharray="8 4" />

        {/* Center Half-Court Line */}
        <line x1="500" y1="40" x2="500" y2="560" stroke="rgba(32,38,27,0.12)" strokeWidth="2" />

        {/* Center Circle (Surrounding Logo) */}
        <circle cx="500" cy="300" r="140" fill="none" stroke="rgba(227,93,42,0.18)" strokeWidth="2" />
        <circle cx="500" cy="300" r="220" fill="none" stroke="rgba(32,38,27,0.08)" strokeWidth="1.5" strokeDasharray="6 6" />

        {/* Left Goal Area & Penalty Arc */}
        <path d="M 50 160 A 140 140 0 0 1 190 300 A 140 140 0 0 1 50 440" fill="none" stroke="rgba(32,38,27,0.08)" strokeWidth="2" />
        <rect x="50" y="220" width="50" height="160" fill="none" stroke="rgba(32,38,27,0.06)" strokeWidth="1.5" />

        {/* Right Goal Area & Penalty Arc */}
        <path d="M 950 160 A 140 140 0 0 0 810 300 A 140 140 0 0 0 950 440" fill="none" stroke="rgba(32,38,27,0.08)" strokeWidth="2" />
        <rect x="900" y="220" width="50" height="160" fill="none" stroke="rgba(32,38,27,0.06)" strokeWidth="1.5" />

        {/* Tactical Movement Arrows & Passes */}
        <path
          d="M 260 420 Q 370 440 440 370"
          fill="none"
          stroke="#e35d2a"
          strokeWidth="2"
          strokeDasharray="6 6"
          opacity="0.6"
          markerEnd="url(#arrowOrange)"
        />
        <path
          d="M 740 180 Q 630 160 560 230"
          fill="none"
          stroke="#15803d"
          strokeWidth="2"
          strokeDasharray="6 6"
          opacity="0.6"
          markerEnd="url(#arrowGreen)"
        />
        <path
          d="M 300 160 Q 500 90 700 160"
          fill="none"
          stroke="#e35d2a"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.45"
          markerEnd="url(#arrowOrange)"
        />

        {/* Tactical Player Dots */}
        <g className="animate-drift-1">
          <circle cx="260" cy="420" r="8" fill="#e35d2a" />
          <circle cx="260" cy="420" r="13" fill="none" stroke="#e35d2a" strokeWidth="1.5" opacity="0.4" />
        </g>
        <g className="animate-drift-2">
          <circle cx="340" cy="200" r="8" fill="#e35d2a" />
          <circle cx="340" cy="200" r="13" fill="none" stroke="#e35d2a" strokeWidth="1.5" opacity="0.4" />
        </g>
        <g className="animate-drift-3">
          <circle cx="740" cy="180" r="8" fill="#15803d" />
          <circle cx="740" cy="180" r="13" fill="none" stroke="#15803d" strokeWidth="1.5" opacity="0.4" />
        </g>
        <g className="animate-drift-1">
          <circle cx="660" cy="400" r="8" fill="#15803d" />
          <circle cx="660" cy="400" r="13" fill="none" stroke="#15803d" strokeWidth="1.5" opacity="0.4" />
        </g>
      </svg>

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
              <img src="./splash.png" alt="Logo Slice" />
            </div>
          ))}
        </div>
        
        {/* Sheen sweep layer */}
        <div className="sheen"></div>
        
      </div>
    </div>
  );
}
