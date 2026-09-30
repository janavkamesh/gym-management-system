'use client';

import { useState } from 'react';
import { logPayment } from '@/lib/actions/payments';
import { useToast } from './ToastProvider';
import { DatePicker } from './DatePicker';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

export default function PaymentModal({ isOpen, member, onClose }: { isOpen: boolean; member: any; onClose: () => void }) {
  const [amount, setAmount] = useState(member.pendingAmount.toString() || '');
  const [method, setMethod] = useState('UPI');
  const [date, setDate] = useState(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const isValid = Number(amount) > 0 && method !== '' && date !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await logPayment(member.id, Number(amount), method, date);
      showToast('Payment logged successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full md:max-w-sm overflow-hidden md:animate-fade-in max-h-90vh flex flex-col"
    >
      <ModalHeader title="Log Payment" onClose={onClose} variant="mobile-light" />

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="mb-4">
            <p className="text-sm text-slate-500">Member: <span className="font-medium text-slate-900">{member.name}</span></p>
            <p className="text-sm text-slate-500">Pending: <span className="font-medium text-slate-900">₹{member.pendingAmount}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="0.00"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date <span className="text-red-500">*</span></label>
            <DatePicker
              value={date}
              onChange={setDate}
              max={new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Method <span className="text-red-500">*</span></label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors active:scale-95 duration-120"
            >
              {isSubmitting ? 'Saving...' : 'Add Payment'}
            </button>
          </div>
        </form>
    </ModalTransition>
  );
}
