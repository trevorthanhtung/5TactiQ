import React from 'react';

export function MoreSkeleton() {
  return (
    <div className="p-4 max-w-5xl mx-auto pb-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="h-10 w-32 bg-text-muted/25 rounded mb-6 pt-2"></div>

      {/* Section 1 Skeleton */}
      <div className="mb-8">
        <div className="h-4 w-32 bg-text-muted/20 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hallmark-card bg-surface p-4 flex items-center justify-between border-2 border-border-main">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-text-muted/20 rounded-full shrink-0"></div>
                <div>
                  <div className="h-5 w-48 bg-text-muted/25 rounded mb-1"></div>
                  <div className="h-3 w-32 bg-text-muted/15 rounded"></div>
                </div>
              </div>
              <div className="w-5 h-5 bg-text-muted/20 rounded shrink-0"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 Skeleton */}
      <div className="mb-8">
        <div className="h-4 w-40 bg-text-muted/20 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hallmark-card bg-surface p-4 flex items-center justify-between border-2 border-border-main">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-text-muted/20 rounded-full shrink-0"></div>
                <div>
                  <div className="h-5 w-48 bg-text-muted/25 rounded mb-1"></div>
                  <div className="h-3 w-32 bg-text-muted/15 rounded"></div>
                </div>
              </div>
              <div className="w-5 h-5 bg-text-muted/20 rounded shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
