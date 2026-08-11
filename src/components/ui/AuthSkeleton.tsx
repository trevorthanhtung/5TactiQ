import React from 'react';

export function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 relative select-none animate-pulse">
      {/* Top right theme & language buttons placeholder */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <div className="w-9 h-9 bg-text-muted/20 border-2 border-border-main"></div>
        <div className="w-9 h-9 bg-text-muted/20 border-2 border-border-main"></div>
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-6 my-auto pt-8 pb-8">
        {/* Brand Logo & Title Skeleton */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 bg-text-muted/25 rounded-2xl border-2 border-border-main shadow-md"></div>
          <div className="h-8 w-40 bg-text-muted/30 rounded mt-1"></div>
        </div>

        {/* Main Auth Card Skeleton */}
        <div className="w-full hallmark-card bg-surface p-6 sm:p-8 border-2 border-border-main shadow-lg flex flex-col gap-5">
          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-16 bg-text-muted/25 rounded"></div>
            <div className="h-11 w-full bg-text-muted/15 border-2 border-border-main/50 rounded-none"></div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <div className="h-3.5 w-20 bg-text-muted/25 rounded"></div>
            <div className="h-11 w-full bg-text-muted/15 border-2 border-border-main/50 rounded-none"></div>
            <div className="h-3 w-32 bg-text-muted/20 rounded self-end mt-1"></div>
          </div>

          {/* Log In Button */}
          <div className="h-12 w-full bg-primary/40 border-2 border-primary/60 rounded-none mt-2"></div>

          {/* Toggle login / signup text */}
          <div className="h-3.5 w-48 bg-text-muted/20 rounded self-center my-1"></div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="h-[1px] flex-1 bg-border-main/40"></div>
            <div className="h-3 w-6 bg-text-muted/20 rounded"></div>
            <div className="h-[1px] flex-1 bg-border-main/40"></div>
          </div>

          {/* Google Button */}
          <div className="h-11 w-full bg-text-muted/10 border-2 border-border-main/60 rounded-none"></div>
        </div>

        {/* Guest Button Skeleton */}
        <div className="w-full hallmark-card bg-surface p-4 border-2 border-border-main shadow flex items-center justify-center">
          <div className="h-4 w-44 bg-text-muted/25 rounded"></div>
        </div>

        {/* Footer Skeleton */}
        <div className="h-3 w-72 bg-text-muted/15 rounded text-center mt-2"></div>
      </div>
    </div>
  );
}
