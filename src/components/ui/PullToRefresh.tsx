import React, { useState } from 'react';
import { motion, useAnimation, type PanInfo } from 'framer-motion';
import { hapticImpact, hapticSuccess } from '../../utils/haptics';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 80;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const controls = useAnimation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleDrag = (_event: any, info: PanInfo) => {
    if (isRefreshing) return;
    if (info.offset.y > 0 && window.scrollY <= 0) {
      if (info.offset.y >= PULL_THRESHOLD) {
        hapticImpact('light');
      }
    }
  };

  const handleDragEnd = async (_event: any, info: PanInfo) => {
    if (isRefreshing) return;
    
    if (info.offset.y >= PULL_THRESHOLD && window.scrollY <= 0) {
      hapticImpact('heavy');
      setIsRefreshing(true);
      await controls.start({ y: 50, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      
      await onRefresh();
      
      hapticSuccess();
      setIsRefreshing(false);
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    } else {
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center items-center h-16 -mt-16 text-primary"
        animate={{ opacity: isRefreshing ? 1 : 0.5 }}
      >
        {isRefreshing ? (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : (
          <div className="text-sm font-display uppercase tracking-widest text-slate-400">Kéo xuống để làm mới</div>
        )}
      </motion.div>
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="w-full h-full touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};
