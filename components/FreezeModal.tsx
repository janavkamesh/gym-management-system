'use client';

import { useState } from 'react';
import { freezeMember } from '@/lib/actions/members';
import { useToast } from './ToastProvider';
import { DatePicker } from './DatePicker';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

export default function FreezeModal({ isOpen, member, onClose }: { isOpen: boolean; member: any; onClose: () => void }) {
  const [freezeStart, setFreezeStart] = useState(new Date().toISOString().split('T')[0]);
  const [freezeEnd, setFreezeEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const isValid = freezeStart !== '' && freezeEnd !== '' && new Date(freezeEnd) > new Date(freezeStart);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await freezeMember(member.id, freezeStart, freezeEnd);
      showToast('Membership frozen successfully', 'success');
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
      containerClassName="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full max-w-md overflow-hidden md:animate-fade-in max-h-90vh flex flex-col"
    >
      <ModalHeader title="Freeze Membership" onClose={onClose} />

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="mb-4">
            <p className="text-sm text-slate-500">Member: <span className="font-medium text-slate-900">{member.name}</span></p>
            <p className="text-sm text-slate-500">Current Expiry: <span className="font-medium text-slate-900">{new Date(member.expiry_date).toLocaleDateString('en-GB')}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Freeze Start Date <span className="text-red-500">*</span></label>
            <DatePicker
              value={freezeStart}
              onChange={setFreezeStart}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Freeze End Date <span className="text-red-500">*</span></label>
            <DatePicker
              value={freezeEnd}
              onChange={setFreezeEnd}
              min={freezeStart}
            />
          </div>
          
          {isValid && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded text-sm mt-2">
              The expiry date will be pushed forward by exactly {Math.ceil((new Date(freezeEnd).getTime() - new Date(freezeStart).getTime()) / (1000 * 60 * 60 * 24))} days.
            </div>
            )}
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
              {isSubmitting ? 'Saving...' : 'Freeze Membership'}
            </button>
          </div>
        </form>
    </ModalTransition>
  );
}
