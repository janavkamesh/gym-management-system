'use client';

import { useState, useEffect } from 'react';
import { useToast } from './ToastProvider';
import { Plus } from 'lucide-react';
import AddLeadModal from './AddLeadModal';
import LeadRow from './LeadRow';
import PageHeader from './PageHeader';

import { useMemo } from 'react';

export default function LeadsClient({ initialLeads, initialError, initialFilter }: { initialLeads: any[], initialError?: string, initialFilter?: string }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialError) {
      showToast(initialError, 'error');
    }
  }, [initialError, showToast]);

  const sortedLeads = useMemo(() => {
    const arr = [...(initialLeads || [])];
    if (initialFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      arr.sort((a, b) => {
        const aIsToday = a.promised_date === today && (a.outcome === 'Pending' || a.outcome === 'No Response');
        const bIsToday = b.promised_date === today && (b.outcome === 'Pending' || b.outcome === 'No Response');
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;
        return 0;
      });
    }
    return arr;
  }, [initialLeads, initialFilter]);

  const leads = sortedLeads;

  return (
    <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto space-y-3 lg:space-y-6">
      <PageHeader
        title="Leads"
        subtitle="Follow up on walk-ins and enquiries before they go cold."
        action={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-shrink-0 items-center justify-center gap-2 px-4 min-h-11 lg:min-h-0 py-2.5 w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-120 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden min-[360px]:inline">Add Lead</span>
            <span className="min-[360px]:hidden">Add</span>
          </button>
        }
      />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">No leads yet</h3>
            <p className="text-sm text-slate-500">Click 'Add Lead' when a walk-in visitor shows interest.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-900">
            <thead className="table-header-dark border-b border-slate-200 text-slate-100">
              <tr>
                <th className="px-4 md:px-6 font-medium text-left">Name</th>
                <th className="px-4 md:px-6 font-medium text-left">Phone</th>
                <th className="px-4 md:px-6 font-medium text-left">Promised Date</th>
                <th className="px-4 md:px-6 font-medium text-left">Outcome</th>
                <th className="px-4 md:px-6 font-medium text-center">Call</th>
                <th className="px-4 md:px-6 font-medium text-center">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isAddModalOpen && (
        <AddLeadModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}
