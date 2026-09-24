'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileTopBar() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="md:hidden fixed top-4 right-4 z-50">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-sm font-bold text-white shadow-md active:scale-95 transition-transform"
      >
        A
      </button>

      {mounted && isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed top-16 right-4 z-50 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden w-48 animate-in fade-in zoom-in-95 duration-120"
        >
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-sm font-medium text-slate-900">Admin</p>
            <p className="text-xs text-slate-500">Gym Owner</p>
          </div>
          <ul className="py-1">
            <li>
              <Link 
                href="/activity-logs"
                className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
              >
                Activity Logs
              </Link>
            </li>
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
