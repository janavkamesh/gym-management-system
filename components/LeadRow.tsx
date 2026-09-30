'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateLeadOutcome } from '@/lib/actions/leads';
import { logActivity } from '@/lib/activity-log';
import { useToast } from './ToastProvider';
import { ChevronDown, Phone } from 'lucide-react';
import Tooltip from './Tooltip';
import { cleanPhone } from '@/lib/utils/whatsapp';
import { WhatsAppIcon } from './MemberRow';
import { BottomSheet } from './ui/BottomSheet';
import { isClosedOutcome } from '@/lib/utils/leads';

export default function LeadRow({ lead, isDesktop = true }: { lead: any, isDesktop?: boolean }) {
  const [outcome, setOutcome] = useState(lead.outcome);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0, flip: false });
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const lastWaClick = useRef<number>(0);

  const handleWaClick = () => {
    const now = Date.now();
    if (now - lastWaClick.current > 3000) {
      lastWaClick.current = now;
      logActivity({
        category: 'WhatsApp',
        action: 'WhatsApp opened',
        description: `Opened WhatsApp chat for ${lead.name}`,
        entityType: 'lead',
        entityId: lead.id,
        entityName: lead.name
      }).catch(console.error);
    }
  };

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
    setIsDropdownOpen(false);
    if (newOutcome === outcome) {
      return;
    }
    
    setIsUpdating(true);
    try {
      await updateLeadOutcome(lead.id, newOutcome);
      
      const wasClosed = isClosedOutcome(outcome);
      const isNowClosed = isClosedOutcome(newOutcome);
      
      setOutcome(newOutcome);
      
      if (!wasClosed && isNowClosed) {
        showToast('Lead moved to Closed', 'success');
      } else if (wasClosed && !isNowClosed) {
        showToast('Lead moved to Active', 'success');
      } else {
        showToast('Outcome updated', 'success');
      }
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    } finally {
      if (mounted) {
        setIsUpdating(false);
      }
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


  const formatShortDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const currYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = months[m];
    let res = `${d} ${monthStr}`;
    if (y !== currYear) res += ` ${y}`;
    return res;
  };

  const outcomeDropdown = (
    <div className="relative flex items-center justify-center w-full">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDropdownOpen) {
            updatePosition();
          }
          setIsDropdownOpen(!isDropdownOpen);
        }}
        disabled={isUpdating}
        style={{ height: '34px' }}
        className={`relative after:absolute after:-inset-y-2 after:-inset-x-2 after:content-[''] flex items-center gap-2 px-3 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors ${getOutcomeColor(outcome)} ${isUpdating ? 'opacity-50 cursor-wait' : 'hover:opacity-80 active:scale-95 touch-manipulation'}`}
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
                  onClick={(e) => { e.stopPropagation(); handleOutcomeChange(opt); }}
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
  );

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (!isDesktop) {
    return (
      <>
        <div 
          className="mobile-lead-grid mobile-table-row cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => setIsSheetOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsSheetOpen(true);
            }
          }}
        >
          <div className="flex flex-col min-w-0 pr-2">
            <span className="mobile-table-name">{lead.name}</span>
          </div>
          <div className="flex flex-col min-w-0 pr-2">
            <span className="mobile-table-sub">{lead.phone}</span>
          </div>
          <div className="flex flex-col min-w-0 pr-2">
            <span className="mobile-table-sub">{formatShortDate(lead.promised_date)}</span>
          </div>
          <div className="text-center justify-self-center min-w-0 flex items-center justify-center">
            {outcomeDropdown}
          </div>
        </div>
        
        <BottomSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          title={lead.name}
        >
          <div className="p-4 space-y-4 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 font-medium">Phone Number</span>
              <span className="text-slate-900 text-base">{lead.phone}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 font-medium">Promised Date</span>
              <span className="text-slate-900 text-base">{formatShortDate(lead.promised_date)} {new Date().getFullYear()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 font-medium mb-1">Outcome</span>
              <span className={`inline-flex items-center self-start px-2.5 py-1 rounded-full text-xs font-medium border ${getOutcomeColor(outcome)}`}>
                {outcome}
              </span>
            </div>
          </div>
          <div className="p-4 border-t border-slate-200 grid grid-cols-2 gap-3 pb-safe">
            <a 
              href={`tel:+${cleanPhone(lead.phone)}`}
              className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-3 rounded-lg font-medium transition-colors touch-manipulation active:scale-95"
              aria-label={`Call ${lead.name}`}
            >
              <Phone size={18} />
              Call
            </a>
            <a 
              href={`https://wa.me/${cleanPhone(lead.phone)}`}
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleWaClick}
              className="flex items-center justify-center gap-2 bg-green-50 text-green-600 hover:bg-green-100 py-3 rounded-lg font-medium transition-colors touch-manipulation active:scale-95"
              aria-label={`Message ${lead.name} on WhatsApp`}
            >
              <WhatsAppIcon size={18} />
              WhatsApp
            </a>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 md:px-6 py-4 text-left">
        <Tooltip content={lead.name} position="bottom">
          <div className="font-medium text-slate-900 truncate max-w-37.5 md:max-w-50 cursor-default">
            {lead.name}
          </div>
        </Tooltip>
      </td>
      <td className="px-4 md:px-6 py-4 text-left text-slate-600">
        {lead.phone}
      </td>
      <td className="px-4 md:px-6 py-4 text-left text-slate-600">
        {formatShortDate(lead.promised_date)}
      </td>
      <td className="px-4 md:px-6 py-2 text-left">
        {outcomeDropdown}
      </td>
      <td className="px-4 md:px-6 py-4 text-center">
        <Tooltip content="Call Lead">
          <a 
            href={`tel:+${cleanPhone(lead.phone)}`}
            className="mobile-table-btn bg-blue-50 hover:bg-blue-100 text-blue-600"
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
            onClick={handleWaClick}
            className="mobile-table-btn bg-green-50 hover:bg-green-100 text-green-600"
          >
            <WhatsAppIcon size={18} />
          </a>
        </Tooltip>
      </td>
    </tr>
  );
}
