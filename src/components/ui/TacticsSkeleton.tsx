import React from 'react';

export function TacticsSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] @md:h-screen bg-surface overflow-hidden animate-pulse">
      {/* Top Header Skeleton */}
      <div className="h-14 bg-surface border-b-2 border-border-main flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-text-muted/20 rounded"></div>
          <div className="h-8 w-32 bg-text-muted/25 rounded"></div>
        </div>
        <div className="h-8 w-24 bg-text-muted/20 rounded"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Toolbar Skeleton */}
        <div className="w-16 bg-surface border-r-2 border-border-main flex flex-col items-center py-2 gap-2 overflow-y-auto shrink-0">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => (
            <div key={i} className="w-10 h-10 bg-text-muted/15 rounded"></div>
          ))}
        </div>

        {/* Center Canvas & Bottom Panel Skeleton */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-surface p-2 @md:p-4 gap-4">
          
          {/* Pitch Area Skeleton */}
          <div className="flex-1 bg-primary/20 rounded-lg border-4 border-primary/30 flex items-center justify-center relative">
            <div className="w-full h-full absolute inset-0 border-2 border-primary/20 m-4 rounded"></div>
            <div className="w-32 h-32 rounded-full border-2 border-primary/20"></div>
          </div>

          {/* Bottom Panel Skeleton */}
          <div className="h-48 bg-surface border-2 border-border-main shrink-0 p-4 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-4 border-b-2 border-border-main mb-4 pb-2">
              <div className="h-6 w-24 bg-text-muted/25 rounded"></div>
              <div className="h-6 w-24 bg-text-muted/15 rounded"></div>
              <div className="h-6 w-24 bg-text-muted/15 rounded"></div>
            </div>
            {/* Cards */}
            <div className="flex gap-4 overflow-x-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="min-w-[200px] flex-1 h-24 border-2 border-border-main bg-surface-2 p-3">
                  <div className="h-5 w-1/3 bg-text-muted/20 rounded mb-2"></div>
                  <div className="h-3 w-3/4 bg-text-muted/15 rounded mb-1"></div>
                  <div className="h-3 w-1/2 bg-text-muted/15 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Skeleton (Frames) */}
        <div className="w-24 bg-surface border-l-2 border-border-main flex flex-col items-center py-4 gap-4 shrink-0 overflow-y-auto">
          <div className="w-12 h-12 bg-text-muted/20 rounded-full"></div>
          <div className="w-16 h-12 bg-text-muted/25 rounded"></div>
          <div className="w-16 h-12 bg-surface-2 border-2 border-dashed border-border-main rounded flex items-center justify-center">
             <div className="w-6 h-6 bg-text-muted/20 rounded-full"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
