import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalHeaderProps {
  title: ReactNode;
  onClose: () => void;
  headerAction?: ReactNode;
  variant?: 'dark' | 'light' | 'filters' | 'mobile-light';
}

export function ModalHeader({ title, onClose, headerAction, variant = 'dark' }: ModalHeaderProps) {
  const isLight = variant === 'light';
  const isFilters = variant === 'filters';
  const isMobileLight = variant === 'mobile-light';

  const isMobileWhite = variant === 'dark' || variant === 'mobile-light';

  return (
    <div className={`flex flex-col shrink-0 w-full max-md:rounded-t-2xl md:bg-slate-900 ${
      isLight ? 'max-md:bg-transparent' : 
      isFilters ? 'max-md:bg-white' : 
      isMobileWhite ? 'max-md:bg-white max-md:border-b max-md:border-slate-200' : 
      'max-md:bg-slate-900'
    }`}>
      <div aria-hidden="true" className="md:hidden mx-auto w-[36px] h-[4px] rounded-full bg-slate-300 mt-2 mb-2 shrink-0" />
      <div className={`flex justify-between items-center px-6 shrink-0 md:pb-4 md:pt-2 md:min-h-15 md:py-4 ${isLight ? 'max-md:pb-3 max-md:pt-1 max-md:min-h-14' : 'max-md:pb-4 max-md:pt-2 max-md:min-h-15'}`}>
      <h2 id="bottom-sheet-title" className={`text-xl font-semibold md:text-white ${
        isLight || isFilters ? 'max-md:text-slate-900' : 
        isMobileWhite ? 'max-md:text-slate-900' : 
        'max-md:text-white'
      }`}>{title}</h2>
      <div className="flex items-center gap-2">
        {headerAction}
        <button 
          onClick={onClose} 
          className="relative flex items-center justify-center transition-all duration-120 touch-manipulation active:scale-95 md:rounded-full md:p-2 md:min-h-12 md:min-w-12 md:text-slate-400 md:hover:text-white md:hover:bg-slate-800 max-md:w-9 max-md:h-9 max-md:rounded-full max-md:bg-white max-md:border max-md:border-slate-200 max-md:shadow-sm max-md:before:absolute max-md:before:-inset-1.5 max-md:text-slate-600"
          aria-label="Close"
        >
          <X className="max-md:w-[18px] max-md:h-[18px] md:w-5 md:h-5 transition-transform duration-120" />
        </button>
      </div>
      </div>
    </div>
  );
}
