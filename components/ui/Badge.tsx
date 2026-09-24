import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center justify-center whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}
