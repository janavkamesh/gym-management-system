'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, LogOut } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gymName: string;
  ownerName: string;
  onSignOut: () => void;
}

export default function MobileDrawer({ isOpen, onClose, gymName, ownerName, onSignOut }: MobileDrawerProps) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        onClose();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, onClose]);

  const initial = ownerName ? ownerName.charAt(0).toUpperCase() : 'A';

  return (
    <>
      {/* Overlay */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer Panel */}
      <div 
        id="mobile-drawer"
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
        aria-hidden={!isOpen}
        inert={isOpen ? undefined : true}
        className={`lg:hidden fixed inset-y-0 left-0 w-[min(80vw,320px)] bg-navy z-[60] flex flex-col transition-transform duration-200 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="pt-safe flex flex-col h-full">
          {/* Header section with User Info */}
          <div className="p-6 border-b border-slate-700/50 flex items-center gap-4 shrink-0">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold text-white shrink-0">
              {initial}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base font-medium text-white truncate">{ownerName}</span>
              <span className="text-sm text-slate-400">Gym Owner</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4 px-4">
            <Link
              href="/activity-logs"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors h-[48px] ${
                pathname === '/activity-logs' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <ClipboardList size={20} />
              Activity Logs
            </Link>
          </div>

          {/* Footer Sign Out */}
          <div className="p-4 border-t border-slate-700/50 pb-safe shrink-0">
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors min-h-[48px] active:scale-95"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
