import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  icon: LucideIcon;
  variant: 'blue' | 'green' | 'yellow' | 'red';
}

export function StatCard({ title, value, icon: Icon, variant }: StatCardProps) {
  const gradientClass = `card-gradient-${variant}`;
  
  return (
    <div className={`${gradientClass} relative overflow-hidden rounded-lg shadow-sm p-4 cursor-default group`}>
      <div className="relative z-10 flex flex-col text-white">
        <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
        <p className="text-xs font-medium text-slate-100 opacity-90">{title}</p>
      </div>
      <Icon 
        size={56} 
        className="absolute right-4 top-1/2 -translate-y-1/2 z-0 transition-transform group-hover:scale-110 duration-500 text-white opacity-[0.15]" 
        strokeWidth={1.5}
      />
    </div>
  );
}
