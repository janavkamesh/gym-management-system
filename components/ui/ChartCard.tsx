import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ChartCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  headlineValue?: string;
  headlineCaption?: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  icon: Icon,
  headlineValue,
  headlineCaption,
  isLoading,
  isEmpty,
  emptyMessage = "No data for this period",
  children
}: ChartCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 relative overflow-hidden flex flex-col chart-card h-[380px]">
      {/* 3px primary blue accent strip */}
      <div className="h-[3px] bg-blue-600 w-full shrink-0" />
      
      {/* Header row */}
      <div className="p-4 sm:p-5 flex items-start gap-3 shrink-0">
        <div className="bg-slate-100 p-2 rounded-full flex-shrink-0">
          <Icon size={18} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      
      {/* Hairline */}
      <div className="h-[1px] bg-slate-200 w-full shrink-0" />
      
      <div className="p-4 sm:p-5 flex-1 flex flex-col relative overflow-hidden">
        {/* Headline number */}
        {headlineValue && (
          <div className="mb-2 shrink-0">
            <div className="text-2xl font-bold text-slate-900">{headlineValue}</div>
            {headlineCaption && <div className="text-xs text-slate-500">{headlineCaption}</div>}
          </div>
        )}
        
        {/* Chart Area */}
        <div className="relative flex-1 w-full flex flex-col min-h-0">
          {isEmpty && !isLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-slate-900 mb-1">{emptyMessage}</span>
            </div>
          ) : (
            <>
              <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col ${isLoading && isEmpty ? 'opacity-0' : 'opacity-100'}`}>
                {children}
              </div>
              
              {isLoading && (
                <div className={`absolute inset-0 z-10 flex items-center justify-center ${!isEmpty ? 'bg-white/80' : 'bg-white'}`}>
                  <div className="w-full h-full bg-slate-200 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
