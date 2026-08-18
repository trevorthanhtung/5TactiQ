import React from 'react';

export function MoreSkeleton() {
  return (
    <div className="p-4 md:p-6 flex flex-col max-w-5xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <header className="mb-6 pt-2">
        <div className="h-10 w-32 bg-text-muted/25 rounded mb-2"></div>
        <div className="hallmark-divider opacity-30"></div>
      </header>

      {/* Account Profile Card Skeleton */}
      <div className="mb-8">
        <div className="h-4 w-36 bg-text-muted/20 rounded mb-4"></div>
        <div className="hallmark-card p-4 flex items-center border-2 border-border-main bg-surface">
          <div className="w-14 h-14 bg-text-muted/20 border-2 border-border-main mr-4 shrink-0"></div>
          <div className="space-y-2 flex-1">
            <div className="h-5 w-40 bg-text-muted/25 rounded"></div>
            <div className="h-3.5 w-56 bg-text-muted/15 rounded"></div>
          </div>
          <div className="h-4 w-4 bg-text-muted/20 rounded"></div>
        </div>
      </div>

      {/* Section 1: FEATURES */}
      <div className="mb-8">
        <div className="h-4 w-28 bg-text-muted/20 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="hallmark-card bg-surface p-4 flex items-center justify-between border-2 border-border-main">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-text-muted/15 rounded shrink-0"></div>
                <div className="space-y-1.5">
                  <div className="h-5 w-44 bg-text-muted/25 rounded"></div>
                  <div className="h-3 w-36 bg-text-muted/15 rounded"></div>
                </div>
              </div>
              <div className="w-4 h-4 bg-text-muted/20 rounded shrink-0"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: SYSTEM & DATA */}
      <div className="mb-8">
        <div className="h-4 w-36 bg-text-muted/20 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="hallmark-card bg-surface p-4 flex items-center justify-between border-2 border-border-main">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-text-muted/15 rounded shrink-0"></div>
                <div className="space-y-1.5">
                  <div className="h-5 w-40 bg-text-muted/25 rounded"></div>
                  <div className="h-3 w-32 bg-text-muted/15 rounded"></div>
                </div>
              </div>
              <div className="w-4 h-4 bg-text-muted/20 rounded shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

