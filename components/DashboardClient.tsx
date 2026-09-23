'use client';

import { useState, useMemo, useEffect } from 'react';
import { useToast } from './ToastProvider';
import { computeStatusColor } from '@/lib/utils/status';
import { Users, UserCheck, AlertTriangle, AlertCircle, Plus, Search, Upload } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import ImportCSVModal from './ImportCSVModal';
import MemberRow from './MemberRow';

interface DashboardClientProps {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMembers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plans: any[];
  initialError?: string;
}

type FilterTab = 'All' | 'Expiring Soon' | 'Expired';

export default function DashboardClient({ initialMembers, plans, initialError }: DashboardClientProps) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<any>(null);
  const { showToast } = useToast();

  const handleEdit = (member: any) => {
    setMemberToEdit(member);
    setIsAddModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setMemberToEdit(null);
  };

  const members = useMemo(() => {
    return initialMembers.filter(m => !deletedIds.has(m.id));
  }, [initialMembers, deletedIds]);

  useEffect(() => {
    if (initialError) {
      showToast(initialError, 'error');
    }
  }, [initialError, showToast]);

  const removeMemberFromList = (id: string) => {
    setDeletedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Compute stats
  const stats = useMemo(() => {
    const total = members.length;
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

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    const filtered = members.filter(m => {
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

    filtered.sort((a, b) => {
      const colorA = computeStatusColor(a.expiry_date);
      const colorB = computeStatusColor(b.expiry_date);
      
      const priority: Record<string, number> = { 'Red': 1, 'Yellow': 2, 'Green': 3 };
      const pA = priority[colorA] || 4;
      const pB = priority[colorB] || 4;
      
      if (pA !== pB) return pA - pB;
      
      // Secondary sort: soonest-expiring first
      const dateA = new Date(a.expiry_date || 0).getTime();
      const dateB = new Date(b.expiry_date || 0).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [members, activeTab, searchQuery]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Overview of your gym's members, renewals, and activity.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-blue-600" />
            <h3 className="text-sm font-medium text-slate-500">Total Members</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck size={18} className="text-green-600" />
            <h3 className="text-sm font-medium text-slate-500">Active</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{stats.active}</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-yellow-500" />
            <h3 className="text-sm font-medium text-slate-500">Expiring Soon</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{stats.expiring}</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={18} className="text-red-600" />
            <h3 className="text-sm font-medium text-slate-500">Expired</h3>
          </div>
          <p className="text-3xl font-semibold text-slate-900">{stats.expired}</p>
        </div>
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

      {/* Member List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
              {filteredMembers.map((member) => (
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
        <AddMemberModal plans={plans} onClose={handleCloseModal} memberToEdit={memberToEdit} />
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
