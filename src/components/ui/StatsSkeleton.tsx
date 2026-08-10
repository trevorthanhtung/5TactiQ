import React from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';

export function StatsSkeleton() {
  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-8 animate-pulse">
      {/* Back button */}
      <div className="flex items-center gap-2 font-bold text-slate-300 mb-6">
        <ArrowLeft size={20} /> <div className="h-5 w-24 bg-slate-300 rounded"></div>
      </div>
      
      {/* Header */}
      <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-end gap-4 mb-6">
        <div>
          <div className="h-10 @sm:h-12 w-48 bg-slate-300 rounded mb-2"></div>
          <div className="h-4 w-32 bg-slate-300 rounded mt-2"></div>
        </div>
        <div className="flex flex-col @sm:flex-row items-stretch @sm:items-center gap-3 shrink-0">
          <div className="h-[44px] w-full @sm:w-[150px] bg-slate-300 rounded"></div>
          <div className="h-[44px] w-full @sm:w-[160px] bg-slate-300 rounded"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-2 border-primary/10 mb-6 overflow-x-hidden pb-1 gap-2">
        <div className="h-8 w-24 bg-slate-300 rounded-sm"></div>
        <div className="h-8 w-24 bg-slate-300 rounded-sm"></div>
        <div className="h-8 w-32 bg-slate-300 rounded-sm"></div>
      </div>

      {/* List */}
      <div className="pb-4">
        <div className="hallmark-card p-0 overflow-hidden max-w-3xl mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i, index) => (
            <div key={i} className={`flex items-center p-4 ${index !== 7 ? 'border-b-2 border-primary/10' : ''} ${index === 0 ? 'bg-secondary/10' : index < 3 ? 'bg-primary/5' : 'bg-surface'}`}>
              <div className={`w-8 h-8 flex items-center justify-center font-display text-xl mr-4 font-bold ${index === 0 ? 'text-secondary/50' : 'text-slate-300'}`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="h-5 w-48 bg-slate-200 rounded mb-1"></div>
                <div className="h-3 w-32 bg-slate-200 rounded"></div>
              </div>
              <div className="h-8 w-8 bg-slate-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
