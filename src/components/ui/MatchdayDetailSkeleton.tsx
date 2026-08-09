import React from 'react';

export function MatchdayDetailSkeleton() {
  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full gap-6 animate-pulse">
      
      {/* 1. Header Toolbar Card */}
      <div className="bg-surface border-2 border-primary/10 p-3 md:p-4 shadow-sm flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 md:gap-4 shrink-0">
        <div className="flex items-center gap-2 w-full lg:w-auto">
          {/* Back button */}
          <div className="h-10 w-10 bg-slate-200 rounded"></div>
          {/* Dropdown */}
          <div className="h-10 flex-1 lg:w-80 bg-slate-200 rounded"></div>
        </div>
        
        {/* Right buttons */}
        <div className="flex items-center gap-2 lg:ml-auto w-full lg:w-auto">
          <div className="h-10 flex-1 lg:w-32 bg-slate-200 rounded"></div>
          <div className="h-10 w-10 bg-slate-200 rounded"></div>
          <div className="h-10 w-10 bg-slate-200 rounded"></div>
        </div>
      </div>

      {/* 2. Match Banner Card */}
      <div className="bg-slate-800 border-2 border-slate-700 p-6 md:p-8 flex flex-col items-center relative overflow-hidden shadow-xl shrink-0">
        <div className="h-3 w-32 bg-slate-600 rounded mb-4"></div>
        <div className="h-10 w-64 bg-slate-600 rounded mb-8"></div>
        
        {/* Score Area */}
        <div className="flex items-center justify-center gap-6 mb-8 w-full max-w-sm">
          <div className="flex flex-col items-center flex-1">
            <div className="h-3 w-16 bg-slate-600 rounded mb-2"></div>
            <div className="h-12 w-16 bg-slate-600 rounded"></div>
          </div>
          <div className="text-2xl font-bold text-text-muted">-</div>
          <div className="flex flex-col items-center flex-1">
            <div className="h-3 w-16 bg-slate-600 rounded mb-2"></div>
            <div className="h-12 w-16 bg-slate-600 rounded"></div>
          </div>
        </div>
        
        <div className="h-4 w-48 bg-slate-600 rounded"></div>
      </div>

      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab */}
        <div className="w-full bg-slate-300 h-12 mb-6 rounded-sm"></div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
          <div className="bg-surface p-4 border-2 border-border-main flex flex-col items-center justify-center h-20">
            <div className="h-6 w-8 bg-slate-200 rounded mb-1"></div>
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
          </div>
          <div className="bg-surface p-4 border-2 border-border-main flex flex-col items-center justify-center h-20">
            <div className="h-6 w-8 bg-slate-200 rounded mb-1"></div>
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
          </div>
          <div className="bg-surface p-4 border-2 border-border-main flex flex-col items-center justify-center h-20">
            <div className="h-6 w-8 bg-slate-200 rounded mb-1"></div>
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
          </div>
        </div>

        {/* List of Players */}
        <div className="flex flex-col flex-1 bg-surface border-2 border-slate-100 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center p-3 md:p-4 border-b-2 border-slate-100">
              <div className="h-4 w-6 bg-slate-200 rounded mr-4"></div>
              <div className="h-5 w-48 bg-slate-200 rounded flex-1"></div>
              <div className="flex items-center gap-1">
                <div className="h-8 w-12 bg-slate-200 rounded"></div>
                <div className="h-8 w-12 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
