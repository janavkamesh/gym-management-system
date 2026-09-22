'use client';

import { useState, useEffect } from 'react';
import { useToast } from './ToastProvider';
import { Plus } from 'lucide-react';
import AddLeadModal from './AddLeadModal';
import LeadRow from './LeadRow';

export default function LeadsClient({ initialLeads, initialError }: { initialLeads: any[], initialError?: string }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialError) {
      showToast(initialError, 'error');
    }
  }, [initialError, showToast]);

  const leads = initialLeads || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-4xl font-semibold text-[#0F172A] tracking-tight">Leads</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden md:block px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-95 transition-all duration-120 text-white text-sm font-medium rounded-lg shadow-sm"
        >
          Add Lead
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden overflow-x-auto">
        {leads.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">No leads yet</h3>
            <p className="text-sm text-slate-500">Click 'Add Lead' when a walk-in visitor shows interest.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-900 min-w-[700px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500">
              <tr>
                <th className="px-4 md:px-6 py-4 font-medium">Name</th>
                <th className="px-4 md:px-6 py-4 font-medium">Phone</th>
                <th className="px-4 md:px-6 py-4 font-medium">Promised Date</th>
                <th className="px-4 md:px-6 py-4 font-medium">Outcome</th>
                <th className="px-4 md:px-6 py-4 font-medium text-right">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 flex items-center justify-center w-14 h-14 bg-[#2563EB] text-white rounded-full shadow-2xl active:scale-95 transition-all duration-120 touch-manipulation"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {isAddModalOpen && (
        <AddLeadModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}
