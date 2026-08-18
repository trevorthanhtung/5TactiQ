import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function PlayerProfileSkeleton() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col max-w-7xl 2xl:max-w-[1520px] mx-auto w-full animate-pulse">
      {/* Back link skeleton */}
      <div className="flex items-center gap-2 font-bold text-text-muted/40 mb-6">
        <ArrowLeft size={16} /> <div className="h-4 w-24 bg-text-muted/20 rounded"></div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Player Card & Actions */}
        <div className="lg:col-span-5 2xl:col-span-4 flex flex-col gap-4 sm:gap-6">
          {/* Player Identity Card */}
          <div className="hallmark-card bg-surface overflow-hidden relative p-5 sm:p-6 border-2 border-border-main shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="h-7 sm:h-8 w-44 bg-text-muted/25 rounded"></div>
              <div className="h-6 w-20 bg-text-muted/20 rounded"></div>
            </div>

            {/* Badges Row */}
            <div className="flex gap-2 flex-wrap items-center">
              <div className="h-5 w-12 bg-primary/20 rounded"></div>
              <div className="h-5 w-14 bg-text-muted/15 rounded"></div>
            </div>

            {/* Health Box */}
            <div className="h-12 w-full bg-accent/30 border border-border-main rounded p-2 flex items-center justify-between">
              <div className="h-4 w-28 bg-text-muted/20 rounded"></div>
              <div className="h-4 w-16 bg-text-muted/20 rounded"></div>
            </div>

            {/* Note & Info */}
            <div className="space-y-2 pt-2 border-t border-border-main">
              <div className="h-3.5 w-32 bg-text-muted/15 rounded"></div>
              <div className="h-3.5 w-48 bg-text-muted/15 rounded"></div>
            </div>
          </div>

          {/* Stats Cards (2-col grid) */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="hallmark-card p-3 text-center bg-surface border-2 border-border-main">
                <div className="h-3 w-12 bg-text-muted/20 mx-auto mb-1.5 rounded"></div>
                <div className="h-7 w-8 bg-text-muted/25 mx-auto rounded"></div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-primary/30 rounded"></div>
            <div className="h-10 bg-secondary/30 rounded"></div>
          </div>
        </div>

        {/* Right Column: Match History & Details */}
        <div className="lg:col-span-7 2xl:col-span-8 flex flex-col gap-4 sm:gap-6">
          {/* Tabs */}
          <div className="w-full bg-surface border-2 border-border-main h-11 flex items-center px-4 gap-4">
            <div className="h-4 w-28 bg-primary/30 rounded"></div>
            <div className="h-4 w-24 bg-text-muted/20 rounded"></div>
          </div>

          {/* Matches List */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="hallmark-card p-4 bg-surface border-2 border-border-main flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-text-muted/25 rounded"></div>
                  <div className="h-3.5 w-28 bg-text-muted/15 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-12 bg-text-muted/20 rounded"></div>
                  <div className="h-6 w-12 bg-secondary/20 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

