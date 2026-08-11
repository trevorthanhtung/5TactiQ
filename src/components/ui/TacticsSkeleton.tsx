import React from 'react';

export function TacticsSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] @md:h-screen bg-surface overflow-hidden animate-pulse">
      {/* Top Header Skeleton */}
      <div className="h-14 bg-surface border-b-2 border-border-main flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-text-muted/20 rounded"></div>
          <div className="h-7 w-32 bg-text-muted/25 rounded"></div>
        </div>
        <div className="h-7 w-20 bg-text-muted/20 rounded"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Toolbar Skeleton */}
        <div className="w-14 bg-surface border-r-2 border-border-main flex flex-col items-center py-3 gap-2.5 overflow-y-auto shrink-0">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
            <div key={i} className="w-9 h-9 bg-text-muted/15 rounded border border-border-main/50"></div>
          ))}
        </div>

        {/* Center Canvas & Bottom Panel Skeleton */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-surface p-2 @md:p-4 gap-4">
          
          {/* Pitch Area Skeleton */}
          <div className="flex-1 bg-[#1b7a3e]/30 rounded-xl border-4 border-[#1b7a3e]/50 flex items-center justify-center relative overflow-hidden">
            {/* Pitch markings */}
            <div className="w-full h-full absolute inset-0 border-2 border-white/20 m-3 rounded-lg pointer-events-none"></div>
            <div className="w-28 h-28 rounded-full border-2 border-white/20 absolute"></div>
            <div className="h-full w-0.5 bg-white/20 absolute left-1/2"></div>
            
            {/* Player Tokens Skeleton (Red & Blue circles) */}
            <div className="absolute left-[18%] top-[50%] w-8 h-8 rounded-full bg-rose-500/40 border-2 border-white/40"></div>
            <div className="absolute left-[38%] top-[30%] w-8 h-8 rounded-full bg-rose-500/40 border-2 border-white/40"></div>
            <div className="absolute left-[38%] top-[70%] w-8 h-8 rounded-full bg-rose-500/40 border-2 border-white/40"></div>
            <div className="absolute left-[52%] top-[38%] w-8 h-8 rounded-full bg-rose-500/40 border-2 border-white/40"></div>
            <div className="absolute right-[18%] top-[50%] w-8 h-8 rounded-full bg-sky-500/40 border-2 border-white/40"></div>
            <div className="absolute right-[38%] top-[30%] w-8 h-8 rounded-full bg-sky-500/40 border-2 border-white/40"></div>
            <div className="absolute right-[38%] top-[70%] w-8 h-8 rounded-full bg-sky-500/40 border-2 border-white/40"></div>
          </div>

          {/* Bottom Panel Skeleton */}
          <div className="h-44 bg-surface border-2 border-border-main shrink-0 p-3 flex flex-col">
            {/* Tabs */}
            <div className="flex gap-4 border-b-2 border-border-main mb-3 pb-2">
              <div className="h-6 w-24 bg-text-muted/25 rounded"></div>
              <div className="h-6 w-20 bg-text-muted/15 rounded"></div>
              <div className="h-6 w-20 bg-text-muted/15 rounded"></div>
              <div className="h-6 w-24 bg-text-muted/15 rounded"></div>
            </div>
            {/* Formation Cards */}
            <div className="flex gap-3 overflow-x-hidden">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="min-w-[180px] flex-1 h-24 border-2 border-border-main bg-surface-2 p-3 space-y-2">
                  <div className="h-5 w-16 bg-text-muted/25 rounded"></div>
                  <div className="h-3 w-full bg-text-muted/15 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar Skeleton (Animation Frames) */}
        <div className="w-16 bg-surface border-l-2 border-border-main flex flex-col items-center py-3 gap-3 shrink-0 overflow-y-auto">
          <div className="w-9 h-9 bg-text-muted/20 rounded"></div>
          <div className="w-10 h-10 bg-text-muted/25 rounded"></div>
          <div className="w-10 h-10 bg-surface-2 border-2 border-dashed border-border-main rounded flex items-center justify-center">
             <div className="w-4 h-4 bg-text-muted/20 rounded-full"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
