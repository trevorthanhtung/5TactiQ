import React, { type ReactNode, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Global cache for scroll positions
const scrollPositions = new Map<string, number>();

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: '20vw', // Slide in from right (like native push)
    scale: 0.98,
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    x: '-20vw', // Slide out to left
    scale: 0.98,
  },
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.8,
};

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '', style }) => {
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollRef.current) {
      const savedPosition = scrollPositions.get(location.pathname) || 0;
      scrollRef.current.scrollTop = savedPosition;
    }
  }, [location.pathname]);

  // Save scroll position on scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollPositions.set(location.pathname, e.currentTarget.scrollTop);
  };

  return (
    <motion.div
      ref={scrollRef}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`w-full h-full ${className}`}
      style={style}
      onScroll={handleScroll}
    >
      {children}
    </motion.div>
  );
};
