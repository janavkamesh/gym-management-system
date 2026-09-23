'use client';

import { useState } from 'react';
import { createExpense } from '@/lib/actions/expenses';
import { useToast } from './ToastProvider';
import { X, Upload, Info } from 'lucide-react';
import Tooltip from './Tooltip';
import { DatePicker } from './DatePicker';

export default function AddExpenseModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (expense: any) => void }) {
  const [category, setCategory] = useState('');
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
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-semibold text-slate-900">Add Expense</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-120 rounded-full p-2 touch-manipulation min-h-12 min-w-12 md:min-h-8 md:min-w-8 flex items-center justify-center">
            <X size={20} className="transition-transform duration-120" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
          <div className="space-y-5">
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow appearance-none"
                required
              >
                <option value="" disabled>Select category</option>
                {predefinedCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
