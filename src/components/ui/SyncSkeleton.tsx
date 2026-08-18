import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function SyncSkeleton() {
  return (
    <div className="p-4 flex flex-col max-w-5xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 pt-2">
        <div className="p-2 border-2 border-border-main shrink-0 text-text-muted/30">
          <ArrowLeft size={20} />
        </div>
        <div className="h-8 sm:h-10 w-64 bg-text-muted/25 rounded"></div>
      </div>
      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Sections Skeleton */}
      <div className="space-y-6">
        {/* Section 1 */}
        <div className="bg-surface p-5 border-2 border-border-main hallmark-card">
          <div className="h-6 w-48 bg-text-muted/25 rounded mb-2"></div>
          <div className="h-4 w-64 bg-text-muted/15 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-11 bg-text-muted/20 rounded"></div>
            <div className="h-11 bg-text-muted/20 rounded"></div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-surface p-5 border-2 border-border-main hallmark-card">
          <div className="h-6 w-48 bg-text-muted/25 rounded mb-2"></div>
          <div className="h-4 w-72 bg-text-muted/15 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-11 bg-text-muted/20 rounded"></div>
            <div className="h-11 bg-text-muted/20 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

