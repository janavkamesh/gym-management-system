'use client';

import { useState } from 'react';
import { createPtAssignment } from '@/lib/actions/trainers';
import { useToast } from './ToastProvider';
import { X } from 'lucide-react';
import { DatePicker } from './DatePicker';

export default function AddPtAssignmentModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  trainerId,
  members
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: (assignment: any) => void;
  trainerId: string;
  members: any[];
}) {
  const [memberId, setMemberId] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const isValid = memberId !== '' && Number(commissionPercent) >= 0 && Number(commissionPercent) <= 100 && assignedDate !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const assignment = await createPtAssignment({
        trainer_id: trainerId,
        member_id: memberId,
        commission_percent: Number(commissionPercent),
        assigned_date: assignedDate,
      });
      onSuccess(assignment);
      onClose();
      // Reset
      setMemberId('');
      setCommissionPercent('');
      setAssignedDate(new Date().toISOString().split('T')[0]);
      showToast('PT assignment added successfully', 'success');
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onPointerDown={onClose}></div>
      <div className="relative bg-white w-full md:max-w-md rounded-none md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 md:fade-in duration-200 z-10 h-[calc(100dvh-20px)] mt-auto md:mt-0 md:h-auto md:max-h-90vh flex flex-col">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-semibold text-slate-900">Add PT Client</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-120 rounded-full p-2 touch-manipulation min-h-12 min-w-12 md:min-h-8 md:min-w-8 flex items-center justify-center">
            <X size={20} className="transition-transform duration-120" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto min-h-0">
          <form id="add-pt-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Member</label>
              <select
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
              >
                <option value="" disabled>Select a member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Commission Percentage (%)</label>
              <input
                type="number"
                placeholder="e.g. 30"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Date</label>
              <DatePicker
                value={assignedDate}
                onChange={setAssignedDate}
              />
            </div>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-pt-form"
            disabled={!isValid || isSubmitting}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:active:scale-100 active:scale-95 flex justify-center items-center"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Save Assignment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
