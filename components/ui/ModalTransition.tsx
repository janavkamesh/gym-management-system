import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSwipeClose } from '@/hooks/useSwipeClose';

interface ModalTransitionProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  containerClassName?: string;
  overlayClassName?: string;
  isCenteredDesktop?: boolean;
  mobileFixed?: boolean;
}

export function ModalTransition({ isOpen, onClose, children, containerClassName = '', overlayClassName = 'z-50', isCenteredDesktop = true, mobileFixed = false }: ModalTransitionProps) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const confirmDialog = useSwipeClose({ isOpen, onClose, sheetRef });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
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
      if (previousFocusRef.current) previousFocusRef.current.focus();
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimatingOut(false);
      }, 220); // Fallback timeout for exit animation
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!mounted || !isVisible) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 ${overlayClassName} flex flex-col justify-end ${isCenteredDesktop ? 'md:justify-center md:items-center' : 'items-center'} transition-opacity duration-180 ease-in motion-reduce:transition-none ${isAnimatingOut ? 'opacity-0' : 'opacity-100'} bg-slate-900/50`}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        ref={sheetRef}
        className={`transition-transform duration-180 ease-in motion-reduce:transition-none ${isAnimatingOut ? (isCenteredDesktop ? 'translate-y-[200%] md:translate-y-0 md:opacity-0' : 'translate-y-full') : (isCenteredDesktop ? 'animate-slide-up md:animate-fade-in' : 'animate-slide-up')} ${mobileFixed ? 'max-md:!h-[85dvh] max-md:!max-h-[85dvh] max-md:mt-auto max-md:[&_.overflow-y-auto]:[scrollbar-width:none] max-md:[&_.overflow-y-auto::-webkit-scrollbar]:hidden' : ''} ${containerClassName}`}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={(e) => {
          if (isAnimatingOut && e.target === e.currentTarget && e.propertyName === 'transform') {
            setIsVisible(false);
            setIsAnimatingOut(false);
          }
        }}
      >
        {confirmDialog}
        {children}
      </div>
    </div>,
    document.body
  );
}
