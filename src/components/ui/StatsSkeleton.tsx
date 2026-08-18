import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function StatsSkeleton() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col min-h-full max-w-7xl 2xl:max-w-[1520px] mx-auto w-full pb-32 lg:pb-12 animate-pulse">
      {/* Back button */}
      <div className="flex items-center gap-2 font-bold text-text-muted/40 mb-4 sm:mb-5">
        <ArrowLeft size={16} /> <div className="h-4 w-28 bg-text-muted/20 rounded"></div>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-3 sm:gap-4 mb-5 sm:mb-6 pb-2 border-b-2 border-border-main">
        <div>
          <div className="h-8 sm:h-12 w-36 sm:w-48 bg-text-muted/25 rounded mb-1"></div>
          <div className="h-3.5 w-32 bg-text-muted/15 rounded"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2 sm:gap-3 shrink-0">
          <div className="h-10 w-full sm:w-36 bg-text-muted/20 rounded"></div>
          <div className="h-10 w-full sm:w-36 bg-primary/30 rounded"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-border-main mb-5 sm:mb-6 overflow-x-auto gap-2 pb-1">
        <div className="h-9 w-24 bg-primary/20 rounded-none border-b-4 border-primary"></div>
        <div className="h-9 w-24 bg-text-muted/15 rounded-none"></div>
        <div className="h-9 w-32 bg-text-muted/15 rounded-none"></div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ranking Table */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="hallmark-card p-0 overflow-hidden bg-surface border-2 border-border-main shadow-sm">
            <div className="p-3 sm:p-4 bg-surface-2 border-b-2 border-border-main flex justify-between items-center">
              <div className="h-4 w-32 bg-text-muted/20 rounded"></div>
              <div className="h-4 w-20 bg-text-muted/20 rounded"></div>
            </div>

            {[1, 2, 3, 4, 5, 6].map((i, index) => (
              <div key={i} className="flex items-center p-3.5 sm:p-4 border-b border-border-main/50 last:border-0 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center font-display font-bold text-text-muted/30 text-base">
                    {index + 1}
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 sm:w-44 bg-text-muted/25 rounded"></div>
                    <div className="h-3 w-20 bg-text-muted/15 rounded"></div>
                  </div>
                </div>
                <div className="h-7 w-12 bg-text-muted/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Analytics & KPI */}
        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
          {/* KPI Cards (2x2) */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main">
                <div className="h-3 w-20 bg-text-muted/20 rounded mx-auto mb-2"></div>
                <div className="h-8 w-12 bg-text-muted/25 rounded mx-auto"></div>
              </div>
            ))}
          </div>

          {/* Visual Bar Chart Skeleton */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-border-main">
              <div className="h-4 w-36 bg-text-muted/25 rounded"></div>
              <div className="h-3 w-16 bg-text-muted/15 rounded"></div>
            </div>

            <div className="flex flex-col gap-3.5 pt-1">
              {[
                { nameW: 'w-24', barW: 'w-[90%]', isTop: true },
                { nameW: 'w-28', barW: 'w-[75%]', isTop: false },
                { nameW: 'w-20', barW: 'w-[55%]', isTop: false },
                { nameW: 'w-32', barW: 'w-[40%]', isTop: false },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <div className={`h-3.5 ${item.nameW} bg-text-muted/20 rounded`}></div>
                    <div className="h-4 w-8 bg-text-muted/25 rounded"></div>
                  </div>
                  <div className="w-full bg-accent/40 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.isTop ? 'bg-secondary/50' : 'bg-primary/30'} ${item.barW}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

