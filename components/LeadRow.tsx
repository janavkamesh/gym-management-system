'use client';

import { useState, useRef, useEffect } from 'react';
import { updateLeadOutcome } from '@/lib/actions/leads';
import { useToast } from './ToastProvider';
import { ChevronDown, MessageCircle } from 'lucide-react';

export default function LeadRow({ lead }: { lead: any }) {
  const [outcome, setOutcome] = useState(lead.outcome);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const outcomes = ['Pending', 'Joined', 'Not Interested', 'No Response'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const formatWhatsApp = (phone: string) => `https://wa.me/91${phone}`;

  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 md:px-6 py-4">
        <div className="font-medium text-slate-900 truncate max-w-[150px] md:max-w-[200px]" title={lead.name}>
          {lead.name}
        </div>
      </td>
      <td className="px-4 md:px-6 py-4 text-slate-600">
        {lead.phone}
      </td>
      <td className="px-4 md:px-6 py-4 text-slate-600">
        {new Date(lead.promised_date).toLocaleDateString('en-GB')}
      </td>
      <td className="px-4 md:px-6 py-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border min-h-[48px] md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors ${getOutcomeColor(outcome)} ${isUpdating ? 'opacity-50 cursor-wait' : 'hover:opacity-80 active:scale-95 touch-manipulation'}`}
          >
            {isUpdating ? 'Updating...' : outcome}
            <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-20 left-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              <ul className="py-1 flex flex-col">
                {outcomes.map((opt) => (
                  <li key={opt}>
                    <button
                      onClick={() => handleOutcomeChange(opt)}
                      className={`w-full text-left px-4 min-h-[48px] md:min-h-0 py-3 md:py-2 text-sm hover:bg-slate-50 transition-colors ${outcome === opt ? 'font-medium bg-slate-50' : 'text-slate-700'}`}
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </td>
      <td className="px-4 md:px-6 py-4 text-right">
        <a 
          href={formatWhatsApp(lead.phone)}
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 hover:bg-green-100 text-slate-600 hover:text-green-600 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-green-600"
          title="Message on WhatsApp"
        >
          <MessageCircle size={18} />
        </a>
      </td>
    </tr>
  );
}
