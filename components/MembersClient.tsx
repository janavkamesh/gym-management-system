'use client';

import { useState, useMemo, useEffect } from 'react';
import { computeStatusColor } from '@/lib/utils/status';
import { Plus, Search, Upload } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import ImportCSVModal from './ImportCSVModal';
import MemberRow from './MemberRow';

type FilterTab = 'All' | 'Expiring Soon' | 'Expired';

export default function MembersClient({ initialMembers, plans }: { initialMembers: any[]; plans: any[] }) {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState(initialMembers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<any>(null);

  // Sync with server updates (e.g. after revalidatePath)
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const removeMemberFromList = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const handleEdit = (member: any) => {
    setMemberToEdit(member);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = (updatedMember?: any) => {
    setIsAddModalOpen(false);
    setMemberToEdit(null);
    if (updatedMember) {
      setMembers(prev => prev.map(m => m.id === updatedMember.id ? { ...m, ...updatedMember } : m));
    }
  };

  // Apply filters
  const filteredMembers = useMemo(() => {
    const filtered = members.filter((member: any) => {
      const statusColor = computeStatusColor(member.expiry_date);
      
      if (activeTab === 'Expiring Soon' && statusColor !== 'Yellow') return false;
      if (activeTab === 'Expired' && statusColor !== 'Red') return false;
      
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        if (!member.name.toLowerCase().includes(lowerQ) && !member.phone.includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });

    filtered.sort((a: any, b: any) => {
      const colorA = computeStatusColor(a.expiry_date);
      const colorB = computeStatusColor(b.expiry_date);
      
      const priority: Record<string, number> = { 'Red': 1, 'Yellow': 2, 'Green': 3 };
      const pA = priority[colorA] || 4;
      const pB = priority[colorB] || 4;
      
      if (pA !== pB) return pA - pB;
      
      const dateA = new Date(a.expiry_date || 0).getTime();
      const dateB = new Date(b.expiry_date || 0).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [members, activeTab, searchQuery]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Members</h1>
      </div>

      {/* Search & Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex w-full md:w-auto">
          <div className="flex bg-slate-100 rounded-lg p-1 w-full md:w-auto overflow-x-auto hide-scrollbar touch-manipulation">
            {(['All', 'Expiring Soon', 'Expired'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 min-h-12 md:min-h-0 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center justify-center ${
                  activeTab === tab 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
          <div className="relative w-full md:w-70">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 min-h-12 md:min-h-0 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-slate-400"
            />
          </div>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="hidden md:flex flex-shrink-0 items-center justify-center gap-2 px-4 min-h-12 md:min-h-0 py-2.5 w-full md:w-auto bg-white border border-slate-300 hover:bg-slate-50 active:scale-95 transition-all duration-120 text-slate-700 text-sm font-medium rounded-lg shadow-sm"
          >
            <Upload size={18} />
            <span className="inline">Import CSV</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden md:flex flex-shrink-0 items-center justify-center gap-2 px-4 min-h-12 md:min-h-0 py-2.5 w-full md:w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-120 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <Plus size={18} />
            <span className="inline">Add Member</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            {members.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No members yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">Click 'Add Member' to start tracking memberships and payments.</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No members found</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  {searchQuery 
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Try changing the filter to see other members."}
                </p>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-900">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 md:px-6 py-4 font-medium">Name</th>
                <th className="px-4 md:px-6 py-4 font-medium">Plan</th>
                <th className="px-4 md:px-6 py-4 font-medium">Days left</th>
                <th className="px-4 md:px-6 py-4 font-medium">Status</th>
                <th className="px-4 md:px-6 py-4 font-medium text-center">Amount Collected</th>
                <th className="px-4 md:px-6 py-4 font-medium text-center">Send Reminder</th>
                <th className="px-4 md:px-6 py-4 font-medium text-center">Edit</th>
                <th className="px-4 md:px-6 py-4 font-medium text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.map((member: any) => (
                <MemberRow 
                  key={member.id} 
                  member={member} 
                  onDeleted={() => removeMemberFromList(member.id)} 
                  onEdit={() => handleEdit(member)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="md:hidden fixed bottom-20 right-4 z-40 flex flex-col gap-3">
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-white text-slate-700 border border-slate-200 rounded-full shadow-2xl active:scale-95 transition-all duration-120 touch-manipulation"
        >
          <Upload size={24} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl active:scale-95 transition-all duration-120 touch-manipulation"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {isAddModalOpen && (
        <AddMemberModal 
          plans={plans} 
          onClose={handleCloseModal} 
          memberToEdit={memberToEdit} 
        />
      )}

      {isImportModalOpen && (
        <ImportCSVModal 
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {}} // Will rely on revalidatePath
        />
      )}
    </div>
  );
}

