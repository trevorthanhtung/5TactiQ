import React from 'react';

export function FitnessSkeleton() {
  return (
    <div className="p-4 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 @sm:gap-3 mb-6 pt-2">
        <div className="w-10 h-10 bg-text-muted/25 rounded shrink-0"></div>
        <div className="h-10 w-64 bg-text-muted/25 rounded"></div>
      </div>
      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Search Bar Skeleton */}
      <div className="mb-6 h-[44px] max-w-md bg-text-muted/15 border-2 border-border-main rounded"></div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="hallmark-card p-4 bg-surface flex items-center justify-between border-2 border-border-main">
            <div>
              <div className="h-5 w-40 bg-text-muted/25 rounded mb-2"></div>
              <div className="h-3 w-24 bg-text-muted/15 rounded"></div>
            </div>
            <div className="h-6 w-20 bg-text-muted/20 rounded shrink-0"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
