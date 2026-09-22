'use client';

import { useState, useMemo, useEffect } from 'react';
import { useToast } from './ToastProvider';
import { computeStatusColor } from '@/lib/utils/status';
import { Users, UserCheck, AlertTriangle, AlertCircle, Plus, Search } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import MemberRow from './MemberRow';

interface DashboardClientProps {
  initialMembers: any[];
  plans: any[];
  initialError?: string;
}

type FilterTab = 'All' | 'Expiring Soon' | 'Expired';

export default function DashboardClient({ initialMembers, plans, initialError }: DashboardClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialError) {
      showToast(initialError, 'error');
    }
  }, [initialError, showToast]);

  const removeMemberFromList = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  // Compute stats
  const stats = useMemo(() => {
    let total = members.length;
    let active = 0;
    let expiring = 0;
    let expired = 0;

    members.forEach(m => {
      const color = computeStatusColor(m.expiry_date);
      if (color === 'Green') active++;
      else if (color === 'Yellow') expiring++;
      else expired++;
    });

    return { total, active, expiring, expired };
  }, [members]);

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const color = computeStatusColor(m.expiry_date);
      if (activeTab === 'Expiring Soon' && color !== 'Yellow') return false;
      if (activeTab === 'Expired' && color !== 'Red') return false;
      
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase();
        if (!m.name.toLowerCase().includes(lowerQ) && !m.phone.includes(searchQuery)) {
          return false;
        }
      }
      return true;
    });
  }, [members, activeTab, searchQuery]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl md:text-4xl font-semibold text-[#0F172A] tracking-tight">Dashboard</h1>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-[#2563EB]" />
            <h3 className="text-sm font-medium text-slate-500">Total Members</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={18} className="text-[#16A34A]" />
            <h3 className="text-sm font-medium text-slate-500">Active</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{stats.active}</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-[#EAB308]" />
            <h3 className="text-sm font-medium text-slate-500">Expiring Soon</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{stats.expiring}</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm hover:border-[#CBD5E1] transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-[#DC2626]" />
            <h3 className="text-sm font-medium text-slate-500">Expired</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{stats.expired}</p>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex w-full md:w-auto">
          <div className="flex bg-[#F1F5F9] rounded-lg p-1 w-full md:w-auto overflow-x-auto hide-scrollbar touch-manipulation">
            {(['All', 'Expiring Soon', 'Expired'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 md:flex-none px-4 py-2 min-h-[48px] md:min-h-0 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center justify-center ${
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
          <div className="relative w-full md:w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 min-h-[48px] md:min-h-0 py-2.5 bg-white border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all placeholder-slate-400"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-4 min-h-[48px] md:min-h-0 py-2.5 w-full md:w-auto bg-[#2563EB] hover:bg-blue-700 active:scale-95 transition-all duration-120 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <Plus size={18} />
            <span className="inline">Add Member</span>
          </button>
        </div>
      </div>

      {/* Member List */}
      <div className="bg-[#FFFFFF] rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden overflow-x-auto">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">No members found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchQuery 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Your dashboard is all caught up."}
            </p>
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
