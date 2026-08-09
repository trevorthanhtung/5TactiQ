import React, { useState, useEffect, useCallback } from 'react';
import { Users, Target, CalendarDays, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
}

// Custom Mini Components for Onboarding Icons
const MiniRoster = () => (
  <div className="w-32 h-32 md:w-40 md:h-40 grid grid-cols-2 grid-rows-2 gap-3 relative drop-shadow-xl">
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }} className="bg-surface rounded-md shadow-sm border-2 border-border-main flex flex-col justify-between p-3">
      <div className="w-8 h-8 bg-slate-200 rounded-full mb-2" />
      <div className="h-3 w-full bg-surface rounded-full" />
    </motion.div>
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 }} className="bg-primary rounded-md shadow-md border-2 border-primary flex flex-col justify-between p-3 relative overflow-hidden">
      <div className="w-8 h-8 bg-surface/20 rounded-full mb-2" />
      <div className="h-3 w-full bg-surface/20 rounded-full" />
      <div className="absolute top-1 right-1 bg-secondary text-white text-[8px] font-bold px-1 rounded-sm">C</div>
    </motion.div>
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className="bg-surface rounded-md shadow-sm border-2 border-border-main flex flex-col justify-between p-3">
      <div className="w-8 h-8 bg-slate-200 rounded-full mb-2" />
      <div className="h-3 w-full bg-surface rounded-full" />
    </motion.div>
    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 }} className="bg-surface rounded-md shadow-sm border-2 border-border-main flex flex-col justify-between p-3 relative overflow-hidden">
      <div className="w-8 h-8 bg-slate-200 rounded-full mb-2" />
      <div className="h-3 w-full bg-surface rounded-full" />
      <div className="absolute top-0 right-0 bg-red-500 w-8 h-8 rotate-45 translate-x-4 -translate-y-4 shadow-sm" />
    </motion.div>
  </div>
);

