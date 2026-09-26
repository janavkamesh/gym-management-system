'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createExpense } from '@/lib/actions/expenses';
import { useToast } from './ToastProvider';
import { X, Upload, Info, ChevronDown } from 'lucide-react';
import Tooltip from './Tooltip';
import { DatePicker } from './DatePicker';

export default function AddExpenseModal({ isOpen, onClose, onSuccess, initialCategory }: { isOpen: boolean; onClose: () => void; onSuccess: (expense: any) => void; initialCategory?: string }) {
  const [category, setCategory] = useState('');
  
  useEffect(() => {
    if (isOpen && initialCategory) {
      // Find case-insensitive match for category to match predefined categories
      const predefinedCategories = ['Rent', 'Electricity', 'Salaries', 'Maintenance', 'Equipment', 'Other'];
      const matched = predefinedCategories.find(c => c.toLowerCase() === initialCategory.toLowerCase());
      setCategory(matched || initialCategory);
    }
  }, [isOpen, initialCategory]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest?.('#category-dropdown-portal')
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const isValid = category.trim() !== '' && Number(amount) > 0 && date !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const expense = await createExpense({
        category: category.trim(),
        amount: Number(amount),
        recurring_flag: isRecurring,
        date: date,
        // Receipt URL omitted for now, setup pending
      });
      onSuccess(expense);
      onClose();
      // Reset
      setCategory('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const predefinedCategories = ['Rent', 'Electricity', 'Salaries', 'Maintenance', 'Equipment', 'Other'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onPointerDown={onClose}></div>
      <div className="relative bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 md:fade-in duration-200 z-10 max-h-90vh flex flex-col">
        
        <div className="flex items-center justify-between px-6 py-4 shrink-0 bg-slate-900">
          <h2 className="text-xl font-semibold text-white">Add Expense</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 transition-all duration-120 rounded-full p-2 md:p-1.5 touch-manipulation min-h-12 min-w-12 md:min-h-8 md:min-w-8 flex items-center justify-center">
            <X size={24} className="md:w-5 md:h-5 transition-transform duration-120" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-5">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg min-h-12 bg-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                >
                  <span className={category ? 'text-slate-900' : 'text-slate-400'}>
                    {category ? category : 'Select category'}
                  </span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && typeof document !== 'undefined' && createPortal(
                  <div 
                    id="category-dropdown-portal"
                    className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-md max-h-60 overflow-y-auto mt-1"
                    style={{
                      top: dropdownRef.current?.getBoundingClientRect().bottom,
                      left: dropdownRef.current?.getBoundingClientRect().left,
                      width: dropdownRef.current?.getBoundingClientRect().width,
                    }}
                  >
                    <ul className="py-1">
                      {predefinedCategories.map(cat => (
                        <li key={cat}>
                          <button
                            type="button"
                            onClick={() => {
                              setCategory(cat);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 md:py-2 text-sm hover:bg-slate-50 transition-colors text-slate-900"
                          >
                            {cat}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>,
                  document.body
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                min="1"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <DatePicker
                value={date}
                onChange={setDate}
              />
            </div>

            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input 
                type="checkbox" 
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">Recurring Monthly Expense</span>
            </label>

            {/* Receipt Upload Placeholder */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Receipt Photo</label>
              <div className="relative group">
                <div className="w-full border-2 border-dashed border-slate-200 rounded-lg px-4 py-6 bg-slate-50 flex flex-col items-center justify-center opacity-70 cursor-not-allowed">
                  <Upload size={24} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500 font-medium">Upload feature coming soon</span>
                </div>
                <Tooltip content="Supabase Storage bucket setup pending">
                  <div className="absolute top-2 right-2 text-slate-400">
                    <Info size={16} />
                  </div>
                </Tooltip>
              </div>
            </div>

          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex justify-center items-center h-11 active:scale-98"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Save Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
