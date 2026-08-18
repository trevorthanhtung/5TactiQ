import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function HeadToHeadSkeleton() {
  return (
    <div className="p-4 flex flex-col max-w-6xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 pt-2">
        <div className="p-2 border-2 border-border-main shrink-0 text-text-muted/30">
          <ArrowLeft size={20} />
        </div>
        <div>
          <div className="h-8 sm:h-10 w-48 sm:w-60 bg-text-muted/25 rounded mb-1"></div>
          <div className="h-3.5 w-32 bg-text-muted/15 rounded"></div>
        </div>
      </div>

      {/* Stats Grid Skeleton (4 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="hallmark-card bg-surface p-4 flex flex-col justify-center items-center h-24 border-2 border-border-main">
            <div className="h-4 w-16 bg-text-muted/15 rounded mb-2"></div>
            <div className="h-7 w-12 bg-text-muted/25 rounded"></div>
          </div>
        ))}
      </div>

      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Search & Filter Row Skeleton */}
      <div className="mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="h-11 w-full md:w-80 bg-surface border-2 border-border-main rounded"></div>
        <div className="h-11 w-full md:w-48 bg-text-muted/20 rounded shrink-0"></div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="hallmark-card bg-surface p-4 flex items-center justify-between border-2 border-border-main min-h-[85px]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-text-muted/20 rounded-full shrink-0"></div>
              <div className="space-y-1.5">
                <div className="h-5 w-40 bg-text-muted/25 rounded"></div>
                <div className="h-3.5 w-48 bg-text-muted/15 rounded"></div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="w-6 h-6 bg-text-muted/20 rounded-sm"></div>
              <div className="w-6 h-6 bg-text-muted/20 rounded-sm"></div>
              <div className="w-6 h-6 bg-text-muted/20 rounded-sm"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

