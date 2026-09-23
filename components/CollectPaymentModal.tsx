'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { collectPaymentAmount } from '@/lib/actions/payments';
import { useToast } from './ToastProvider';

interface CollectPaymentModalProps {
  member: any;
  onClose: () => void;
}

export default function CollectPaymentModal({ member, onClose }: CollectPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await collectPaymentAmount(member.id, Number(amount), method);
      showToast('Payment collected & expiry updated successfully', 'success');
      onClose();
    } catch (error) {
      showToast('Failed to collect payment. Check your connection.', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-slate-900/50"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl p-6 z-10 animate-slide-up md:animate-fade-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Amount Collected</h3>
            <p className="text-sm text-slate-500 mt-1">Log payment for {member.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all rounded-full p-2 active:scale-95">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pb-safe">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-500 font-medium">₹</span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g. 1500"
                min="1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Method</label>
            <div className="flex gap-2">
              {['Cash', 'UPI', 'Card'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`flex-1 min-h-12 md:min-h-10 py-2 text-sm font-medium rounded-lg border transition-colors active:scale-95 ${
                    method === m 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95 min-h-12"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!amount || Number(amount) <= 0 || isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors active:scale-95 flex justify-center items-center disabled:opacity-50 min-h-12"
            >
              {isSubmitting ? 'Saving...' : 'Collect Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
