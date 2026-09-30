import React, { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ModalHeader } from './ModalHeader';
import { useSwipeClose } from '@/hooks/useSwipeClose';

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
  const sheetRef = useRef<HTMLDivElement>(null);
  const confirmDialog = useSwipeClose({ isOpen, onClose, sheetRef });

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
        ref={sheetRef}
        className={`bg-white max-lg:rounded-t-2xl lg:rounded-t-2xl shadow-2xl w-full max-w-4xl max-h-[85dvh] flex flex-col transition-transform duration-180 ease-in motion-reduce:transition-none ${isAnimatingOut ? 'translate-y-full' : 'animate-slide-up'}`}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={(e) => {
          if (isAnimatingOut && e.target === e.currentTarget && e.propertyName === 'transform') {
            setIsVisible(false);
            setIsAnimatingOut(false);
          }
        }}
      >
        {confirmDialog}
        <ModalHeader title={title} onClose={onClose} headerAction={headerAction} variant={title === 'Filters' ? 'filters' : 'dark'} />

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