const MiniPitch = () => (
  <div className="w-32 h-44 md:w-40 md:h-52 bg-[#3b4733] border-4 border-white/80 rounded-sm relative overflow-hidden shadow-2xl flex flex-col justify-between p-4 rotate-3">
    {/* Pitch Lines */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 border-2 border-white/40 rounded-full" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-surface/40" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 md:w-20 md:h-10 border-2 border-t-0 border-white/40" />
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-8 md:w-20 md:h-10 border-2 border-b-0 border-white/40" />
    
    {/* Tactical Dots (Players) */}
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-5 h-5 bg-secondary rounded-full border-2 border-white shadow-lg z-10 flex items-center justify-center text-[8px] text-white font-bold">1</motion.div>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="absolute bottom-16 left-6 md:left-8 w-5 h-5 bg-secondary rounded-full border-2 border-white shadow-lg z-10 flex items-center justify-center text-[8px] text-white font-bold">2</motion.div>
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="absolute bottom-20 right-6 md:right-8 w-5 h-5 bg-secondary rounded-full border-2 border-white shadow-lg z-10 flex items-center justify-center text-[8px] text-white font-bold">3</motion.div>
    
    {/* Drawing Arrow */}
    <motion.svg initial={{ strokeDashoffset: 100 }} animate={{ strokeDashoffset: 0 }} transition={{ delay: 0.8, duration: 0.8 }} className="absolute bottom-16 left-8 w-20 h-20 text-white overflow-visible" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="100">
      <path d="M 0,0 Q 20,-20 40,0" strokeDasharray="4 4" />
      <polygon points="36,-2 44,0 36,2" fill="currentColor" stroke="none" />
    </motion.svg>
  </div>
);

const MiniMatchday = () => {
  const { t } = useTranslation();
  
  return (
    <div className="w-40 h-32 md:w-48 md:h-36 bg-surface rounded-md shadow-2xl border-b-4 border-secondary flex flex-col relative overflow-hidden -rotate-2">
      <div className="bg-secondary text-white text-[10px] md:text-xs font-bold uppercase tracking-wider text-center py-1.5 shadow-sm">
        {t('onboarding.match_today', 'Trận Đấu Hôm Nay')}
      </div>
      <div className="flex-1 flex items-center justify-between px-4 py-2 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-100 font-display text-4xl -z-10">VS</div>
      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-surface rounded-full border-2 border-primary shadow-sm flex items-center justify-center p-1.5">
          <img src="/logo.png" alt="home" className="w-full h-full object-contain" />
        </div>
        <span className="text-[10px] font-bold text-primary whitespace-nowrap">5TACTIQ</span>
      </motion.div>
      
      <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5, type: 'spring' }} className="bg-slate-800 text-white px-2 py-1 rounded text-sm font-display font-bold shadow-inner">
        19:00
      </motion.div>

      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-col items-center gap-1.5">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-800 rounded-full border-2 border-slate-800 shadow-sm flex items-center justify-center">
          <span className="text-white text-xs font-bold font-display">AWAY</span>
        </div>
        <span className="text-[10px] font-bold text-text-main whitespace-nowrap">{t('onboarding.opponent', 'ĐỐI THỦ')}</span>
      </motion.div>
    </div>
  </div>
  );
};

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    };
  }
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useTranslation();
  const [[page, direction], setPage] = useState([0, 0]);

  const ONBOARDING_STEPS = [
    {
      title: t('onboarding.step1_title', "Quản Lý Đội Hình"),
      description: t('onboarding.step1_desc', "Theo dõi, đánh giá và xây dựng đội hình trong mơ của bạn. Quản lý chỉ số và trạng thái của từng cầu thủ dễ dàng."),
      icon: <MiniRoster />,
      bgColor: "bg-background",
      numColor: "text-primary/5",
      textColor: "text-primary",
    },
    {
      title: t('onboarding.step2_title', "Sa Bàn Chiến Thuật"),
      description: t('onboarding.step2_desc', "Sắp xếp sơ đồ, phác thảo các bài phối hợp và chiến thuật đá phạt trực quan ngay trên sa bàn số."),
      icon: <MiniPitch />,
      bgColor: "bg-primary",
      numColor: "text-white/5",
      textColor: "text-white",
    },
    {
      title: t('onboarding.step3_title', "Sẵn Sàng Trận Đấu"),
      description: t('onboarding.step3_desc', "Tổ chức ngày thi đấu chuyên nghiệp. Lên lịch, điểm danh và theo dõi kết quả các trận đấu một cách toàn diện."),
      icon: <MiniMatchday />,
      bgColor: "bg-secondary",
      numColor: "text-white/10",
      textColor: "text-white",
    }
  ];

  const paginate = useCallback((newDirection: number) => {
    if (page + newDirection < 0) return;
    if (page + newDirection >= ONBOARDING_STEPS.length) {
      onComplete();
      return;
    }
    setPage([page + newDirection, newDirection]);
  }, [page, onComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        paginate(1);
      } else if (e.key === 'ArrowLeft') {
        paginate(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate]);

  const step = ONBOARDING_STEPS[page];

  return (
    <div className="fixed inset-0 z-[5000] flex flex-col bg-surface overflow-hidden">
      {/* Top Graphic Section (60%) */}
      <div className={`relative flex-[6] w-full transition-colors duration-500 ease-in-out ${step.bgColor} overflow-hidden flex items-center justify-center`}>
        
        {/* Skip Button */}
        <button 
          onClick={onComplete}
          className={`absolute right-6 z-50 font-display uppercase tracking-widest text-sm font-bold opacity-80 hover:opacity-100 transition-opacity top-[calc(env(safe-area-inset-top,0px)+1.5rem)] ${step.textColor}`}
        >
          {t('onboarding.skip', 'Bỏ qua')}
        </button>

        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute inset-0 flex flex-col items-center justify-center w-full h-full"
          >
            {/* Giant Number Background */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[250px] md:text-[350px] font-display font-bold leading-none select-none ${step.numColor}`}>
              0{page + 1}
            </div>
            
            {/* Pop-up Icon */}
            <motion.div 
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2 
              }}
              className="relative z-10 p-6 md:p-8 bg-surface/10 backdrop-blur-md border-2 border-white/20 rounded-none shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)]"
            >
              {step.icon}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Content Section (40%) */}
      <div className="relative flex-[4] w-full bg-surface border-t-4 border-primary z-20 flex flex-col justify-between px-6 pt-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] md:px-10 md:pt-10 md:pb-[calc(env(safe-area-inset-bottom,0px)+2.5rem)]">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="font-display text-3xl text-slate-300 font-bold">0{page + 1}</span>
              <div className="h-1 flex-1 bg-surface relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((page + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="absolute top-0 left-0 h-full bg-secondary"
                />
              </div>
              <span className="font-display text-sm text-slate-400 font-bold">0{ONBOARDING_STEPS.length}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-display font-bold text-primary mb-3 uppercase leading-none tracking-wide">
              {step.title}
            </h1>
            
            <p className="text-text-muted text-sm md:text-base leading-relaxed font-sans max-w-xl">
              {step.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Action Button */}
        <div className="mt-auto pt-6">
          <button 
            onClick={() => paginate(1)}
            className="w-full hallmark-btn flex items-center justify-center gap-2 bg-primary text-white font-display uppercase tracking-wider text-lg px-6 py-4 shadow-[8px_8px_0px_0px_var(--color-secondary)] hover:shadow-[0px_0px_0px_0px_var(--color-secondary)] hover:translate-x-[8px] hover:translate-y-[8px] transition-all cursor-pointer"
          >
            {page === ONBOARDING_STEPS.length - 1 ? t('onboarding.start_now', 'Bắt Đầu Ngay') : t('onboarding.continue', 'Tiếp Tục')}
            {page < ONBOARDING_STEPS.length - 1 && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
