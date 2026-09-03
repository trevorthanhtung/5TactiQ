import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function PlayerProfileSkeleton() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col max-w-7xl 2xl:max-w-[1520px] mx-auto w-full animate-pulse">
      {/* 🔙 Back Link Skeleton */}
      <div className="inline-flex items-center gap-1.5 mb-4 sm:mb-6">
        <ArrowLeft size={16} className="text-text-muted/40" />
        <div className="h-4 w-20 bg-text-muted/20"></div>
      </div>

      {/* 📐 2-Column Responsive Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 👈 LEFT COLUMN: Player Card & Actions (5 cols on lg, 4 cols on 2xl) */}
        <div className="lg:col-span-5 2xl:col-span-4 flex flex-col gap-4 sm:gap-6">
          
          {/* 🎴 Player Identity Card */}
          <div className="hallmark-card bg-surface overflow-hidden relative p-5 sm:p-6 border-2 border-border-main shadow-sm">
            {/* Watermark number placeholder */}
            <div className="absolute right-[-10px] bottom-[-25px] text-[140px] sm:text-[170px] font-display font-bold text-primary/[0.04] leading-none select-none pointer-events-none z-0">
              #
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                  {/* Player Name */}
                  <div className="h-7 sm:h-8 w-48 bg-text-muted/25"></div>
                  
                  {/* Jersey Pill */}
                  <div className="h-7 w-28 bg-surface-2 border border-border-main flex items-center px-2.5 gap-1.5">
                    <div className="w-3 h-3 bg-secondary/40"></div>
                    <div className="h-3 w-16 bg-text-muted/20"></div>
                  </div>
                </div>

                {/* Position Badges */}
                <div className="flex gap-1.5 flex-wrap items-center pt-1">
                  <div className="h-5 w-14 bg-accent/50"></div>
                  <div className="h-5 w-12 bg-accent/50"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 🏥 Health & Injury Status Card */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-4 sm:p-5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="h-3.5 w-36 bg-text-muted/20"></div>
              <div className="h-3.5 w-16 bg-secondary/30"></div>
            </div>

            {/* Visual Status Indicator Banner */}
            <div className="p-2.5 sm:p-3 border-2 border-emerald-500/20 bg-emerald-500/10 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 shrink-0"></div>
              <div className="h-4 w-28 bg-emerald-500/20"></div>
            </div>
          </div>

          {/* 🏷️ Role & Classification Card */}
          <div className="bg-surface border-2 border-border-main p-4 flex flex-col gap-2.5 shadow-sm">
            <div className="h-3 w-32 bg-text-muted/20"></div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="h-10 border-2 border-border-main bg-surface-2 flex items-center justify-center">
                <div className="h-3 w-20 bg-text-muted/20"></div>
              </div>
              <div className="h-10 border-2 border-border-main bg-surface-2 flex items-center justify-center">
                <div className="h-3 w-24 bg-text-muted/20"></div>
              </div>
              <div className="h-10 border-2 border-border-main bg-surface-2 flex items-center justify-center">
                <div className="h-3 w-16 bg-text-muted/20"></div>
              </div>
            </div>
          </div>

          {/* ⚡ Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="h-12 w-full bg-primary/30 border-2 border-primary/30 flex items-center justify-center">
              <div className="h-4 w-28 bg-white/40"></div>
            </div>
            <div className="h-4 w-24 bg-rose-500/20 mx-auto mt-1"></div>
          </div>

        </div>

        {/* 👉 RIGHT COLUMN: Performance Stats & Match Log (7 cols on lg, 8 cols on 2xl) */}
        <div className="lg:col-span-7 2xl:col-span-8 flex flex-col gap-4 sm:gap-6">
          
          {/* 📊 Performance KPI Grid (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main flex flex-col items-center justify-center">
              <div className="h-3 w-16 bg-text-muted/20 mb-2"></div>
              <div className="h-9 w-12 bg-primary/25"></div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main flex flex-col items-center justify-center">
              <div className="h-3 w-14 bg-text-muted/20 mb-2"></div>
              <div className="h-9 w-12 bg-secondary/25"></div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main flex flex-col items-center justify-center">
              <div className="h-3 w-20 bg-text-muted/20 mb-2"></div>
              <div className="h-9 w-10 bg-text-muted/25"></div>
            </div>

            <div className="hallmark-card p-3.5 sm:p-4 text-center bg-surface border-2 border-border-main flex flex-col items-center justify-center">
              <div className="h-3 w-24 bg-text-muted/20 mb-2"></div>
              <div className="h-9 w-14 bg-text-muted/25"></div>
            </div>
          </div>

          {/* ⚽ Match Log Card */}
          <div className="hallmark-card bg-surface border-2 border-border-main p-4 sm:p-6 flex flex-col gap-4">
            {/* Card Header */}
            <div className="flex justify-between items-center pb-2 border-b border-border-main">
              <div className="h-5 w-48 sm:w-56 bg-primary/25"></div>
              <div className="h-4 w-12 bg-text-muted/20"></div>
            </div>

            {/* Match Items */}
            <div className="flex flex-col gap-2.5">
              {[
                { titleW: 'w-44', resultW: null, subW: 'w-56', goals: 'w-14', assists: 'w-16' },
                { titleW: 'w-36', resultW: 'w-16', subW: 'w-48', goals: 'w-14', assists: 'w-16' },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 sm:p-3.5 bg-surface-2 border-2 border-border-main flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap"
                >
                  <div className="min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-4.5 ${item.titleW} bg-text-muted/25`}></div>
                      {item.resultW && (
                        <div className={`h-4.5 ${item.resultW} bg-rose-500/20`}></div>
                      )}
                    </div>
                    <div className={`h-3 ${item.subW} bg-text-muted/15`}></div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`h-6 ${item.goals} bg-primary/25`}></div>
                    <div className={`h-6 ${item.assists} bg-secondary/25`}></div>
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


