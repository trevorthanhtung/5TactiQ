import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function VenuesSkeleton() {
  return (
    <div className="p-4 flex flex-col max-w-6xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6 pt-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-2 border-2 border-border-main shrink-0 text-text-muted/30">
            <ArrowLeft size={20} />
          </div>
          <div className="h-8 sm:h-10 w-48 sm:w-60 bg-text-muted/25 rounded"></div>
        </div>
        <div className="h-10 w-28 sm:w-36 bg-secondary/30 rounded"></div>
      </div>
      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Search Bar Skeleton */}
      <div className="mb-6 max-w-md h-11 bg-surface border-2 border-border-main rounded"></div>

      {/* Grid Skeleton (3 columns on lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { nameW: 'w-48', hasPrice: false },
          { nameW: 'w-44', hasPrice: false },
          { nameW: 'w-40', hasPrice: false },
          { nameW: 'w-36', hasPrice: false },
          { nameW: 'w-52', hasPrice: true },
          { nameW: 'w-44', hasPrice: false },
        ].map((item, i) => (
          <div key={i} className="bg-surface border-2 border-border-main p-4 flex flex-col justify-between h-full min-h-[175px]">
            <div>
              <div className={`h-5 ${item.nameW} bg-text-muted/25 rounded mb-2.5`}></div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-3.5 h-3.5 bg-text-muted/20 rounded-full shrink-0 mt-0.5"></div>
                  <div className="h-3.5 w-full bg-text-muted/15 rounded"></div>
                </div>

                {item.hasPrice ? (
                  <div className="grid grid-cols-2 gap-2 my-1 pt-1.5 border-t border-border-main">
                    <div className="p-2 bg-surface-2 border-2 border-border-main space-y-1">
                      <div className="h-2.5 w-10 bg-text-muted/20 rounded"></div>
                      <div className="h-4 w-12 bg-text-muted/15 rounded"></div>
                    </div>
                    <div className="p-2 bg-surface-2 border-2 border-border-main space-y-1">
                      <div className="h-2.5 w-8 bg-text-muted/20 rounded"></div>
                      <div className="h-4 w-16 bg-primary/30 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div className="my-1 pt-1.5 border-t border-border-main">
                    <div className="py-2 px-2.5 bg-surface-2/60 border border-dashed border-border-main flex items-center justify-center">
                      <div className="h-3 w-28 bg-text-muted/15 rounded"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Call Button Skeleton */}
            <div className="mt-3 pt-2.5 border-t border-border-main/40">
              <div className="h-8 w-44 bg-emerald-600/30 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


