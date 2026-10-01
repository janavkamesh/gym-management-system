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
  activeColorClass = 'bg-navy shadow-sm text-white',
  containerClassName = 'w-full lg:w-auto h-10 lg:h-auto overflow-x-auto hide-scrollbar touch-manipulation items-center',
  buttonClassName = 'flex-1 lg:flex-none px-4 h-full lg:h-auto lg:py-2'
}: SlidingTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);

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
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    }
  };

  useEffect(() => {
    updateIndicator();
    let active = true;
    
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (active) updateIndicator();
      });
    }

    const timer = setTimeout(updateIndicator, 10);
    return () => {
      active = false;
      clearTimeout(timer);
    };
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
        className={`absolute left-0 top-1 bottom-1 ${activeColorClass} rounded-md shadow-sm ${isReady ? 'transition-transform duration-180 ease-out motion-reduce:transition-none' : ''}`}
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
