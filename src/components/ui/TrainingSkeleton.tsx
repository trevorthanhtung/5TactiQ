import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function TrainingSkeleton() {
  return (
    <div className="p-4 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6 pt-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 border-2 border-border-main shrink-0 text-text-muted/30">
            <ArrowLeft size={20} />
          </div>
          <div>
            <div className="h-8 sm:h-10 w-48 bg-text-muted/25 rounded mb-1"></div>
            <div className="h-3.5 w-36 bg-text-muted/15 rounded"></div>
          </div>
        </div>
        <div className="h-9 w-28 bg-secondary/25 rounded"></div>
      </div>

      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Sessions Grid Skeleton */}
      <div className="space-y-6">
        <div>
          <div className="h-4 w-32 bg-primary/25 rounded mb-3"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="hallmark-card p-0 overflow-hidden border-2 border-border-main bg-surface flex flex-col justify-between min-h-[160px]">
                <div className="h-1.5 bg-primary/40" />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-16 bg-text-muted/20 rounded"></div>
                    <div className="h-3.5 w-24 bg-text-muted/15 rounded"></div>
                  </div>
                  <div className="h-5 w-40 bg-text-muted/25 rounded"></div>
                  <div className="h-3.5 w-48 bg-text-muted/15 rounded"></div>
                </div>
                <div className="bg-surface-2 p-2.5 border-t border-border-main flex justify-between items-center">
                  <div className="h-3.5 w-20 bg-text-muted/20 rounded"></div>
                  <div className="h-4 w-12 bg-primary/30 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
