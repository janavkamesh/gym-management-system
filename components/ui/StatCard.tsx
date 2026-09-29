import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subLabel?: string;
  icon: LucideIcon;
  colorClass: string;
}

export function StatCard({ label, value, subLabel, icon: Icon, colorClass }: StatCardProps) {
  return (
    <div className={`${colorClass} relative overflow-hidden rounded-lg shadow-sm p-4 cursor-default group flex justify-between items-start`}>
      <div className="flex flex-col text-white min-w-0 flex-1 pr-3">
        <div className="text-2xl font-bold tracking-tight mb-1 truncate">{value}</div>
        <p className="text-xs font-medium text-slate-100 opacity-90 truncate">{label}</p>
      </div>
      <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-white transition-transform group-hover:scale-110 duration-500" strokeWidth={2} />
      </div>
    </div>
  );
}
