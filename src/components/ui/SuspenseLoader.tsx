import React from 'react';

export const SuspenseLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-background z-[999]">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  );
};
