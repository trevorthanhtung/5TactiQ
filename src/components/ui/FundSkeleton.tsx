import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function FundSkeleton() {
  return (
    <div className="p-4 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 mb-6 pt-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 border-2 border-border-main shrink-0 text-text-muted/30">
            <ArrowLeft size={20} />
          </div>
          <div>
            <div className="h-8 sm:h-10 w-44 bg-text-muted/25 rounded mb-1"></div>
            <div className="h-3.5 w-28 bg-text-muted/15 rounded"></div>
          </div>
        </div>
        <div className="h-9 w-24 bg-secondary/25 rounded"></div>
      </div>

      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface p-4 border-2 border-border-main flex flex-col justify-center h-24">
            <div className="h-3.5 w-20 bg-text-muted/20 rounded mb-2"></div>
            <div className="h-7 w-28 bg-text-muted/25 rounded"></div>
          </div>
        ))}
      </div>

      {/* Transactions List Skeleton */}
      <div className="bg-surface border-2 border-border-main divide-y-2 divide-border-main">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-text-muted/15 rounded-full shrink-0"></div>
              <div className="space-y-1.5">
                <div className="h-4 w-36 bg-text-muted/25 rounded"></div>
                <div className="h-3 w-24 bg-text-muted/15 rounded"></div>
              </div>
            </div>
            <div className="h-6 w-20 bg-text-muted/20 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
