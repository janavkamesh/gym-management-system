'use client';

import { useState, useMemo } from 'react';
import { computeStatusColor } from '@/lib/utils/status';
import { Plus } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import MemberRow from './MemberRow';

type FilterTab = 'All' | 'Active' | 'Pending Payment' | 'Inactive';

export default function MembersClient({ initialMembers, plans }: { initialMembers: any[]; plans: any[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [members, setMembers] = useState(initialMembers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const removeMemberFromList = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // Apply filters
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const statusColor = computeStatusColor(member.expiry_date);
      if (activeTab === 'All') return true;
      if (activeTab === 'Active') return statusColor === 'Green';
      if (activeTab === 'Pending Payment') return member.pendingAmount > 0;
      if (activeTab === 'Inactive') return statusColor === 'Red';
      return true;
    });
  }, [members, activeTab]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-4xl font-semibold text-[#0F172A] tracking-tight">Members</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="hidden md:block px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 active:scale-95 transition-all duration-120 text-white text-sm font-medium rounded-lg shadow-sm"
        >
          Add Member
        </button>
      </div>

      <div className="flex gap-4 border-b border-[#E2E8F0] overflow-x-auto whitespace-nowrap hide-scrollbar">
        {(['All', 'Active', 'Pending Payment', 'Inactive'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 min-h-[48px] flex items-center justify-center text-sm font-medium transition-colors border-b-2 touch-manipulation ${
              activeTab === tab
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-[#FFFFFF] rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden overflow-x-auto">
        {filteredMembers.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            {members.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No members yet</h3>
                <p className="text-sm text-slate-500">Click 'Add Member' to start tracking memberships and payments.</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No members found</h3>
                <p className="text-sm text-slate-500">Try changing the filter to see other members.</p>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-900 min-w-[700px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-slate-500">
              <tr>
                <th className="px-4 md:px-6 py-4 font-medium">Name</th>
                <th className="px-4 md:px-6 py-4 font-medium">Plan</th>
                <th className="px-4 md:px-6 py-4 font-medium">Days left</th>
                <th className="px-4 md:px-6 py-4 font-medium">Status</th>
                <th className="px-4 md:px-6 py-4 font-medium">Send Reminder</th>
                <th className="px-4 md:px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredMembers.map((member) => (
                <MemberRow 
                  key={member.id} 
                  member={member} 
                  onDeleted={() => removeMemberFromList(member.id)} 
                />
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
        <AddMemberModal plans={plans} onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}
