import React from 'react';

export function HeadToHeadSkeleton() {
  return (
    <div className="p-4 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 @sm:gap-3 mb-6 pt-2">
        <div className="w-10 h-10 bg-slate-300 rounded shrink-0"></div>
        <div>
          <div className="h-9 w-48 bg-slate-300 rounded mb-1"></div>
          <div className="h-3 w-32 bg-slate-300 rounded"></div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 @md:grid-cols-4 gap-2 @md:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="hallmark-card bg-surface p-4 flex flex-col justify-center items-center h-24 border-2 border-transparent">
            <div className="h-6 w-6 bg-slate-300 rounded-full mb-2"></div>
            <div className="h-6 w-12 bg-slate-300 rounded mb-1"></div>
            <div className="h-3 w-20 bg-slate-300 rounded"></div>
          </div>
        ))}
      </div>

      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Search & Filter Row Skeleton */}
      <div className="mb-6 flex flex-col @sm:flex-row gap-3 items-stretch @sm:items-center justify-between">
        <div className="h-[44px] w-full @sm:w-80 bg-slate-300 rounded"></div>
        <div className="h-[44px] w-full @sm:w-[150px] bg-slate-300 rounded shrink-0"></div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="hallmark-card bg-surface p-4 flex items-center justify-between border-2 border-transparent h-20">
            <div>
              <div className="h-5 w-32 bg-slate-300 rounded mb-2"></div>
              <div className="h-3 w-40 bg-slate-300 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-6 w-6 bg-slate-300 rounded"></div>
              <div className="h-6 w-6 bg-slate-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
