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
    <div className={`flex flex-col shrink-0 w-full max-lg:rounded-t-2xl ${
      isLight ? 'bg-transparent' : 
      isFilters ? 'bg-white' : 
      isMobileWhite ? 'max-lg:bg-white lg:bg-slate-900 max-lg:border-b max-lg:border-slate-200' : 
      'bg-slate-900'
    }`}>
      <div aria-hidden="true" className="lg:hidden mx-auto w-[36px] h-[4px] rounded-full bg-slate-300 mt-2 mb-2 shrink-0" />
      <div className={`flex justify-between items-center px-6 shrink-0 ${isLight ? 'pb-3 pt-1 min-h-14 lg:py-3' : isFilters ? 'pb-4 pt-2 min-h-15 lg:py-4' : 'pb-4 pt-2 min-h-15 lg:py-4'}`}>
      <h2 id="bottom-sheet-title" className={`text-xl font-semibold ${
        isLight || isFilters ? 'text-slate-900' : 
        isMobileWhite ? 'max-lg:text-slate-900 lg:text-white' : 
        'text-white'
      }`}>{title}</h2>
      <div className="flex items-center gap-2">
        {headerAction}
        <button 
          onClick={onClose} 
          className={`relative flex items-center justify-center transition-all duration-120 touch-manipulation active:scale-95 max-lg:w-9 max-lg:h-9 max-lg:rounded-full max-lg:bg-slate-100 max-lg:border max-lg:border-slate-200 max-lg:shadow-sm max-lg:before:absolute max-lg:before:-inset-1.5 lg:rounded-full lg:p-2 lg:min-h-12 lg:min-w-12 ${
            isLight || isFilters ? 'text-slate-400 lg:hover:text-slate-900 lg:hover:bg-slate-100/50' : 
            isMobileWhite ? 'max-lg:text-slate-600 text-slate-400 lg:hover:text-white lg:hover:bg-slate-800' :
            'text-slate-400 lg:hover:text-white lg:hover:bg-slate-800'
          }`}
          aria-label="Close"
        >
          <X className="max-lg:w-[18px] max-lg:h-[18px] lg:w-5 lg:h-5 transition-transform duration-120" />
        </button>
      </div>
      </div>
    </div>
  );
}
