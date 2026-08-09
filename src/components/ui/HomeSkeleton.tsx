import React from 'react';

export function HomeSkeleton() {
  return (
    <div className="p-4 max-w-5xl mx-auto pb-8 w-full animate-pulse">
      {/* Editorial Header Skeleton */}
      <header className="mb-8 pt-4">
        <div className="h-12 md:h-16 bg-slate-300 rounded w-3/4 mb-2"></div>
        <div className="h-12 md:h-16 bg-slate-300 rounded w-1/2"></div>
        <div className="hallmark-divider mt-4 opacity-30"></div>
      </header>

      {/* Bento Grid Skeleton */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
        
        {/* Next Match Card Skeleton */}
        <div className="hallmark-card p-5 col-span-1 @md:col-span-2 @xl:col-span-2 flex flex-col justify-between h-[200px] bg-slate-200">
          <div className="flex justify-between items-start mb-6">
            <div className="h-6 w-32 bg-slate-300 rounded"></div>
            <div className="h-4 w-20 bg-slate-300 rounded"></div>
          </div>
          <div className="flex flex-col @sm:flex-row @sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="h-10 w-48 bg-slate-300 rounded"></div>
              <div className="h-4 w-32 bg-slate-300 rounded"></div>
            </div>
            <div className="h-10 w-32 bg-slate-300 rounded"></div>
          </div>
        </div>

        {/* Roster Summary Skeleton */}
        <div className="hallmark-card p-5 flex flex-col justify-between h-[200px] bg-slate-200">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-24 bg-slate-300 rounded"></div>
              <div className="h-6 w-6 bg-slate-300 rounded-full"></div>
            </div>
            <div className="h-12 w-16 bg-slate-300 rounded mb-2"></div>
            <div className="h-4 w-24 bg-slate-300 rounded"></div>
          </div>
          <div className="h-4 w-32 bg-slate-300 rounded mt-6"></div>
        </div>

        {/* Quick Tactics Skeleton */}
        <div className="hallmark-card p-5 @md:col-span-1 @xl:col-span-1 h-[200px] bg-slate-200 flex flex-col justify-between">
           <div>
             <div className="h-6 w-24 bg-slate-300 rounded mb-4"></div>
             <div className="h-4 w-full bg-slate-300 rounded mb-2"></div>
             <div className="h-4 w-4/5 bg-slate-300 rounded mb-6"></div>
           </div>
           <div className="h-12 w-full bg-slate-300 rounded"></div>
        </div>

        {/* Stats Snippet Skeleton */}
        <div className="hallmark-card p-5 @md:col-span-2 @xl:col-span-2 h-[200px] bg-slate-900 border-slate-700">
           <div className="flex justify-between items-center mb-4">
             <div className="h-6 w-32 bg-slate-700 rounded"></div>
             <div className="h-4 w-24 bg-slate-700 rounded"></div>
           </div>
           <div className="space-y-4">
             {[1, 2, 3].map((i) => (
               <div key={i} className="flex justify-between items-center pb-2">
                 <div className="flex items-center gap-3 w-1/2">
                   <div className="h-6 w-4 bg-slate-700 rounded"></div>
                   <div className="h-5 w-full bg-slate-700 rounded"></div>
                 </div>
                 <div className="h-6 w-12 bg-slate-700 rounded"></div>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
