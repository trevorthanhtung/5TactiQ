import React from 'react';
import { motion } from 'framer-motion';

export const SuspenseLoader: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center bg-accent/10 min-h-[50vh]">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
      >
        <span className="text-white font-display font-bold text-lg leading-none mt-1">5T</span>
      </motion.div>
    </div>
  );
};
