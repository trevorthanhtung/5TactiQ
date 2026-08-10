import React from 'react';

export function MatchdaySkeleton() {
  return (
    <div className="p-4 max-w-5xl mx-auto pb-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-6 pt-2">
        <div className="h-10 w-48 bg-slate-300 rounded"></div>
        <div className="h-10 w-36 bg-slate-300 rounded"></div>
      </div>
      <div className="hallmark-divider mt-0 opacity-30"></div>

      {/* Section Skeleton */}
      <div className="mb-8 mt-6">
        <div className="h-5 w-32 bg-slate-300 rounded mb-4"></div>
        <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="hallmark-card p-0 overflow-hidden bg-slate-200 flex flex-col h-[180px]">
              {/* Card Top Accent */}
              <div className="h-1.5 bg-slate-400" />

              <div className="p-4 flex flex-col h-full justify-between">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-16 bg-slate-300 rounded"></div>
                  <div className="h-4 w-20 bg-slate-300 rounded"></div>
                </div>

                <div className="h-6 w-3/4 bg-slate-300 rounded mt-4"></div>

                <div className="h-14 w-full bg-slate-300 rounded mt-4"></div>

                <div className="mt-4 space-y-2">
                  <div className="h-3 w-40 bg-slate-300 rounded"></div>
                  <div className="h-3 w-32 bg-slate-300 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
