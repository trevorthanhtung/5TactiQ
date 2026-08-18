import React from 'react';

export function HomeSkeleton() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col max-w-7xl 2xl:max-w-[1520px] mx-auto w-full gap-4 sm:gap-6 animate-pulse">
      
      {/* ⚽ Athletic Hero Header Skeleton */}
      <header className="relative overflow-hidden hallmark-card bg-surface border-2 border-border-main p-4 sm:p-6 md:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
          <div>
            {/* Main Title Skeleton */}
            <div className="h-8 sm:h-12 lg:h-14 w-60 sm:w-80 bg-text-muted/25 rounded mb-2"></div>
            <div className="h-6 sm:h-10 lg:h-12 w-32 sm:w-44 bg-secondary/25 rounded"></div>
          </div>

          {/* Key Metrics Skeleton (Responsive: Grid on Mobile, Flex on Desktop) */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 border-t md:border-t-0 md:border-l-2 border-border-main pt-3 md:pt-0 md:pl-6 mt-1 md:mt-0">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-16 bg-text-muted/20 rounded"></div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <div className="h-7 sm:h-9 w-10 bg-text-muted/25 rounded"></div>
                <div className="h-3 w-8 bg-text-muted/15 rounded"></div>
              </div>
            </div>

            <div className="w-[1px] h-8 bg-border-main hidden sm:block" />

            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-14 bg-text-muted/20 rounded"></div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <div className="h-7 sm:h-9 w-8 bg-secondary/30 rounded"></div>
                <div className="h-3 w-8 bg-text-muted/15 rounded"></div>
              </div>
            </div>

            <div className="w-[1px] h-8 bg-border-main hidden sm:block" />

            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-16 bg-text-muted/20 rounded"></div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <div className="h-7 sm:h-9 w-10 bg-text-muted/25 rounded"></div>
                <div className="h-3 w-8 bg-text-muted/15 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 🏟️ Bento Grid: 3-column Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* 1️⃣ Matchday Hero Card Skeleton (Spans 2 columns on tablet & desktop) */}
        <div className="hallmark-card p-4 sm:p-6 md:col-span-2 flex flex-col justify-between relative overflow-hidden bg-surface border-2 border-border-main min-h-[260px] sm:min-h-[290px]">
          {/* Top Row: Badge & Date */}
          <div>
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              <div className="h-6 w-28 bg-text-muted/20 rounded"></div>
              <div className="h-4 w-24 bg-text-muted/20 rounded"></div>
            </div>

            {/* Match Type & Title */}
            <div className="my-1 sm:my-2">
              <div className="h-3.5 w-28 bg-text-muted/20 rounded mb-2"></div>
              <div className="h-8 sm:h-11 w-52 sm:w-72 bg-text-muted/25 rounded"></div>
            </div>

            {/* Time & Venue */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 sm:gap-x-6 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-main">
              <div className="h-4 w-20 bg-text-muted/20 rounded"></div>
              <div className="h-4 w-44 bg-text-muted/15 rounded"></div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border-main flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="h-3.5 w-64 bg-text-muted/15 rounded hidden sm:block"></div>
            <div className="h-9 w-full sm:w-28 bg-secondary/30 rounded"></div>
          </div>
        </div>

        {/* 2️⃣ Squad Pulse / Roster Breakdown Card Skeleton */}
        <div className="hallmark-card p-4 sm:p-6 flex flex-col justify-between bg-surface border-2 border-border-main min-h-[260px] sm:min-h-[290px]">
          <div>
            <div className="h-5 w-24 bg-text-muted/25 rounded mb-3 sm:mb-4"></div>
            
            <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
              <div className="h-10 sm:h-12 w-14 bg-text-muted/25 rounded"></div>
              <div className="h-4 w-28 bg-text-muted/20 rounded"></div>
            </div>

            {/* Position Badges Grid (2x2) */}
            <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-border-main">
              <div className="p-2 sm:p-2.5 bg-accent/30 flex justify-between items-center">
                <div className="h-4 w-6 bg-text-muted/20 rounded"></div>
                <div className="h-5 w-4 bg-text-muted/25 rounded"></div>
              </div>
              <div className="p-2 sm:p-2.5 bg-accent/30 flex justify-between items-center">
                <div className="h-4 w-8 bg-text-muted/20 rounded"></div>
                <div className="h-5 w-4 bg-text-muted/25 rounded"></div>
              </div>
              <div className="p-2 sm:p-2.5 bg-accent/30 flex justify-between items-center">
                <div className="h-4 w-6 bg-text-muted/20 rounded"></div>
                <div className="h-5 w-4 bg-text-muted/25 rounded"></div>
              </div>
              <div className="p-2 sm:p-2.5 bg-accent/30 flex justify-between items-center">
                <div className="h-4 w-8 bg-text-muted/20 rounded"></div>
                <div className="h-5 w-4 bg-text-muted/25 rounded"></div>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-3 border-t border-border-main flex items-center justify-between">
            <div className="h-4 w-32 bg-secondary/25 rounded"></div>
            <div className="h-4 w-4 bg-secondary/25 rounded"></div>
          </div>
        </div>

        {/* 3️⃣ Tactics Board Card Skeleton */}
        <div className="hallmark-card p-4 sm:p-6 flex flex-col justify-between bg-surface border-2 border-border-main min-h-[260px] sm:min-h-[290px]">
          <div>
            <div className="h-5 w-20 bg-text-muted/25 rounded mb-2.5 sm:mb-3"></div>
            <div className="h-3.5 w-full bg-text-muted/15 rounded mb-2.5 sm:mb-3"></div>
          </div>
          
          <div className="relative flex-1 bg-emerald-900/15 dark:bg-emerald-950/40 border-2 border-emerald-800/30 overflow-hidden min-h-[150px] sm:min-h-[170px] block">
            {/* Field Turf Grass Stripes Effect */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_50%,rgba(0,0,0,0.15)_50%)] bg-[length:40px_100%]" />

            {/* Field Pitch Lines */}
            <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-700/40 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-12 sm:w-14 h-12 sm:h-14 rounded-full border-2 border-emerald-700/40 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-emerald-700/40" />
            </div>
            <div className="absolute top-0 left-[22%] right-[22%] h-6 sm:h-7 border-b-2 border-x-2 border-emerald-700/40"></div>
            <div className="absolute bottom-0 left-[22%] right-[22%] h-6 sm:h-7 border-t-2 border-x-2 border-emerald-700/40"></div>
            
            {/* Dots */}
            <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2">
              <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-secondary/60 rounded-full border-2 border-white/40" />
            </div>
            <div className="absolute bottom-[38%] left-[25%] -translate-x-1/2">
              <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-secondary/60 rounded-full border-2 border-white/40" />
            </div>
            <div className="absolute bottom-[38%] right-[25%] translate-x-1/2">
              <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-secondary/60 rounded-full border-2 border-white/40" />
            </div>
            <div className="absolute top-[38%] left-1/2 -translate-x-1/2">
              <div className="w-3 sm:w-3.5 h-3 sm:h-3.5 bg-secondary/60 rounded-full border-2 border-white/40" />
            </div>

            <div className="absolute top-[10%] left-[35%] -translate-x-1/2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-primary/60 rounded-full border border-white/30" />
            </div>
            <div className="absolute top-[10%] right-[35%] translate-x-1/2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-primary/60 rounded-full border border-white/30" />
            </div>
            <div className="absolute top-[30%] left-[20%] -translate-x-1/2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-primary/60 rounded-full border border-white/30" />
            </div>
            <div className="absolute top-[30%] right-[20%] translate-x-1/2">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 bg-primary/60 rounded-full border border-white/30" />
            </div>
          </div>
        </div>

        {/* 4️⃣ Golden Boot Leaderboard Card Skeleton */}
        <div className="hallmark-card p-4 sm:p-6 flex flex-col justify-between bg-surface border-2 border-border-main min-h-[260px] sm:min-h-[290px]">
          <div>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <div className="h-5 w-28 bg-text-muted/25 rounded"></div>
              <div className="h-3.5 w-16 bg-text-muted/15 rounded"></div>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, nameWidth: 'w-32', goalWidth: 'w-10', barWidth: 'w-[90%]', isGold: true },
                { rank: 2, nameWidth: 'w-36', goalWidth: 'w-8', barWidth: 'w-[68%]', isGold: false },
                { rank: 3, nameWidth: 'w-28', goalWidth: 'w-8', barWidth: 'w-[45%]', isGold: false },
              ].map((item) => (
                <div key={item.rank} className="flex flex-col gap-1 pb-2 border-b border-border-main last:border-0 last:pb-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`font-display font-bold text-lg w-4 ${item.isGold ? 'text-secondary/60' : 'text-text-muted/40'}`}>
                        {item.rank}
                      </span>
                      <div className={`h-4 ${item.nameWidth} bg-text-muted/20 rounded`}></div>
                    </div>
                    <div className={`h-5 ${item.goalWidth} bg-text-muted/25 rounded`}></div>
                  </div>
                  
                  {/* Visual Goal Meter */}
                  <div className="w-full bg-accent/40 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.isGold ? 'bg-secondary/60' : 'bg-primary/40'} ${item.barWidth}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 sm:mt-4 pt-3 border-t border-border-main flex items-center justify-between">
            <div className="h-3.5 w-40 bg-secondary/25 rounded"></div>
            <div className="h-3.5 w-3.5 bg-secondary/25 rounded"></div>
          </div>
        </div>

        {/* 5️⃣ Team Form & Quick Hub Panel Skeleton */}
        <div className="hallmark-card p-4 sm:p-6 flex flex-col justify-between bg-surface border-2 border-border-main min-h-[260px] sm:min-h-[290px]">
          <div>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <div className="h-5 w-36 bg-text-muted/25 rounded"></div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="w-8 h-8 sm:w-9 sm:h-9 bg-text-muted/20 rounded"></div>
                ))}
              </div>
              <div className="h-3.5 w-48 bg-text-muted/15 rounded"></div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-main">
              <div className="h-3 w-24 bg-text-muted/20 rounded mb-2"></div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-2 sm:p-2.5 bg-accent/30 border border-transparent h-9 flex items-center justify-center">
                    <div className="h-3.5 w-16 bg-text-muted/20 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

