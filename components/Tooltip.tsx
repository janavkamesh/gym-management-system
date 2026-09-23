'use client';

import { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export default function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="group relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <div 
        className={`absolute left-1/2 -translate-x-1/2 z-50 px-2 py-1 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-120 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
      >
        {content}
      </div>
    </div>
  );
}
