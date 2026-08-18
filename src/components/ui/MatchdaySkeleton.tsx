import React from 'react';

export function MatchdaySkeleton() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col max-w-7xl 2xl:max-w-[1520px] mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 sm:gap-4 mb-6 pb-2 border-b-2 border-border-main">
        <div>
          <div className="h-8 sm:h-12 w-40 sm:w-52 bg-text-muted/25 rounded mb-1"></div>
          <div className="h-3.5 w-28 bg-text-muted/15 rounded"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2 sm:gap-3 shrink-0">
          <div className="h-10 w-full sm:w-44 bg-surface border-2 border-border-main rounded"></div>
          <div className="h-10 w-full sm:w-36 bg-secondary/30 rounded"></div>
        </div>
      </div>

      {/* 📐 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 👈 LEFT COLUMN: Match Lists (8 cols on lg) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Search Filter Skeleton */}
          <div className="h-11 w-full bg-surface border-2 border-border-main rounded"></div>

          {/* Section 1: Upcoming Matches Skeleton */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-28 bg-primary/25 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="hallmark-card p-0 overflow-hidden bg-surface border-2 border-border-main flex flex-col min-h-[175px] justify-between">
                <div className="h-1.5 bg-primary/40" />
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="h-4 w-14 bg-text-muted/20 rounded"></div>
                      <div className="h-4 w-24 bg-text-muted/15 rounded"></div>
                    </div>
                    <div className="h-4 w-16 bg-primary/20 border border-primary/30 rounded"></div>
                  </div>

                  <div className="h-7 w-36 bg-text-muted/25 rounded my-1"></div>

                  <div className="space-y-1.5 text-xs mt-auto pt-2 border-t border-border-main/50">
                    <div className="h-3.5 w-40 bg-text-muted/15 rounded"></div>
                    <div className="h-3.5 w-48 bg-text-muted/15 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Finished Matches Skeleton */}
          <div className="flex flex-col gap-3">
            <div className="h-4 w-32 bg-text-muted/20 rounded"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="hallmark-card p-0 overflow-hidden bg-surface border-2 border-border-main flex flex-col min-h-[240px] justify-between">
                <div className="h-1.5 bg-slate-400/40" />
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-16 bg-text-muted/20 rounded"></div>
                    <div className="flex gap-1.5">
                      <div className="h-4 w-12 bg-rose-500/30 rounded"></div>
                      <div className="h-4 w-16 bg-text-muted/20 rounded"></div>
                    </div>
                  </div>

                  <div className="h-7 w-44 bg-text-muted/25 rounded"></div>

                  {/* Score Area Skeleton */}
                  <div className="bg-surface-2 border border-border-main px-3 py-3 my-1 min-h-[85px] flex items-center justify-center">
                    <div className="flex items-center justify-center gap-6 sm:gap-8 w-full">
                      <div className="text-center flex-1 space-y-1">
                        <div className="h-3 w-14 bg-text-muted/20 mx-auto rounded"></div>
                        <div className="h-8 w-10 bg-primary/30 mx-auto rounded"></div>
                      </div>
                      <div className="text-text-muted/40 font-bold text-xl">-</div>
                      <div className="text-center flex-1 space-y-1">
                        <div className="h-3 w-16 bg-text-muted/20 mx-auto rounded"></div>
                        <div className="h-8 w-10 bg-text-muted/30 mx-auto rounded"></div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs mt-auto pt-2 border-t border-border-main/50">
                    <div className="h-3.5 w-40 bg-text-muted/15 rounded"></div>
                    <div className="h-3.5 w-48 bg-text-muted/15 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 👉 RIGHT COLUMN: Quick Season Digest (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
          <div className="hallmark-card bg-surface border-2 border-border-main p-4 sm:p-5 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-border-main">
              <div className="h-4 w-36 bg-text-muted/25 rounded"></div>
              <div className="h-3.5 w-12 bg-text-muted/15 rounded"></div>
            </div>

            {/* W-D-L Cluster */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-surface-2 p-2 border border-border-main space-y-1">
                <div className="h-3 w-10 bg-emerald-500/20 mx-auto rounded"></div>
                <div className="h-6 w-6 bg-emerald-500/30 mx-auto rounded"></div>
              </div>
              <div className="bg-surface-2 p-2 border border-border-main space-y-1">
                <div className="h-3 w-8 bg-amber-500/20 mx-auto rounded"></div>
                <div className="h-6 w-6 bg-amber-500/30 mx-auto rounded"></div>
              </div>
              <div className="bg-surface-2 p-2 border border-border-main space-y-1">
                <div className="h-3 w-8 bg-rose-500/20 mx-auto rounded"></div>
                <div className="h-6 w-6 bg-rose-500/30 mx-auto rounded"></div>
              </div>
            </div>

            {/* Goals & Goal Diff */}
            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between items-center py-1.5 border-b border-border-main/50">
                <div className="h-3.5 w-28 bg-text-muted/20 rounded"></div>
                <div className="h-4 w-12 bg-text-muted/25 rounded"></div>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border-main/50">
                <div className="h-3.5 w-28 bg-text-muted/20 rounded"></div>
                <div className="h-4 w-12 bg-rose-500/25 rounded"></div>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <div className="h-3.5 w-24 bg-text-muted/20 rounded"></div>
                <div className="h-4 w-8 bg-rose-500/25 rounded"></div>
              </div>
            </div>

            {/* Single Action Button */}
            <div className="pt-2 border-t border-border-main">
              <div className="h-10 w-full bg-surface-2 border-2 border-border-main rounded"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}



