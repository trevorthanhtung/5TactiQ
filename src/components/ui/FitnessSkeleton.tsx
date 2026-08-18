import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function FitnessSkeleton() {
  return (
    <div className="p-4 flex flex-col min-h-full max-w-6xl mx-auto w-full pb-32 lg:pb-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 pt-2">
        <div className="p-2 border-2 border-border-main shrink-0 text-text-muted/30">
          <ArrowLeft size={20} />
        </div>
        <div className="h-8 sm:h-10 w-64 bg-text-muted/25 rounded"></div>
      </div>
      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Filter & Search Bar Skeleton */}
      <div className="mb-6 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="h-11 w-full md:max-w-md bg-surface border-2 border-border-main rounded"></div>
        <div className="flex border-2 border-border-main bg-surface shrink-0 h-10 overflow-hidden">
          <div className="w-24 bg-primary/25 flex items-center justify-center">
            <div className="h-3 w-16 bg-primary/30 rounded"></div>
          </div>
          <div className="w-28 bg-surface border-l border-border-main flex items-center justify-center">
            <div className="h-3 w-20 bg-text-muted/20 rounded"></div>
          </div>
          <div className="w-28 bg-surface border-l border-border-main flex items-center justify-center">
            <div className="h-3 w-20 bg-text-muted/20 rounded"></div>
          </div>
        </div>
      </div>

      {/* Grid Skeleton (3 columns on lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { nameW: 'w-44', badgeColor: 'bg-blue-600/30', hasStripe: true },
          { nameW: 'w-36', badgeColor: 'bg-blue-600/30', hasStripe: true },
          { nameW: 'w-24', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-32', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-36', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-24', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-28', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-36', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-32', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-28', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-32', badgeColor: 'bg-emerald-600/25', hasStripe: false },
          { nameW: 'w-30', badgeColor: 'bg-emerald-600/25', hasStripe: false },
        ].map((item, i) => (
          <div key={i} className="bg-surface border-2 border-border-main shadow-sm p-3.5 flex flex-col justify-between gap-2.5 relative overflow-hidden min-h-[85px]">
            {item.hasStripe && (
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-600/40" />
            )}

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className={`h-4.5 ${item.nameW} bg-text-muted/25 rounded`}></div>
                <div className={`h-5 w-20 ${item.badgeColor} rounded shrink-0`}></div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border-main/40">
              <div className="h-3 w-28 bg-text-muted/15 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


