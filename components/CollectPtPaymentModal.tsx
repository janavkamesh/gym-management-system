'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { collectPtPayment } from '@/lib/actions/payments';
import { useToast } from './ToastProvider';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

interface CollectPtPaymentModalProps {
  isOpen: boolean;
  assignment: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CollectPtPaymentModal({ isOpen, assignment, onClose, onSuccess }: CollectPtPaymentModalProps) {
  const [amount, setAmount] = useState(assignment?.fee_amount?.toString() || '');
  const [method, setMethod] = useState('Cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await collectPtPayment(assignment.id, Number(amount), method);
      showToast('PT Payment collected successfully', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      showToast('Failed to collect PT payment. Check your connection.', 'error');
      setIsSubmitting(false);
    }
  };

  if (!assignment && !isOpen) return null;

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full max-w-md overflow-hidden md:animate-fade-in max-h-90vh flex flex-col"
      overlayClassName="z-[60]"
    >
      <ModalHeader 
        title={
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 md:text-white">Collect PT Fee</h3>
            <p className="text-xs text-slate-500 md:text-slate-300 mt-0.5 md:mt-1">Log PT payment for {assignment?.member?.name || 'this client'}</p>
          </div>
        } 
        onClose={onClose} 
      />

      <div className="p-6 overflow-y-auto">
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
                placeholder="e.g. 5000"
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
    </ModalTransition>
  );
}
