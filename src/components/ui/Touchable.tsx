import React, { useRef, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { hapticImpact } from '../../utils/haptics';

interface TouchableProps extends Omit<HTMLMotionProps<"div">, "onClick" | "onPointerDown" | "onPointerUp" | "onPointerCancel" | "onPointerLeave"> {
  children: ReactNode;
  onClick?: (e?: React.MouseEvent) => void;
  onLongPress?: () => void;
  className?: string;
  disabled?: boolean;
  activeScale?: number;
  activeOpacity?: number;
}

export const Touchable: React.FC<TouchableProps> = ({
  children,
  onClick,
  onLongPress,
  className = '',
  disabled = false,
  activeScale = 0.95,
  activeOpacity = 0.7,
  ...rest
}) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggered = useRef(false);

  const handlePointerDown = (_e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    isLongPressTriggered.current = false;
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        isLongPressTriggered.current = true;
        hapticImpact('heavy');
        onLongPress();
      }, 500); // 500ms for long press
    }
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (isLongPressTriggered.current) {
      e.preventDefault();
      return; // Ignore click if long press was triggered
    }
    if (onClick) {
      hapticImpact('light');
      onClick(e);
    }
  };

  return (
    <motion.div
      className={`cursor-pointer select-none ${className}`}
      whileTap={disabled ? undefined : { scale: activeScale, opacity: activeOpacity }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
