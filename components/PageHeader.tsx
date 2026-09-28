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
    <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center -mt-2 md:-mt-4 gap-4 ${className}`}>
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-1">{title}</h1>
        <p className="text-sm text-slate-500 hidden md:block">{subtitle}</p>
      </div>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
