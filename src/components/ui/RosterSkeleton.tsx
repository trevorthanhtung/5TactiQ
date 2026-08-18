import React from 'react';

export function RosterSkeleton() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col max-w-7xl 2xl:max-w-[1520px] mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-6 pt-2">
        <div className="h-8 sm:h-12 w-36 sm:w-48 bg-text-muted/25 rounded"></div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="h-9 sm:h-10 w-24 sm:w-28 bg-surface border-2 border-border-main rounded"></div>
          <div className="h-9 sm:h-10 w-28 sm:w-36 bg-secondary/30 rounded"></div>
        </div>
      </div>
      <div className="hallmark-divider mt-0 opacity-30"></div>

      {/* Search & Filters Skeleton */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="h-11 w-full bg-surface border-2 border-border-main rounded"></div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <div className="h-8 w-24 bg-primary/25 rounded border-2 border-primary/30 shrink-0"></div>
          <div className="h-8 w-32 bg-surface border-2 border-border-main rounded shrink-0"></div>
          <div className="h-8 w-28 bg-surface border-2 border-border-main rounded shrink-0"></div>
          <div className="h-8 w-24 bg-surface border-2 border-border-main rounded shrink-0"></div>
          <div className="h-8 w-24 bg-surface border-2 border-border-main rounded shrink-0"></div>
          <div className="h-8 w-28 bg-surface border-2 border-border-main rounded shrink-0"></div>
          <div className="h-8 w-20 bg-surface border-2 border-border-main rounded shrink-0"></div>
        </div>
      </div>

      {/* Roster Grid Skeleton (6 columns on 2xl, responsive) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 items-stretch">
        {[
          { nameW: 'w-20', pos1: 'w-8', pos2: 'w-0', hasBadge: false, hasNumber: true },
          { nameW: 'w-36', pos1: 'w-9', pos2: 'w-9', hasBadge: true, hasNumber: true },
          { nameW: 'w-32', pos1: 'w-9', pos2: 'w-9', hasBadge: false, hasNumber: true },
          { nameW: 'w-36', pos1: 'w-9', pos2: 'w-9', hasBadge: false, hasNumber: true },
          { nameW: 'w-28', pos1: 'w-16', pos2: 'w-0', hasBadge: false, hasNumber: false },
          { nameW: 'w-32', pos1: 'w-9', pos2: 'w-9', hasBadge: false, hasNumber: false },
          { nameW: 'w-32', pos1: 'w-9', pos2: 'w-9', hasBadge: false, hasNumber: false },
          { nameW: 'w-30', pos1: 'w-8', pos2: 'w-0', hasBadge: false, hasNumber: false },
          { nameW: 'w-28', pos1: 'w-8', pos2: 'w-0', hasBadge: false, hasNumber: false },
          { nameW: 'w-24', pos1: 'w-16', pos2: 'w-0', hasBadge: false, hasNumber: false },
          { nameW: 'w-36', pos1: 'w-8', pos2: 'w-9', hasBadge: true, hasNumber: false },
          { nameW: 'w-28', pos1: 'w-16', pos2: 'w-0', hasBadge: true, hasNumber: true },
          { nameW: 'w-24', pos1: 'w-16', pos2: 'w-0', hasBadge: true, hasNumber: false },
          { nameW: 'w-28', pos1: 'w-16', pos2: 'w-0', hasBadge: true, hasNumber: false },
          { nameW: 'w-32', pos1: 'w-16', pos2: 'w-0', hasBadge: true, hasNumber: false },
          { nameW: 'w-24', pos1: 'w-16', pos2: 'w-0', hasBadge: true, hasNumber: false },
          { nameW: 'w-36', pos1: 'w-9', pos2: 'w-0', hasBadge: true, hasNumber: false },
          { nameW: 'w-28', pos1: 'w-9', pos2: 'w-9', hasBadge: false, hasNumber: true },
        ].map((item, i) => (
          <div key={i} className="hallmark-card p-0 relative overflow-hidden bg-surface border-2 border-border-main min-h-[145px] sm:min-h-[160px] flex flex-col justify-between">
            {/* Jersey Number Box (Top-Left) */}
            <div className="absolute top-0 left-0 bg-primary/25 min-w-9 h-9 sm:min-w-10 sm:h-10 px-1.5 flex items-center justify-center">
              <div className="h-4 w-3 bg-white/40 rounded-sm"></div>
            </div>

            {/* Top-Right Badge (Optional) */}
            {item.hasBadge && (
              <div className="absolute top-0 right-0 flex z-10">
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-text-muted/20 border-l-2 border-border-main"></div>
              </div>
            )}

            {/* Card Body */}
            <div className="p-3 pt-11 sm:p-4 sm:pt-13 flex-1 flex flex-col justify-between">
              <div className="flex-1 flex flex-col">
                <div className={`h-4 sm:h-5 ${item.nameW} bg-text-muted/25 rounded mb-1.5`}></div>
              </div>
              
              <div className="flex gap-1 flex-wrap mt-auto pt-2 min-h-[26px] items-center">
                <div className={`h-4 ${item.pos1} bg-accent/50 rounded-none`}></div>
                {item.pos2 !== 'w-0' && (
                  <div className={`h-4 ${item.pos2} bg-accent/50 rounded-none`}></div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


