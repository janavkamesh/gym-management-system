'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createExpense } from '@/lib/actions/expenses';
import { useToast } from './ToastProvider';
import { X, ChevronDown } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';
import { getIndiaDateString } from '@/lib/utils/date';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (expense: any) => void;
  initialCategory?: string;
  initialAmount?: number;
  initialDate?: string;
  initialRecurring?: boolean;
}

export default function AddExpenseModal({ isOpen, onClose, onSuccess, initialCategory, initialAmount, initialDate, initialRecurring }: AddExpenseModalProps) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      if (initialCategory) {
        const predefinedCategories = ['Rent', 'Electricity', 'Salaries', 'Maintenance', 'Equipment', 'Other'];
        const matched = predefinedCategories.find(c => c.toLowerCase() === initialCategory.toLowerCase());
        setCategory(matched || initialCategory);
      } else {
        setCategory('');
      }
      setAmount(initialAmount ? initialAmount.toString() : '');
      setDate(initialDate || getIndiaDateString());
      setIsRecurring(initialRecurring || false);
    }
  }, [isOpen, initialCategory, initialAmount, initialDate, initialRecurring]);

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
      setDate(getIndiaDateString());
      setIsRecurring(false);
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const predefinedCategories = ['Rent', 'Electricity', 'Salaries', 'Maintenance', 'Equipment', 'Other'];

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="relative bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden z-10 max-h-90vh flex flex-col"
    >
        <ModalHeader title="Add Expense" onClose={onClose} />

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
    </ModalTransition>
  );
}
