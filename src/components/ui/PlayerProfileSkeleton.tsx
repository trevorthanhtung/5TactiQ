import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function PlayerProfileSkeleton() {
  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-2xl mx-auto w-full pb-8 animate-pulse">
      {/* Back link skeleton */}
      <div className="flex items-center gap-2 font-bold text-text-muted/40 mb-6">
        <ArrowLeft size={20} /> <div className="h-5 w-28 bg-text-muted/20 rounded"></div>
      </div>

      {/* Main Info Card Skeleton */}
      <div className="hallmark-card bg-surface overflow-hidden relative mb-6 p-6 sm:p-7 border-2 border-border-main shadow-md">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <div className="h-9 w-44 bg-text-muted/25 rounded"></div>
            <div className="h-7 w-28 bg-text-muted/20 rounded"></div>
          </div>
          <div className="flex gap-2 flex-wrap items-center mb-2">
            <div className="h-6 w-14 bg-text-muted/20 rounded"></div>
            <div className="h-6 w-14 bg-text-muted/15 rounded"></div>
          </div>
          <div className="h-[44px] w-full bg-text-muted/15 border-2 border-border-main rounded"></div>
          <div className="h-16 w-full bg-text-muted/15 border-2 border-border-main rounded"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="hallmark-card p-4 text-center bg-surface border-2 border-border-main">
          <div className="h-4 w-16 bg-text-muted/20 mx-auto mb-2 rounded"></div>
          <div className="h-10 w-12 bg-text-muted/25 mx-auto rounded"></div>
        </div>
        <div className="hallmark-card p-4 text-center bg-surface border-2 border-border-main">
          <div className="h-4 w-16 bg-text-muted/20 mx-auto mb-2 rounded"></div>
          <div className="h-10 w-12 bg-text-muted/25 mx-auto rounded"></div>
        </div>
      </div>

      {/* Action Buttons Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="h-[44px] bg-text-muted/25 rounded"></div>
        <div className="h-[44px] bg-text-muted/20 rounded"></div>
      </div>

      {/* Roles & Classifications Section Skeleton */}
      <div className="hallmark-card bg-surface border-2 border-border-main p-4 space-y-3 mb-6">
        <div className="h-4 w-40 bg-text-muted/25 rounded mb-3"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="h-[40px] bg-text-muted/15 border-2 border-border-main rounded"></div>
          <div className="h-[40px] bg-text-muted/15 border-2 border-border-main rounded"></div>
          <div className="h-[40px] bg-text-muted/15 border-2 border-border-main rounded"></div>
        </div>
      </div>
    </div>
  );
}
