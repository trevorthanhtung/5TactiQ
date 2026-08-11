import React, { useState, useEffect } from 'react';
import { Volume2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    let played = false;

    const playSound = async (isUserAction = false) => {
      if (played || prefersReducedMotion) return;
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();
        
        // Tránh spam console warning nếu trình duyệt chặn autoplay
        if (ctx.state === 'suspended') {
          // Chỉ cố gắng resume() nếu đây là do người dùng tương tác
          // Gọi resume() lúc trang tự load sẽ bị Chrome phạt cảnh báo vàng khè
          if (isUserAction) {
            try {
              await ctx.resume();
            } catch (e) {
              // Ignore
            }
          } else {
            // Đang tự động load mà bị chặn -> im lặng rút lui
            return;
          }
        }
        
        // Nếu vẫn không được phép chạy (bị trình duyệt chặn hoàn toàn), thoát sớm
        if (ctx.state !== 'running') {
          return;
        }

        const now = ctx.currentTime;

        // Master Gain Output (Âm lượng vừa phải 0.5)
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.5, now);
        masterGain.connect(ctx.destination);

        // 1. HOLLYWOOD CINEMATIC TRAILER BOOM (Cú nổ trầm u mịt)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(110, now);
        subOsc.frequency.exponentialRampToValueAtTime(20, now + 1.1);

        subGain.gain.setValueAtTime(0, now);
        subGain.gain.linearRampToValueAtTime(0.45, now + 0.05);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        subOsc.connect(subGain);
        subGain.connect(masterGain);
        subOsc.start(now);
        subOsc.stop(now + 1.2);

        // 2. NOISE IMPACT THUD (Tiếng va đập không khí)
        const bufferSize = Math.floor(ctx.sampleRate * 0.35);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1400, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(50, now + 0.35);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.2, now + 0.03);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);
        whiteNoise.start(now);

        // 3. LUXURY AMBIENT PAD CHORD (Hợp âm Dm9 sang trọng kiểu PlayStation)
        const chordNotes = [146.83, 220.00, 349.23, 523.25, 659.25];
        chordNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const padFilter = ctx.createBiquadFilter();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + 0.05);

          padFilter.type = 'lowpass';
          padFilter.frequency.setValueAtTime(500, now + 0.05);
          padFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.8);

          const delay = idx * 0.02;
          gain.gain.setValueAtTime(0, now + 0.05 + delay);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.4 + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + delay);

          osc.connect(padFilter);
          padFilter.connect(gain);
          gain.connect(masterGain);
          osc.start(now + 0.05 + delay);
          osc.stop(now + 1.5 + delay);
        });

        // 4. SLEEK METALLIC HUD SNAP (Cú snap kim loại mỏng)
        const snapOsc = ctx.createOscillator();
        const snapGain = ctx.createGain();
        snapOsc.type = 'triangle';
        snapOsc.frequency.setValueAtTime(1400, now + 0.4);
        snapOsc.frequency.exponentialRampToValueAtTime(2200, now + 0.5);

        snapGain.gain.setValueAtTime(0, now + 0.4);
        snapGain.gain.linearRampToValueAtTime(0.08, now + 0.42);
        snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        snapOsc.connect(snapGain);
        snapGain.connect(masterGain);
        snapOsc.start(now + 0.4);
        snapOsc.stop(now + 0.65);

        played = true;
      } catch (e) {
        console.warn('Audio play error', e);
      }
    };

    // Thử phát ngay lập tức khi vừa load trang
    playSound(false);

    // Sự kiện mở khóa tự động nếu trình duyệt hoãn lại nhè nhẹ
    const handleUnlock = () => {
      playSound(true);
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
      window.removeEventListener('click', handleUnlock);
    };

    window.addEventListener('pointerdown', handleUnlock);
    window.addEventListener('touchstart', handleUnlock);
    window.addEventListener('click', handleUnlock);

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
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('touchstart', handleUnlock);
      window.removeEventListener('click', handleUnlock);
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [onComplete, prefersReducedMotion]);

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

      {/* Desktop / Landscape Tactical Pitch Background (Hidden on Mobile) */}
      <svg
        className="hidden md:block pointer-events-none absolute inset-0 w-full h-full z-[1]"
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

        {/* Outer Pitch Boundary */}
        <rect x="70" y="40" width="860" height="520" fill="rgba(32,38,27,0.02)" stroke="rgba(32,38,27,0.25)" strokeWidth="3" strokeDasharray="10 5" rx="10" />

        {/* Center Half-Court Line */}
        <line x1="500" y1="40" x2="500" y2="560" stroke="rgba(32,38,27,0.3)" strokeWidth="3" />

        {/* Center Circle & Center Spot */}
        <circle cx="500" cy="300" r="120" fill="none" stroke="rgba(227,93,42,0.35)" strokeWidth="3" />
        <circle cx="500" cy="300" r="200" fill="none" stroke="rgba(32,38,27,0.15)" strokeWidth="2" strokeDasharray="6 6" />

        {/* === LEFT SIDE === */}
        {/* Goal Net (behind goal line) */}
        <rect x="48" y="258" width="22" height="84" fill="none" stroke="rgba(32,38,27,0.22)" strokeWidth="1.5" rx="2" />
        {/* Futsal D-shaped Penalty Area: two quarter-circle arcs (r=150) from goalposts + connecting line */}
        <path
          d="M 70,150 A 150,150 0 0,1 220,258 L 220,342 A 150,150 0 0,1 70,450"
          fill="none" stroke="rgba(32,38,27,0.22)" strokeWidth="2.5"
        />
        {/* 1st Penalty Spot (6m) */}
        <circle cx="220" cy="300" r="3.5" fill="rgba(32,38,27,0.35)" />
        {/* 2nd Penalty Spot (10m) */}
        <circle cx="330" cy="300" r="3" fill="rgba(32,38,27,0.25)" />

        {/* === RIGHT SIDE === */}
        {/* Goal Net (behind goal line) */}
        <rect x="930" y="258" width="22" height="84" fill="none" stroke="rgba(32,38,27,0.22)" strokeWidth="1.5" rx="2" />
        {/* Futsal D-shaped Penalty Area */}
        <path
          d="M 930,150 A 150,150 0 0,0 780,258 L 780,342 A 150,150 0 0,0 930,450"
          fill="none" stroke="rgba(32,38,27,0.22)" strokeWidth="2.5"
        />
        {/* 1st Penalty Spot (6m) */}
        <circle cx="780" cy="300" r="3.5" fill="rgba(32,38,27,0.35)" />
        {/* 2nd Penalty Spot (10m) */}
        <circle cx="670" cy="300" r="3" fill="rgba(32,38,27,0.25)" />

        {/* Corner Arcs (tiny quarter circles) */}
        <path d="M 70,52 A 12,12 0 0,1 82,40" fill="none" stroke="rgba(32,38,27,0.18)" strokeWidth="1.5" />
        <path d="M 70,548 A 12,12 0 0,0 82,560" fill="none" stroke="rgba(32,38,27,0.18)" strokeWidth="1.5" />
        <path d="M 930,52 A 12,12 0 0,0 918,40" fill="none" stroke="rgba(32,38,27,0.18)" strokeWidth="1.5" />
        <path d="M 930,548 A 12,12 0 0,1 918,560" fill="none" stroke="rgba(32,38,27,0.18)" strokeWidth="1.5" />

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

      {/* Mobile / Portrait Vertical Tactical Pitch Background (Visible on Mobile) */}
      <svg
        className="block md:hidden pointer-events-none absolute inset-0 w-full h-full z-[1]"
        viewBox="0 0 600 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0, animation: 'grid-fade 1.2s ease forwards 0.1s' }}
      >
        <defs>
          <pattern id="tacticalGridMob" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(32,38,27,0.05)" strokeWidth="1" />
          </pattern>
          <marker id="arrowOrangeMob" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#e35d2a" opacity="0.75" />
          </marker>
          <marker id="arrowGreenMob" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#15803d" opacity="0.75" />
          </marker>
        </defs>

        {/* Grid pattern fill */}
        <rect width="600" height="1000" fill="url(#tacticalGridMob)" />

        {/* Outer Pitch Boundary */}
        <rect x="40" y="70" width="520" height="860" fill="rgba(32,38,27,0.02)" stroke="rgba(32,38,27,0.25)" strokeWidth="3" strokeDasharray="10 5" rx="10" />

        {/* Center Half-Court Line */}
        <line x1="40" y1="500" x2="560" y2="500" stroke="rgba(32,38,27,0.3)" strokeWidth="3" />

        {/* Center Circle & Center Spot */}
        <circle cx="300" cy="500" r="120" fill="none" stroke="rgba(227,93,42,0.35)" strokeWidth="3" />
        <circle cx="300" cy="500" r="200" fill="none" stroke="rgba(32,38,27,0.15)" strokeWidth="2" strokeDasharray="6 6" />

        {/* === TOP SIDE === */}
        {/* Goal Net (behind goal line) */}
        <rect x="258" y="48" width="84" height="22" fill="none" stroke="rgba(32,38,27,0.22)" strokeWidth="1.5" rx="2" />
        {/* Futsal D-shaped Penalty Area: two quarter-circle arcs (r=150) from goalposts + connecting line */}
        <path
          d="M 150,70 A 150,150 0 0,0 258,220 L 342,220 A 150,150 0 0,0 450,70"
          fill="none" stroke="rgba(32,38,27,0.22)" strokeWidth="2.5"
        />
        {/* 1st Penalty Spot (6m) */}
        <circle cx="300" cy="220" r="3.5" fill="rgba(32,38,27,0.35)" />
        {/* 2nd Penalty Spot (10m) */}
        <circle cx="300" cy="330" r="3" fill="rgba(32,38,27,0.25)" />

        {/* === BOTTOM SIDE === */}
        {/* Goal Net (behind goal line) */}
        <rect x="258" y="930" width="84" height="22" fill="none" stroke="rgba(32,38,27,0.22)" strokeWidth="1.5" rx="2" />
        {/* Futsal D-shaped Penalty Area */}
        <path
          d="M 150,930 A 150,150 0 0,1 258,780 L 342,780 A 150,150 0 0,1 450,930"
          fill="none" stroke="rgba(32,38,27,0.22)" strokeWidth="2.5"
        />
        {/* 1st Penalty Spot (6m) */}
        <circle cx="300" cy="780" r="3.5" fill="rgba(32,38,27,0.35)" />
        {/* 2nd Penalty Spot (10m) */}
        <circle cx="300" cy="670" r="3" fill="rgba(32,38,27,0.25)" />

        {/* Corner Arcs (tiny quarter circles) */}
        <path d="M 40,82 A 12,12 0 0,0 52,70" fill="none" stroke="rgba(32,38,27,0.18)" strokeWidth="1.5" />
        <path d="M 548,70 A 12,12 0 0,0 560,82" fill="none" stroke="rgba(32,38,27,0.18)" strokeWidth="1.5" />
        <path d="M 40,918 A 12,12 0 0,1 52,930" fill="none" stroke="rgba(32,38,27,0.18)" strokeWidth="1.5" />
        <path d="M 548,930 A 12,12 0 0,1 560,918" fill="none" stroke="rgba(32,38,27,0.18)" strokeWidth="1.5" />

        {/* Tactical Movement Arrows & Passes (Vertical) */}
        <path
          d="M 420 260 Q 440 370 370 440"
          fill="none"
          stroke="#e35d2a"
          strokeWidth="2"
          strokeDasharray="6 6"
          opacity="0.6"
          markerEnd="url(#arrowOrangeMob)"
        />
        <path
          d="M 180 740 Q 160 630 230 560"
          fill="none"
          stroke="#15803d"
          strokeWidth="2"
          strokeDasharray="6 6"
          opacity="0.6"
          markerEnd="url(#arrowGreenMob)"
        />
        <path
          d="M 160 300 Q 90 500 160 700"
          fill="none"
          stroke="#e35d2a"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.45"
          markerEnd="url(#arrowOrangeMob)"
        />

        {/* Tactical Player Dots */}
        <g className="animate-drift-1">
          <circle cx="420" cy="260" r="8" fill="#e35d2a" />
          <circle cx="420" cy="260" r="13" fill="none" stroke="#e35d2a" strokeWidth="1.5" opacity="0.4" />
        </g>
        <g className="animate-drift-2">
          <circle cx="200" cy="340" r="8" fill="#e35d2a" />
          <circle cx="200" cy="340" r="13" fill="none" stroke="#e35d2a" strokeWidth="1.5" opacity="0.4" />
        </g>
        <g className="animate-drift-3">
          <circle cx="180" cy="740" r="8" fill="#15803d" />
          <circle cx="180" cy="740" r="13" fill="none" stroke="#15803d" strokeWidth="1.5" opacity="0.4" />
        </g>
        <g className="animate-drift-1">
          <circle cx="400" cy="660" r="8" fill="#15803d" />
          <circle cx="400" cy="660" r="13" fill="none" stroke="#15803d" strokeWidth="1.5" opacity="0.4" />
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
