'use client';

import { useState, useEffect, useRef } from 'react';

interface RollingSubtextProps {
  items: string[];
  staticText: string;
}

export function RollingSubtext({ items, staticText }: RollingSubtextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
    setCurrentIndex(0);
  }, [items]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (isHovered || items.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % itemsRef.current.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isHovered, items.length]);

  if (items.length === 0) {
    return <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />;
  }

  return (
    <div 
      className="relative h-5 overflow-hidden w-full flex items-center"
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-live="off"
    >
      <span className="sr-only">{staticText}</span>
      <div 
        className="block motion-reduce:hidden h-full w-full relative" 
        aria-hidden="true"
      >
        {items.map((item, index) => {
          const isActive = index === currentIndex;
          const isPrev = index === (currentIndex - 1 + items.length) % items.length && items.length > 1;
          const isNext = index === (currentIndex + 1) % items.length && items.length > 1;
          
          let transformClass = 'translate-y-full opacity-0';
          if (isActive) transformClass = 'translate-y-0 opacity-100';
          else if (isPrev) transformClass = '-translate-y-full opacity-0';

          // we want items to "roll up"
          // old text moves up (-translate-y-full), new text rises in from below (translate-y-full -> 0)
          
          return (
            <div 
              key={`${item}-${index}`}
              className={`absolute left-0 right-0 top-0 truncate transition-all duration-180 ease-out ${transformClass}`}
            >
              {item}
            </div>
          );
        })}
      </div>
      <div className="hidden motion-reduce:block truncate w-full" aria-hidden="true">
        {staticText}
      </div>
    </div>
  );
}
