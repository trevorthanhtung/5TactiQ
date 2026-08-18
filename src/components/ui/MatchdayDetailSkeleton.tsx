import React from 'react';

export function MatchdayDetailSkeleton() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col min-h-full max-w-7xl 2xl:max-w-[1520px] mx-auto w-full gap-5 sm:gap-6 pb-32 lg:pb-12 animate-pulse">
      
      {/* 1. Header Toolbar Card */}
      <div className="bg-surface border-2 border-border-main p-3 sm:p-4 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {/* Back button */}
          <div className="h-10 w-10 bg-text-muted/20 rounded"></div>
          {/* Dropdown */}
          <div className="h-10 flex-1 lg:w-80 bg-text-muted/20 rounded"></div>
        </div>
        
        {/* Right buttons */}
        <div className="flex items-center gap-2 lg:ml-auto w-full lg:w-auto">
          <div className="h-10 flex-1 lg:w-32 bg-text-muted/20 rounded"></div>
          <div className="h-10 w-10 bg-text-muted/20 rounded"></div>
          <div className="h-10 w-10 bg-text-muted/20 rounded"></div>
        </div>
      </div>

      {/* 2. Match Banner Card */}
      <div className="bg-surface-2 border-2 border-border-main p-6 sm:p-8 flex flex-col items-center relative overflow-hidden shadow-md shrink-0">
        <div className="h-3.5 w-32 bg-text-muted/20 rounded mb-4"></div>
        <div className="h-10 w-64 bg-text-muted/25 rounded mb-8"></div>
        
        {/* Score Area */}
        <div className="flex items-center justify-center gap-6 mb-8 w-full max-w-sm">
          <div className="flex flex-col items-center flex-1">
            <div className="h-3 w-16 bg-text-muted/20 rounded mb-2"></div>
            <div className="h-12 w-16 bg-text-muted/25 rounded"></div>
          </div>
          <div className="text-2xl font-bold text-text-muted">-</div>
          <div className="flex flex-col items-center flex-1">
            <div className="h-3 w-16 bg-text-muted/20 rounded mb-2"></div>
            <div className="h-12 w-16 bg-text-muted/25 rounded"></div>
          </div>
        </div>
        
        <div className="h-4 w-48 bg-text-muted/20 rounded"></div>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Tabs */}
        <div className="w-full bg-surface border-2 border-border-main h-12 mb-6 rounded-none flex items-center px-4 gap-4">
          <div className="h-5 w-24 bg-primary/30 rounded"></div>
          <div className="h-5 w-20 bg-text-muted/20 rounded"></div>
          <div className="h-5 w-24 bg-text-muted/20 rounded"></div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
          <div className="bg-surface p-4 border-2 border-border-main flex flex-col items-center justify-center h-20">
            <div className="h-6 w-8 bg-text-muted/20 rounded mb-1"></div>
            <div className="h-3 w-16 bg-text-muted/15 rounded"></div>
          </div>
          <div className="bg-surface p-4 border-2 border-border-main flex flex-col items-center justify-center h-20">
            <div className="h-6 w-8 bg-text-muted/20 rounded mb-1"></div>
            <div className="h-3 w-16 bg-text-muted/15 rounded"></div>
          </div>
          <div className="bg-surface p-4 border-2 border-border-main flex flex-col items-center justify-center h-20">
            <div className="h-6 w-8 bg-text-muted/20 rounded mb-1"></div>
            <div className="h-3 w-16 bg-text-muted/15 rounded"></div>
          </div>
        </div>

        {/* List of Players */}
        <div className="flex flex-col flex-1 bg-surface border-2 border-border-main mb-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center p-3 sm:p-4 border-b-2 border-border-main last:border-0">
              <div className="h-4 w-6 bg-text-muted/20 rounded mr-4"></div>
              <div className="h-5 w-48 bg-text-muted/25 rounded flex-1"></div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-12 bg-text-muted/20 rounded"></div>
                <div className="h-8 w-12 bg-text-muted/20 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}

