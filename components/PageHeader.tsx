import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
  hidden?: boolean;
  className?: string;
}

export default function PageHeader({ title, subtitle, action, hidden = false, className = '' }: PageHeaderProps) {
  if (hidden) return null;

  return (
    <div className={`flex flex-row justify-between items-center gap-4 ${className}`}>
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-0 lg:mb-1 truncate">{title}</h1>
        <p className="text-sm text-slate-500 hidden lg:block truncate">{subtitle}</p>
      </div>
      {action && (
        <div className="shrink-0 flex items-center">
          {action}
        </div>
      )}
    </div>
  );
}
