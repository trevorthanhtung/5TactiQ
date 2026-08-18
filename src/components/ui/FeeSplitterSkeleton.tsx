import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function FeeSplitterSkeleton() {
  return (
    <div className="p-4 flex flex-col min-h-full max-w-6xl mx-auto w-full pb-32 lg:pb-12 animate-pulse">
      {/* Header & Match Mode Switcher */}
      <div className="space-y-4 mb-5">
        <div className="flex items-center gap-2 pt-2 text-text-muted/40 font-bold">
          <ArrowLeft size={20} />
          <div className="h-4 w-28 bg-text-muted/20 rounded"></div>
        </div>

        <div>
          <div className="h-8 sm:h-10 w-48 sm:w-60 bg-text-muted/25 rounded"></div>
        </div>

        {/* Match Mode Switcher */}
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <div className="h-12 bg-primary/25 border-2 border-primary/40 rounded-none"></div>
          <div className="h-12 bg-surface border-2 border-border-main rounded-none"></div>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
        {/* RIGHT COLUMN: Results & Quick Message (order-2 on desktop) */}
        <div className="w-full lg:w-[390px] xl:w-[420px] lg:shrink-0 lg:order-2 space-y-5">
          {/* Card 1: 1. BẢNG COI TIỀN */}
          <div className="hallmark-card p-5 space-y-4 bg-surface border-2 border-border-main shadow-sm">
            <div>
              <div className="h-5 w-36 bg-text-muted/25 rounded mb-2"></div>
              <div className="h-3 w-48 bg-text-muted/15 rounded"></div>
            </div>

            {/* Big Per-Person Card */}
            <div className="py-5 flex flex-col items-center justify-center text-center bg-surface-2 border-2 border-border-main my-2">
              <div className="h-3.5 w-28 bg-text-muted/20 rounded mb-2"></div>
              <div className="h-10 sm:h-12 w-44 bg-primary/25 rounded"></div>
            </div>

            {/* Financial Breakdown Rows */}
            <div className="border-t border-border-main pt-3 space-y-2.5">
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-32 bg-text-muted/15 rounded"></div>
                <div className="h-4 w-20 bg-text-muted/25 rounded"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-28 bg-text-muted/15 rounded"></div>
                <div className="h-4 w-20 bg-emerald-500/25 rounded"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-28 bg-text-muted/15 rounded"></div>
                <div className="h-4 w-20 bg-amber-500/25 rounded"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-32 bg-text-muted/15 rounded"></div>
                <div className="h-4 w-16 bg-text-muted/20 rounded"></div>
              </div>
            </div>
          </div>

          {/* Card 2: 5. TIN NHẮN NHANH */}
          <div className="hallmark-card p-5 space-y-3 bg-surface border-2 border-border-main shadow-sm">
            <div className="h-5 w-36 bg-text-muted/25 rounded border-b border-border-main pb-2"></div>
            <div className="h-3 w-44 bg-text-muted/15 rounded"></div>
            <div className="h-32 w-full bg-surface-2 p-3 border border-border-main rounded"></div>
            <div className="h-11 w-full bg-emerald-600/25 rounded"></div>
          </div>
        </div>

        {/* LEFT COLUMN: Input Form (Steps 2, 3, 4) */}
        <div className="flex-1 min-w-0 w-full space-y-5 lg:order-1">
          {/* Section 2: Điểm danh đếm người */}
          <div className="hallmark-card p-5 space-y-4 bg-surface border-2 border-border-main shadow-sm">
            <div className="h-5 w-48 bg-text-muted/25 rounded border-b border-border-main pb-2"></div>
            
            <div className="grid grid-cols-2 border border-border-main">
              <div className="bg-primary/20 h-10 flex items-center justify-center">
                <div className="h-3.5 w-28 bg-primary/30 rounded"></div>
              </div>
              <div className="bg-surface h-10 flex items-center justify-center">
                <div className="h-3.5 w-24 bg-text-muted/15 rounded"></div>
              </div>
            </div>

            {/* Stepper Input */}
            <div className="flex border-2 border-border-main h-12">
              <div className="w-12 bg-surface-2 border-r-2 border-border-main flex items-center justify-center font-bold text-text-muted/40 text-lg">-</div>
              <div className="flex-1 flex items-center justify-center">
                <div className="h-6 w-10 bg-text-muted/25 rounded"></div>
              </div>
              <div className="w-12 bg-surface-2 border-l-2 border-border-main flex items-center justify-center font-bold text-text-muted/40 text-lg">+</div>
            </div>
          </div>

          {/* Section 3: Chi phí trận đấu */}
          <div className="hallmark-card p-5 space-y-4 bg-surface border-2 border-border-main shadow-sm">
            <div className="h-5 w-44 bg-text-muted/25 rounded border-b border-border-main pb-2"></div>

            <div className="space-y-1.5">
              <div className="h-3 w-48 bg-text-muted/15 rounded"></div>
              <div className="h-11 w-full bg-surface border-2 border-border-main rounded"></div>
            </div>

            <div className="space-y-1.5">
              <div className="h-3 w-28 bg-text-muted/15 rounded"></div>
              <div className="h-11 w-full bg-surface border-2 border-border-main rounded"></div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="space-y-1">
                <div className="h-3.5 w-40 bg-text-muted/20 rounded"></div>
                <div className="h-3 w-56 bg-text-muted/15 rounded"></div>
              </div>
              <div className="w-10 h-6 bg-text-muted/20 rounded-full"></div>
            </div>
          </div>

          {/* Section 4: Kèo bóng & Kết quả */}
          <div className="hallmark-card p-5 space-y-4 bg-surface border-2 border-border-main shadow-sm">
            <div className="h-5 w-48 bg-text-muted/25 rounded border-b border-border-main pb-2"></div>
            <div className="h-3 w-32 bg-text-muted/15 rounded"></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 bg-emerald-500/20 border border-emerald-500/30 rounded"></div>
              <div className="h-10 bg-amber-500/20 border border-amber-500/30 rounded"></div>
              <div className="h-10 bg-rose-500/20 border border-rose-500/30 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
