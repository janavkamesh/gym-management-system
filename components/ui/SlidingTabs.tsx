import React, { useRef, useState, useEffect } from 'react';

interface SlidingTabsProps {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  activeColorClass?: string;
  containerClassName?: string;
  buttonClassName?: string;
}

export function SlidingTabs({ 
  options, 
  value, 
  onChange, 
  activeColorClass = 'bg-navy',
  containerClassName = 'w-full max-w-sm mx-auto h-14',
  buttonClassName = 'min-h-12 flex-1'
}: SlidingTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateIndicator = () => {
    if (!containerRef.current) return;
    const activeIndex = options.indexOf(value);
    const buttons = containerRef.current.querySelectorAll('button');
    if (!buttons || buttons.length === 0) return;
    const activeButton = buttons[activeIndex];
    
    if (activeButton) {
      setIndicatorStyle({
        width: activeButton.offsetWidth,
        left: activeButton.offsetLeft,
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(updateIndicator, 10);
    return () => clearTimeout(timer);
  }, [value, options, mounted]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [value, options]);

  return (
    <div 
      ref={containerRef}
      className={`flex relative bg-slate-100 rounded-lg p-1 overflow-x-auto hide-scrollbar touch-manipulation items-center ${containerClassName}`}
    >
      <div 
        className={`absolute top-1 bottom-1 ${activeColorClass} rounded-md shadow-sm transition-transform duration-180 ease-out motion-reduce:transition-none`}
        style={{
          width: `${indicatorStyle.width}px`,
          transform: `translateX(${indicatorStyle.left}px)`,
          opacity: indicatorStyle.width > 0 ? 1 : 0
        }}
      />
      {options.map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`relative z-10 px-3 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center justify-center active:scale-95 touch-manipulation ${buttonClassName} ${
              isActive 
                ? 'text-white' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
