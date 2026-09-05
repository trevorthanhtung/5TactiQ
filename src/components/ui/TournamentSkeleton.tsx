import { ArrowLeft } from 'lucide-react';

export function TournamentSkeleton() {
  return (
    <div className="p-4 flex flex-col max-w-5xl mx-auto w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-2 @sm:gap-3 mb-6 pt-2">
        <div className="flex items-center gap-2 @sm:gap-3">
          <div className="p-2 border-2 border-border-main shrink-0 text-text-muted/30">
            <ArrowLeft size={20} />
          </div>
          <div>
            <div className="h-8 @md:h-10 w-48 bg-text-muted/25 rounded"></div>
            <div className="h-4 w-36 bg-text-muted/15 rounded mt-2"></div>
          </div>
        </div>
        <div className="h-9 w-28 bg-primary/20 rounded"></div>
      </div>

      <div className="hallmark-divider mb-6 opacity-30"></div>

      {/* Tabs Skeleton */}
      <div className="flex border-b-2 border-border-main mb-6 gap-2">
        <div className="h-10 w-32 bg-primary/20 rounded-t"></div>
        <div className="h-10 w-32 bg-text-muted/10 rounded-t"></div>
        <div className="h-10 w-32 bg-text-muted/10 rounded-t"></div>
      </div>

      {/* Standings Table Skeleton */}
      <div className="bg-surface border-2 border-border-main p-4 space-y-3">
        <div className="h-8 bg-accent/20 rounded w-full"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-text-muted/10 rounded w-full flex items-center justify-between px-3">
            <div className="h-4 w-32 bg-text-muted/20 rounded"></div>
            <div className="flex gap-4">
              <div className="h-4 w-8 bg-text-muted/20 rounded"></div>
              <div className="h-4 w-8 bg-text-muted/20 rounded"></div>
              <div className="h-4 w-8 bg-text-muted/20 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
