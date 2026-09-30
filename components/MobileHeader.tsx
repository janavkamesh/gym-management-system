'use client';

import { Menu } from 'lucide-react';

interface MobileHeaderProps {
  gymName: string;
  ownerName: string;
  onOpenDrawer: () => void;
}

export default function MobileHeader({ gymName, ownerName, onOpenDrawer }: MobileHeaderProps) {
  const initial = ownerName ? ownerName.charAt(0).toUpperCase() : 'A';

  return (
    <header className="lg:hidden fixed top-0 inset-x-0 z-40 bg-navy pt-safe h-[var(--header-h)] border-b border-slate-700/50">
      <div className="flex items-center h-[56px] px-4 gap-3">
        <button
          onClick={onOpenDrawer}
          aria-label="Open menu"
          aria-expanded={false}
          aria-controls="mobile-drawer"
          className="w-10 h-10 min-w-[44px] min-h-[44px] flex-shrink-0 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm font-bold text-white shadow-sm active:scale-95 transition-transform"
        >
          {initial}
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-base font-semibold text-white tracking-tight truncate block">
            {gymName}
          </span>
        </div>
      </div>
    </header>
  );
}
