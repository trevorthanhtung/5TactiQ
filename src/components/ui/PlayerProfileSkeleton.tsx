import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function PlayerProfileSkeleton() {
  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-2xl mx-auto w-full pb-8 animate-pulse">
      <div className="flex items-center gap-2 font-bold text-slate-300 mb-6">
        <ArrowLeft size={20} /> <div className="h-5 w-24 bg-slate-300 rounded"></div>
      </div>

      <div className="hallmark-card bg-surface overflow-hidden relative mb-6">
        <div className="relative z-10 flex flex-col @sm:flex-row items-center @sm:items-start p-6 gap-6">
          <div className="flex-1 text-center @sm:text-left w-full">
            <div className="h-10 w-3/4 bg-slate-200 mx-auto @sm:mx-0 mb-4 rounded"></div>
            <div className="flex gap-2 justify-center @sm:justify-start flex-wrap mb-4">
              <div className="h-6 w-16 bg-slate-200 rounded"></div>
              <div className="h-6 w-16 bg-slate-200 rounded"></div>
            </div>
            <div className="h-6 w-32 bg-slate-200 mx-auto @sm:mx-0 rounded"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="hallmark-card p-4 text-center">
          <div className="h-4 w-16 bg-slate-200 mx-auto mb-2 rounded"></div>
          <div className="h-10 w-10 bg-slate-200 mx-auto rounded"></div>
        </div>
        <div className="hallmark-card p-4 text-center">
          <div className="h-4 w-16 bg-slate-200 mx-auto mb-2 rounded"></div>
          <div className="h-10 w-10 bg-slate-200 mx-auto rounded"></div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-12 w-full bg-slate-200 rounded"></div>
        <div className="h-12 w-full bg-slate-200 rounded"></div>
        <div className="h-12 w-full bg-slate-200 rounded"></div>
        <div className="h-12 w-full bg-slate-200 rounded"></div>
      </div>
    </div>
  );
}
