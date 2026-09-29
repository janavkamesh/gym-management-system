import React, { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  headerAction?: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children, footer, headerAction }: BottomSheetProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = React.useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsAnimatingOut(false);
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    } else if (isVisible) {
      setIsAnimatingOut(true);
      document.body.style.overflow = '';
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimatingOut(false);
      }, 220); // Fallback timeout for exit animation
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!mounted || !isVisible) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-100 flex items-end justify-center transition-opacity duration-180 ease-in motion-reduce:transition-none ${isAnimatingOut ? 'opacity-0' : 'opacity-100'} bg-slate-900/50`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bottom-sheet-title"
    >
      <div 
        className={`bg-white rounded-t-2xl shadow-2xl w-full max-w-4xl max-h-[85dvh] flex flex-col transition-transform duration-180 ease-in motion-reduce:transition-none ${isAnimatingOut ? 'translate-y-full' : 'translate-y-0 animate-slide-up'}`}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={(e) => {
          if (isAnimatingOut && e.target === e.currentTarget && e.propertyName === 'transform') {
            setIsVisible(false);
            setIsAnimatingOut(false);
          }
        }}
      >
        <div className="flex justify-between items-center px-4 py-3 shrink-0 border-b border-slate-200 min-h-15">
          <h2 id="bottom-sheet-title" className="text-lg font-semibold text-slate-900">{title}</h2>
          <div className="flex items-center gap-2">
            {headerAction}
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center active:scale-95 touch-manipulation"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain px-4 py-2 flex-1 min-h-0">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 px-4 py-3 border-t border-slate-200 bg-white pb-[max(16px,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
