import React from 'react';

export function VenuesSkeleton() {
  return (
    <div className="p-4 max-w-5xl mx-auto pb-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-text-muted/25 rounded shrink-0"></div>
          <div className="h-10 w-48 bg-text-muted/25 rounded"></div>
        </div>
        <div className="h-10 w-32 bg-text-muted/20 rounded"></div>
      </div>
      <div className="hallmark-divider mt-0 opacity-30"></div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 @md:grid-cols-2 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="hallmark-card p-5 bg-surface border-2 border-border-main flex flex-col justify-between h-[140px]">
            <div>
              <div className="h-6 w-3/4 bg-text-muted/25 rounded mb-3"></div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 bg-text-muted/20 rounded-full shrink-0"></div>
                <div className="h-3 w-full bg-text-muted/15 rounded"></div>
              </div>
            </div>
            <div className="h-8 w-40 bg-text-muted/20 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
