'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { computeStatusColor } from '@/lib/utils/status';
import { Plus, Search, Upload } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import ImportCSVModal from './ImportCSVModal';
import MemberList from './MemberList';

type FilterTab = 'All' | 'Expiring Soon' | 'Expired' | 'PT';

interface SharedMembersPanelProps {
  members: any[];
  setMembers: React.Dispatch<React.SetStateAction<any[]>>;
  plans: any[];
  trainers: any[];
  emptySubtitle?: string;
  highlightedMemberId?: string | null;
  onMemberRemoved?: (id: string) => void;
  initialFilter?: string;
  initialMemberId?: string;
  initialOpenMember?: string;
  initialAction?: string;
}

export default function SharedMembersPanel({
  members,
  setMembers,
  plans,
  trainers,
  emptySubtitle = "Click 'Add Member' to start tracking memberships and payments.",
  highlightedMemberId,
  onMemberRemoved,
  initialFilter,
  initialMemberId,
  initialOpenMember,
  initialAction
}: SharedMembersPanelProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>(
    initialFilter === 'expiring_today' ? 'Expiring Soon' : 
    initialFilter === 'overdue' ? 'Expired' : 'All'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<any>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateIndicator = () => {
      const tabs = ['All', 'Expiring Soon', 'Expired', 'PT'];
      const activeIndex = tabs.indexOf(activeTab);
      const buttons = containerRef.current?.querySelectorAll('button');
      if (!buttons) return;
      const activeButton = buttons[activeIndex];
      
      if (activeButton) {
        setIndicatorStyle({
          width: activeButton.offsetWidth,
          left: activeButton.offsetLeft,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);

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

  const removeMemberFromList = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    if (onMemberRemoved) {
      onMemberRemoved(id);
    }
  };

  const filteredMembers = useMemo(() => {
    const filtered = members.filter((member: any) => {
      const statusColor = computeStatusColor(member.expiry_date);
      
      if (activeTab === 'Expiring Soon' && statusColor !== 'Yellow') return false;
      if (activeTab === 'Expired' && statusColor !== 'Red') return false;
      if (activeTab === 'PT') {
        const hasActivePT = member.pt_assignments?.some((pt: any) => pt.is_active);
        if (!hasActivePT) return false;
      }
      
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
      
      if (initialFilter === 'expiring_today') {
        const today = new Date().toISOString().split('T')[0];
        if (a.expiry_date === today && b.expiry_date !== today) return -1;
        if (b.expiry_date === today && a.expiry_date !== today) return 1;
      }
      
      const dateA = new Date(a.expiry_date || 0).getTime();
      const dateB = new Date(b.expiry_date || 0).getTime();
      return dateA - dateB;
    });

    return filtered;
  }, [members, activeTab, searchQuery]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex w-full md:w-auto items-center gap-3">
          <div 
            ref={containerRef}
            className="flex relative bg-slate-100 rounded-lg p-1 w-full md:w-auto overflow-x-auto hide-scrollbar touch-manipulation"
          >
            <div 
              className="absolute left-0 top-1 bottom-1 bg-navy rounded-md shadow-sm transition-transform duration-120 ease-out"
              style={{
                width: `${indicatorStyle.width}px`,
                transform: `translateX(${indicatorStyle.left}px)`,
              }}
            />
            {(['All', 'Expiring Soon', 'Expired', 'PT'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative z-10 flex-1 md:flex-none px-4 py-2 min-h-12 md:min-h-0 text-sm font-medium rounded-md whitespace-nowrap transition-colors flex items-center justify-center ${
                  activeTab === tab 
                    ? 'text-white' 
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

      <MemberList
        members={filteredMembers}
        trainers={trainers}
        searchQuery={searchQuery}
        emptySubtitle={activeTab === 'PT' ? "No PT clients yet." : emptySubtitle}
        onEdit={handleEdit}
        onDeleted={removeMemberFromList}
        highlightedMemberId={highlightedMemberId}
        targetMemberId={initialMemberId}
        openMemberId={initialOpenMember}
        action={initialAction}
      />

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
          trainers={trainers}
          onClose={handleCloseModal} 
          memberToEdit={memberToEdit} 
        />
      )}

      {isImportModalOpen && (
        <ImportCSVModal 
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}
