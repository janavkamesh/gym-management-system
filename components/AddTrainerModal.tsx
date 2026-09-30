'use client';

import { useState } from 'react';
import { createTrainer } from '@/lib/actions/trainers';
import { useToast } from './ToastProvider';
import { X } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';
import { handlePhoneInput, isValidPhone } from '@/lib/utils/phone';

export default function AddTrainerModal({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (trainer: any) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const isPhoneValid = isValidPhone(phone);
  const isValid = name.trim() !== '' && isPhoneValid && Number(baseSalary) >= 0 && joinDate !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const trainer = await createTrainer({
        name: name.trim(),
        phone: phone.trim(),
        base_salary: Number(baseSalary) || 0,
        join_date: joinDate,
      });
      onSuccess(trainer);
      onClose();
      // Reset
      setName('');
      setPhone('');
      setBaseSalary('');
      setJoinDate(new Date().toISOString().split('T')[0]);
      showToast('Trainer added successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to save. Check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="relative bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden z-10 h-[calc(100dvh-20px)] mt-auto md:mt-0 md:h-auto md:max-h-90vh flex flex-col"
      mobileFixed
    >
      <ModalHeader title="Add Trainer" onClose={onClose} variant="light" />

        <div className="p-5 overflow-y-auto min-h-0">
          <form id="add-trainer-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                placeholder="e.g. 9876543210"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 ${
                  phone.length > 0 && !isPhoneValid ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
                value={phone}
                onChange={(e) => handlePhoneInput(e, setPhone)}
                required
              />
              {phone.length > 0 && !isPhoneValid && (
                <div className="text-red-500 text-xs mt-1">
                  Enter a valid 10-digit phone number
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Base Salary (₹)</label>
              <input
                type="number"
                placeholder="e.g. 15000"
                min="0"
                step="1"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Join Date</label>
              <DatePicker
                value={joinDate}
                onChange={setJoinDate}
              />
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex gap-3 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-300 shadow-sm text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-trainer-form"
            disabled={!isValid || isSubmitting}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:active:scale-100 active:scale-95 flex justify-center items-center"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Save Trainer'
            )}
          </button>
        </div>
    </ModalTransition>
  );
}
