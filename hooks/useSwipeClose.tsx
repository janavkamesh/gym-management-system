import { useEffect, useRef, useState } from 'react';

export function useSwipeClose({ 
  isOpen, 
  onClose, 
  sheetRef 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  sheetRef: React.RefObject<HTMLElement | null> 
}) {
  const initialValuesRef = useRef(new Map<Element, string | boolean>());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfirm(false);
      // Capture initial form values after a short delay to allow React to render
      const timer = setTimeout(() => {
        if (!sheetRef.current) return;
        const inputs = sheetRef.current.querySelectorAll('input, textarea, select');
        const vals = new Map();
        inputs.forEach(el => {
          if ((el as HTMLInputElement).type === 'checkbox' || (el as HTMLInputElement).type === 'radio') {
            vals.set(el, (el as HTMLInputElement).checked);
          } else {
            vals.set(el, (el as any).value);
          }
        });
        initialValuesRef.current = vals;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sheetRef]);

  const checkDirty = () => {
    if (!sheetRef.current) return false;
    // Only check if it's a form sheet
    if (sheetRef.current.querySelector('form') === null) return false;
    
    const inputs = sheetRef.current.querySelectorAll('input, textarea, select');
    for (const el of Array.from(inputs)) {
      const isCheck = (el as HTMLInputElement).type === 'checkbox' || (el as HTMLInputElement).type === 'radio';
      const currentVal = isCheck ? (el as HTMLInputElement).checked : (el as any).value;
      const initialVal = initialValuesRef.current.get(el);
      if (initialVal !== undefined && currentVal !== initialVal) {
        return true;
      }
    }
    return false;
  };

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    if (window.innerWidth >= 1024) return; // Disable at lg and above
    
    const sheet = sheetRef.current;
    if (!sheet) return;

    const overlay = sheet.parentElement;
    if (!overlay) return;

    let scroller = sheet.querySelector('.overflow-y-auto') as HTMLElement;
    if (!scroller) {
      // Fallback
      scroller = sheet;
    }

    // Apply necessary styles
    sheet.style.touchAction = 'pan-y';
    scroller.style.overscrollBehavior = 'contain';

    let startY = 0;
    let startX = 0;
    let currentY = 0;
    let startTime = 0;
    let isDragging = false;
    let isHorizontal = false;
    let validDrag = false;

    const onPointerDown = (e: PointerEvent) => {
      // Ignore if not left click / single touch
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      
      const target = e.target as HTMLElement;
      
      // Ignore text inputs, textareas, range sliders, date pickers
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.closest('.react-datepicker') ||
        target.closest('[role="slider"]')
      ) {
        return;
      }

      // Check if started horizontally scrolling element
      let el: HTMLElement | null = target;
      let hasHorizontalScroll = false;
      while (el && el !== sheet) {
        if (el.scrollWidth > el.clientWidth) {
          const style = window.getComputedStyle(el);
          if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
            hasHorizontalScroll = true;
            break;
          }
        }
        el = el.parentElement;
      }
      if (hasHorizontalScroll) return;

      // Ensure scroller is at top, OR touch started on grabber/header
      const isHeader = target.closest('.min-h-14, .min-h-15, [aria-hidden="true"]');
      if (scroller.scrollTop > 0 && !isHeader) return;

      startY = e.clientY;
      startX = e.clientX;
      startTime = Date.now();
      isDragging = true;
      isHorizontal = false;
      validDrag = true;
      
      sheet.style.transition = 'none';
      if (overlay) overlay.style.transition = 'none';
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !validDrag) return;

      const deltaY = e.clientY - startY;
      const deltaX = e.clientX - startX;

      if (!isHorizontal && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        isHorizontal = true;
        validDrag = false; // Cancel vertical drag
        return;
      }

      if (isHorizontal) return;

      // Only allow dragging down
      if (deltaY < 0) {
        currentY = 0;
      } else {
        currentY = deltaY;
      }

      // If we are dragging down, prevent default scrolling
      if (currentY > 0) {
        e.preventDefault();
      }

      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!isReducedMotion) {
        sheet.style.transform = `translateY(${currentY}px)`;
        const height = sheet.clientHeight;
        const opacity = Math.max(0, 1 - (currentY / height) * 1.5);
        if (overlay) overlay.style.opacity = `${opacity}`;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging || !validDrag) {
        isDragging = false;
        return;
      }
      isDragging = false;

      const deltaY = e.clientY - startY;
      const time = Date.now() - startTime;
      const velocity = deltaY / time;
      const height = sheet.clientHeight;

      const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (deltaY > height * 0.25 || velocity > 0.5) {
        // Trigger close
        if (checkDirty()) {
          // Snap back and show confirm
          snapBack(isReducedMotion);
          setShowConfirm(true);
        } else {
          // Proceed to close (do not snap back)
          if (!isReducedMotion) {
            sheet.style.transition = 'transform 200ms ease-out';
            sheet.style.transform = `translateY(100%)`;
            if (overlay) {
              overlay.style.transition = 'opacity 200ms ease-out';
              overlay.style.opacity = '0';
            }
          }
          // We wait a tiny bit for animation to start, then call onClose
          // (onClose usually triggers ModalTransition's own exit animation, which is fine)
          setTimeout(() => {
            onClose();
          }, isReducedMotion ? 0 : 50);
        }
      } else {
        // Snap back
        snapBack(isReducedMotion);
      }
    };

    const snapBack = (isReducedMotion: boolean) => {
      if (isReducedMotion) {
        sheet.style.transform = '';
        if (overlay) overlay.style.opacity = '';
      } else {
        sheet.style.transition = 'transform 200ms ease-out';
        sheet.style.transform = `translateY(0)`;
        if (overlay) {
          overlay.style.transition = 'opacity 200ms ease-out';
          overlay.style.opacity = '1';
        }
        setTimeout(() => {
          sheet.style.transition = '';
          sheet.style.transform = '';
          if (overlay) {
            overlay.style.transition = '';
            overlay.style.opacity = '';
          }
        }, 200);
      }
      currentY = 0;
    };

    sheet.addEventListener('pointerdown', onPointerDown);
    // Use window for move/up to catch drags outside the sheet
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      sheet.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      
      // Cleanup styles
      sheet.style.transition = '';
      sheet.style.transform = '';
      sheet.style.touchAction = '';
      if (scroller) scroller.style.overscrollBehavior = '';
      if (overlay) {
        overlay.style.transition = '';
        overlay.style.opacity = '';
      }
    };
  }, [isOpen, sheetRef, onClose]);

  const confirmDialog = showConfirm ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 animate-fade-in p-4 rounded-t-2xl md:rounded-2xl">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 animate-scale-up">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Discard changes?</h3>
        <p className="text-slate-600 text-sm mb-5">You have unsaved changes. Are you sure you want to discard them?</p>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowConfirm(false)}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Keep editing
          </button>
          <button 
            onClick={() => {
              setShowConfirm(false);
              onClose();
            }}
            className="flex-1 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return confirmDialog;
}
