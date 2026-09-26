'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { paySalary } from '@/lib/actions/trainers';
import { useToast } from './ToastProvider';
import { formatINR } from '@/lib/utils/formatters';
import { DatePicker } from './DatePicker';

interface PaySalaryModalProps {
  trainer: any;
  summary: any;
  month: number;
  year: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaySalaryModal({ trainer, summary, month, year, onClose, onSuccess }: PaySalaryModalProps) {
  const [method, setMethod] = useState('Cash');
  const [note, setNote] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handlePay = async () => {
    setIsSubmitting(true);
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    
    try {
      await paySalary(trainer.id, monthStart, paidDate, method, note);
      showToast('Salary paid successfully', 'success');
      onSuccess();
      onClose();
    } catch (e: any) {
      showToast(e.message || 'Failed to pay salary', 'error');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onPointerDown={onClose}></div>
      <div className="relative bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl p-6 z-10 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-200 pb-safe">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-slate-900">Pay Salary</h3>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors active:scale-95">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">Trainer</div>
              <div className="text-base text-slate-900">{trainer.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">Period</div>
              <div className="text-base text-slate-900">{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-500">Base Salary</span>
              <span className="font-medium">{formatINR(summary.baseSalary)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Commission</span>
              <span className="font-medium text-green-600">+{formatINR(summary.totalCommission)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Advances Deducted</span>
              <span className="font-medium text-red-600">-{formatINR(summary.totalAdvances)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center mt-2">
              <span className="font-semibold text-slate-900">Net Payable</span>
              <span className="text-lg font-bold text-slate-900">{formatINR(summary.netPayable)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Date</label>
              <DatePicker value={paidDate} onChange={setPaidDate} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Note (Optional)</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Cleared via GPay" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95">
            Cancel
          </button>
          <button onClick={handlePay} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors active:scale-95 flex items-center justify-center disabled:opacity-50">
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Check size={18} className="mr-1.5" /> Confirm Pay</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
