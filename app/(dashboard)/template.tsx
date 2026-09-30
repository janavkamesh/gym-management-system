'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useState } from 'react';

const useSafeLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const TAB_ORDER = ['/', '/members', '/leads', '/trainers', '/financials'];

const getIndex = (path: string) => {
  const idx = TAB_ORDER.findIndex(t => t === '/' ? path === '/' : path.startsWith(t));
  return idx === -1 ? 99 : idx;
};

let isGlobalFirstLoad = true;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animationClass, setAnimationClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  useSafeLayoutEffect(() => {
    let prevPath = '';
    try {
      prevPath = sessionStorage.getItem('lastPathname') || '';
      sessionStorage.setItem('lastPathname', pathname);
    } catch(e) {}
    
    if (isGlobalFirstLoad) {
      isGlobalFirstLoad = false;
      return;
    }
    
    if (prevPath && prevPath !== pathname && window.innerWidth < 1024) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) return;

      const prevIdx = getIndex(prevPath);
      const currIdx = getIndex(pathname);
      
      const isBackward = currIdx < prevIdx;
      
      setAnimationClass(isBackward ? 'animate-page-slide-left' : 'animate-page-slide-right');
      setIsAnimating(true);
    }
  }, [pathname]);

  return (
    <div className={`flex-1 flex flex-col w-full min-w-0 ${isAnimating ? 'overflow-x-clip' : ''}`}>
      <div 
        className={`flex-1 flex flex-col w-full min-w-0 ${animationClass}`}
        onAnimationEnd={() => {
          setIsAnimating(false);
          setAnimationClass('');
        }}
      >
        {children}
      </div>
    </div>
  );
}
