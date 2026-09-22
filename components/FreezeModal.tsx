'use client';

import { useState } from 'react';
import { freezeMember } from '@/lib/actions/members';
import { useToast } from './ToastProvider';
import { X } from 'lucide-react';

export default function FreezeModal({ member, onClose }: { member: any; onClose: () => void }) {
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
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/50">
      <div className="bg-white rounded-t-2xl md:rounded-lg shadow-2xl w-full max-w-md overflow-hidden animate-slide-up md:animate-fade-in max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 shrink-0">
          <h2 className="text-xl font-semibold text-slate-900">Freeze Membership</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 md:p-0 touch-manipulation">
            <X size={24} className="md:w-5 md:h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="mb-4">
            <p className="text-sm text-slate-500">Member: <span className="font-medium text-slate-900">{member.name}</span></p>
            <p className="text-sm text-slate-500">Current Expiry: <span className="font-medium text-slate-900">{new Date(member.expiry_date).toLocaleDateString()}</span></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Freeze Start Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={freezeStart}
              onChange={(e) => setFreezeStart(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Freeze End Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={freezeEnd}
              onChange={(e) => setFreezeEnd(e.target.value)}
              min={freezeStart}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          
          {isValid && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded text-sm mt-2">
              The expiry date will be pushed forward by exactly {Math.ceil((new Date(freezeEnd).getTime() - new Date(freezeStart).getTime()) / (1000 * 60 * 60 * 24))} days.
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white">
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
      </div>
    </div>
  );
}
