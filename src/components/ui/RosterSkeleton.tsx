import React from 'react';

export function RosterSkeleton() {
  return (
    <div className="p-4 max-w-5xl mx-auto pb-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-6 pt-2">
        <div className="h-10 w-40 bg-text-muted/25 rounded"></div>
        <div className="flex items-center gap-2 @sm:gap-4">
          <div className="h-10 w-10 @xl:w-28 bg-text-muted/20 rounded"></div>
          <div className="h-10 w-10 @xl:w-36 bg-text-muted/20 rounded"></div>
        </div>
      </div>
      <div className="hallmark-divider mt-0 opacity-30"></div>

      {/* Search & Filters Skeleton */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="h-[44px] w-full bg-text-muted/15 border-2 border-border-main rounded"></div>
        <div className="flex items-center gap-2 overflow-x-hidden shrink-0 py-1">
          <div className="h-8 w-20 bg-text-muted/20 rounded"></div>
          <div className="h-8 w-28 bg-text-muted/15 rounded"></div>
          <div className="h-8 w-24 bg-text-muted/15 rounded"></div>
          <div className="h-8 w-20 bg-text-muted/15 rounded"></div>
        </div>
      </div>

      {/* Roster Grid Skeleton */}
      <div className="grid grid-cols-1 @xs:grid-cols-2 @md:grid-cols-3 @xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="hallmark-card p-0 relative overflow-hidden bg-surface border-2 border-border-main h-[120px] flex flex-col justify-between">
            {/* Jersey Number Box Placeholder */}
            <div className="absolute top-0 left-0 bg-text-muted/20 w-10 h-10 border-b-2 border-r-2 border-border-main"></div>

            {/* Card Body Placeholder */}
            <div className="p-4 pt-12 flex-1 flex flex-col justify-between">
              <div className="h-5 w-3/4 bg-text-muted/20 rounded"></div>
              <div className="flex gap-1 flex-wrap mt-auto pt-2">
                <div className="h-4 w-12 bg-text-muted/15 rounded"></div>
                <div className="h-4 w-14 bg-text-muted/15 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
