'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateLeadOutcome } from '@/lib/actions/leads';
import { useToast } from './ToastProvider';
import { ChevronDown, Phone } from 'lucide-react';
import Tooltip from './Tooltip';
import { cleanPhone } from '@/lib/utils/whatsapp';
import { WhatsAppIcon } from './MemberRow';

export default function LeadRow({ lead }: { lead: any }) {
  const [outcome, setOutcome] = useState(lead.outcome);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, flip: false });
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const outcomes = ['Pending', 'Joined', 'Not Interested', 'No Response'];

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    const menuWidth = Math.max(192, rect.width);
    const menuHeight = outcomes.length * 48 + 16;
    
    const flip = rect.bottom + menuHeight > windowHeight && rect.top > menuHeight;
    
    let left = rect.left;
    if (left + menuWidth > windowWidth - 16) {
      left = windowWidth - menuWidth - 16;
    }
    
    setDropdownPos({
      top: flip ? rect.top - 8 : rect.bottom + 8,
      left: left,
      width: menuWidth,
      flip
    });
  };

  useEffect(() => {
    if (!isDropdownOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (buttonRef.current?.contains(event.target as Node)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    }

    const handleScrollOrResize = () => setIsDropdownOpen(false);
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isDropdownOpen]);

  const handleOutcomeChange = async (newOutcome: string) => {
    if (newOutcome === outcome) {
      setIsDropdownOpen(false);
      return;
    }
    
    setIsUpdating(true);
    try {
      await updateLeadOutcome(lead.id, newOutcome);
      setOutcome(newOutcome);
      showToast('Outcome updated', 'success');
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    } finally {
      setIsUpdating(false);
      setIsDropdownOpen(false);
    }
  };

  const getOutcomeColor = (val: string) => {
    switch (val) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Joined': return 'bg-green-100 text-green-800 border-green-200';
      case 'Not Interested': return 'bg-red-100 text-red-800 border-red-200';
      case 'No Response': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };


  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 md:px-6 py-4">
        <Tooltip content={lead.name} position="bottom">
          <div className="font-medium text-slate-900 truncate max-w-37.5 md:max-w-50 cursor-default">
            {lead.name}
          </div>
        </Tooltip>
      </td>
      <td className="px-4 md:px-6 py-4 text-slate-600">
        {lead.phone}
      </td>
      <td className="px-4 md:px-6 py-4 text-slate-600">
        {new Date(lead.promised_date).toLocaleDateString('en-GB')}
      </td>
      <td className="px-4 md:px-6 py-4">
        <div>
          <button
            ref={buttonRef}
            onClick={() => {
              if (!isDropdownOpen) {
                updatePosition();
              }
              setIsDropdownOpen(!isDropdownOpen);
            }}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors ${getOutcomeColor(outcome)} ${isUpdating ? 'opacity-50 cursor-wait' : 'hover:opacity-80 active:scale-95 touch-manipulation'}`}
          >
            {isUpdating ? 'Updating...' : outcome}
            <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {mounted && isDropdownOpen && createPortal(
            <div 
              ref={dropdownRef}
              className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-120"
              style={{
                top: dropdownPos.flip ? 'auto' : dropdownPos.top,
                bottom: dropdownPos.flip ? window.innerHeight - dropdownPos.top : 'auto',
                left: dropdownPos.left,
                width: dropdownPos.width,
              }}
            >
              <ul className="py-1 flex flex-col">
                {outcomes.map((opt) => (
                  <li key={opt}>
                    <button
                      onClick={() => handleOutcomeChange(opt)}
                      className={`w-full text-left px-4 min-h-12 md:min-h-0 py-3 md:py-2 text-sm hover:bg-slate-50 transition-colors ${outcome === opt ? 'font-medium bg-slate-50' : 'text-slate-700'}`}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            </div>,
            document.body
          )}
        </div>
      </td>
      <td className="px-4 md:px-6 py-4 text-center">
        <Tooltip content="Call Lead">
          <a 
            href={`tel:+${cleanPhone(lead.phone)}`}
            className="inline-flex items-center justify-center min-h-12 min-w-12 md:min-h-9 md:min-w-9 p-2 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors touch-manipulation active:scale-95 duration-120"
          >
            <Phone size={18} />
          </a>
        </Tooltip>
      </td>
      <td className="px-4 md:px-6 py-4 text-center">
        <Tooltip content="Message on WhatsApp">
          <a 
            href={`https://wa.me/${cleanPhone(lead.phone)}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-12 min-w-12 md:min-h-9 md:min-w-9 p-2 rounded-md bg-green-50 hover:bg-green-100 text-green-600 transition-colors touch-manipulation active:scale-95 duration-120"
          >
            <WhatsAppIcon size={18} />
          </a>
        </Tooltip>
      </td>
    </tr>
  );
}
