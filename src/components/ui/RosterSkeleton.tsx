import React from 'react';

export function RosterSkeleton() {
  return (
    <div className="p-4 max-w-5xl mx-auto pb-8 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-6 pt-2">
        <div className="h-10 w-48 bg-slate-300 rounded"></div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-24 bg-slate-300 rounded"></div>
          <div className="h-10 w-36 bg-slate-300 rounded"></div>
        </div>
      </div>
      <div className="hallmark-divider mt-0 opacity-30"></div>

      {/* Roster Grid Skeleton */}
      <div className="grid grid-cols-1 @xs:grid-cols-2 @md:grid-cols-3 @xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="hallmark-card p-0 relative overflow-hidden bg-slate-200 h-[120px] flex flex-col">
            {/* Jersey Number Placeholder */}
            <div className="absolute top-0 left-0 bg-slate-300 w-12 h-12"></div>

            {/* Card Body Placeholder */}
            <div className="p-4 pt-14 flex-1 flex flex-col">
              <div className="h-6 w-3/4 bg-slate-300 rounded mb-2"></div>
              <div className="flex gap-1 flex-wrap mt-auto">
                <div className="h-4 w-12 bg-slate-300 rounded"></div>
                <div className="h-4 w-16 bg-slate-300 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
