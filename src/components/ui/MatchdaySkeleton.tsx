import React from 'react';

export function MatchdaySkeleton() {
  return (
    <div className="p-4 max-w-5xl mx-auto pb-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-end gap-4 mb-6 pt-2">
        <div>
          <div className="h-10 @sm:h-12 w-48 bg-text-muted/25 rounded mb-2"></div>
          <div className="h-4 w-32 bg-text-muted/15 rounded mt-2"></div>
        </div>
        <div className="flex flex-col @md:flex-row items-stretch @md:items-center gap-3 shrink-0">
          <div className="h-[44px] w-full @md:w-[160px] bg-text-muted/20 rounded"></div>
          <div className="h-[44px] w-full @md:w-[160px] bg-text-muted/20 rounded"></div>
        </div>
      </div>
      <div className="hallmark-divider mt-0 opacity-30"></div>

      {/* Search Bar Skeleton */}
      <div className="mb-6 relative max-w-md h-[44px] bg-text-muted/15 border-2 border-border-main rounded"></div>

      {/* Section Skeleton */}
      <div className="mb-8">
        <div className="h-5 w-32 bg-text-muted/20 rounded mb-4"></div>
        <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hallmark-card p-0 overflow-hidden bg-surface border-2 border-border-main flex flex-col h-[190px]">
              {/* Card Top Accent */}
              <div className="h-1.5 bg-text-muted/20" />

              <div className="p-4 flex flex-col h-full justify-between">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-16 bg-text-muted/20 rounded"></div>
                  <div className="h-4 w-20 bg-text-muted/15 rounded"></div>
                </div>

                <div className="h-6 w-3/4 bg-text-muted/20 rounded mt-3"></div>

                <div className="h-12 w-full bg-text-muted/15 rounded mt-3"></div>

                <div className="mt-3 space-y-2">
                  <div className="h-3 w-40 bg-text-muted/15 rounded"></div>
                  <div className="h-3 w-32 bg-text-muted/10 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
