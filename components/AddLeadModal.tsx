'use client';

import { useState } from 'react';
import { createLead } from '@/lib/actions/leads';
import { useToast } from './ToastProvider';
import { X } from 'lucide-react';
import { DatePicker } from './DatePicker';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

export default function AddLeadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [promisedDate, setPromisedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const isValidPhone = /^\d{10}$/.test(phone);
  const isValid = name.trim() !== '' && isValidPhone && promisedDate !== '';

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const val = e.target.value.replace(/\D/g, '');
    if (val.length <= 10) {
      setPhone(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await createLead({
        name,
        phone,
        promised_date: promisedDate,
      });
      showToast('Lead added successfully', 'success');
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
      containerClassName="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full max-w-lg overflow-hidden md:animate-fade-in max-h-90vh flex flex-col"
    >
      <ModalHeader title="Add Lead" onClose={onClose} />


        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g. Jane Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone <span className="text-red-500">*</span> 
                {phone.length > 0 && !isValidPhone && <span className="text-red-500 text-xs ml-2 font-normal">(10 digits required)</span>}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className={`w-full px-3 py-2 border rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  phone.length > 0 && !isValidPhone ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Promised Date <span className="text-red-500">*</span></label>
              <DatePicker
                value={promisedDate}
                onChange={setPromisedDate}
              />
            </div>
          </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg min-h-12 md:min-h-0 transition-colors touch-manipulation"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg min-h-12 md:min-h-0 shadow-sm transition-colors active:scale-95 duration-120 touch-manipulation"
            >
              {isSubmitting ? 'Saving...' : 'Add Lead'}
            </button>
          </div>
        </form>
    </ModalTransition>
  );
}
