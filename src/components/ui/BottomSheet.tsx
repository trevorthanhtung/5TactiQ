import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { hapticImpact } from '../../utils/haptics';
import { useHardwareBack } from '../../hooks/useHardwareBack';

import { createPortal } from 'react-dom';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  variant?: 'default' | 'danger';
  noScroll?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'fit';
  children: React.ReactNode;
}

const maxWidthClassMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  fit: 'max-w-fit'
};

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, variant = 'default', noScroll = false, maxWidth = 'lg', children }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkIsDesktop = () => {
      // It's a desktop if width >= 768 AND the primary input is a mouse (fine pointer).
      // This ensures phones in landscape (width > 768) still use the mobile BottomSheet.
      const isWideScreen = window.innerWidth >= 768;
      const isMouse = window.matchMedia('(pointer: fine)').matches;
      setIsDesktop(isWideScreen && isMouse);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Bắt sự kiện phím Back cứng trên điện thoại
  useHardwareBack(isOpen, onClose);

  // Prevent scrolling on body when bottom sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      hapticImpact('light');
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 backdrop-blur-sm z-[100] ${isDesktop ? (variant === 'danger' ? 'bg-red-900/40' : 'bg-primary/40') : 'bg-black/40'}`}
            onClick={onClose}
          />
          
          {/* Sheet or Modal Container */}
          <div 
            className={`fixed inset-0 z-[101] ${isDesktop ? 'flex justify-center items-center p-4' : 'pointer-events-none'}`}
            onClick={(e) => {
              if (isDesktop && e.target === e.currentTarget) {
                onClose();
              }
            }}
          >
          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.95, y: 0, x: 0 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0, x: 0 } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95, y: 0, x: 0 } : { y: '100%' }}
            transition={isDesktop ? { duration: 0.2 } : { type: 'spring', damping: 25, stiffness: 300 }}
            drag={isDesktop ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => {
              if (isDesktop) return;
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
                hapticImpact('medium');
              }
            }}
            className={`pointer-events-auto flex flex-col overflow-hidden ${
              isDesktop
                ? `relative w-full ${maxWidthClassMap[maxWidth as keyof typeof maxWidthClassMap]} bg-surface border-2 p-6 max-h-[90vh] ${
                    variant === 'danger' 
                      ? 'border-red-500/20 shadow-[8px_8px_0px_0px_#ef4444]' 
                      : 'border-border-main shadow-[8px_8px_0px_0px_var(--color-primary)]'
                  }`
                : "absolute bottom-0 left-0 right-0 max-h-[90vh] bg-surface rounded-t-2xl shadow-2xl"
            }`}
          >
            {/* Drag Handle (Mobile only) */}
            {!isDesktop && (
              <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none shrink-0" onClick={onClose}>
                <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
              </div>
            )}

            {/* Header */}
            <div className={`flex justify-between items-center shrink-0 ${isDesktop ? `mb-6 border-b-2 pb-2 ${variant === 'danger' ? 'border-red-500/10' : 'border-primary/10'}` : 'px-4 pb-3 border-b border-border-main'}`}>
              <h3 className={`font-display font-bold uppercase tracking-wide flex items-center gap-2 ${isDesktop ? (variant === 'danger' ? 'text-xl text-red-600' : 'text-xl text-primary') : 'text-lg text-text-main'}`}>
                {title}
              </h3>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className={`p-1 transition-colors active:scale-95 ${isDesktop ? (variant === 'danger' ? 'text-red-600 hover:text-red-700' : 'text-primary hover:text-secondary') : 'rounded-full bg-surface text-text-muted hover:bg-surface-2'}`}
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className={`${noScroll ? 'flex flex-col flex-1' : 'overflow-y-auto hide-scrollbar overscroll-contain'} min-h-0 ${isDesktop ? 'pr-2' : 'p-4'}`}>
              {children}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
