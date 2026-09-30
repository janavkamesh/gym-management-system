'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const TABS = ['/', '/members', '/leads', '/trainers', '/financials'];

export default function SwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only active on the five tab pages
    const currentIndex = TABS.indexOf(pathname);
    if (currentIndex === -1) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let isSwiping = false;
    let isValidStart = true;

    const handleTouchStart = (e: TouchEvent) => {
      // Check if starting near edge (browser back/forward gesture zone)
      const touch = e.touches[0];
      if (touch.clientX < 30 || touch.clientX > window.innerWidth - 30) {
        isValidStart = false;
        return;
      }

      // Check if modal, sheet, or drawer is open
      if (document.querySelector('[role="dialog"]') || document.querySelector('[aria-modal="true"]')) {
        isValidStart = false;
        return;
      }

      // Check if target is inside an input, textarea, or horizontally scrollable area
      let target = e.target as HTMLElement | null;
      while (target && target !== document.body) {
        const tag = target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') {
          isValidStart = false;
          return;
        }
        
        // Horizontal scroll check
        const style = window.getComputedStyle(target);
        const overflowX = style.overflowX;
        if ((overflowX === 'auto' || overflowX === 'scroll') && target.scrollWidth > target.clientWidth) {
          isValidStart = false;
          return;
        }
        target = target.parentElement;
      }

      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
      isSwiping = true;
      isValidStart = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwiping || !isValidStart) {
        isSwiping = false;
        return;
      }
      isSwiping = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      const deltaTime = Date.now() - startTime;

      // Check if mostly vertical
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      // Check distance and speed
      if (Math.abs(deltaX) > 60 && deltaTime < 400) {
        if (deltaX > 0 && currentIndex > 0) {
          // Swipe right -> previous tab
          router.push(TABS[currentIndex - 1]);
        } else if (deltaX < 0 && currentIndex < TABS.length - 1) {
          // Swipe left -> next tab
          router.push(TABS[currentIndex + 1]);
        }
      }
    };

    const handleTouchCancel = () => {
      isSwiping = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [pathname, router]);

  return null;
}
