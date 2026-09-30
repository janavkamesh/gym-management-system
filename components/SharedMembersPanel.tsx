'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { computeStatusColor } from '@/lib/utils/status';
import { Plus, Search, Upload } from 'lucide-react';
import AddMemberModal from './AddMemberModal';
import ImportCSVModal from './ImportCSVModal';
import MemberList from './MemberList';
import { SlidingTabs } from './ui/SlidingTabs';

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
  onImportClick?: () => void;
  onTabChange?: (tab: string) => void;
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
  initialAction,
  onImportClick,
  onTabChange
}: SharedMembersPanelProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>(
    initialFilter === 'overdue' ? 'Expired' : 'All'
  );

  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeTab);
    }
  }, [activeTab, onTabChange]);

  const [animationClass, setAnimationClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<any>(null);

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
        const matchesName = member.name?.toLowerCase().includes(lowerQ);
        const matchesUid = member.uid?.toLowerCase().includes(lowerQ);
        if (!matchesName && !matchesUid) {
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
      <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 justify-between items-start lg:items-center">
        <div className="flex w-full lg:w-auto items-center gap-3">
          <SlidingTabs
            options={['All', 'Expiring Soon', 'Expired', 'PT']}
            value={activeTab}
            onChange={(val) => {
              if (val === activeTab) return;
              const tabs: FilterTab[] = ['All', 'Expiring Soon', 'Expired', 'PT'];
              const prevIdx = tabs.indexOf(activeTab);
              const newIdx = tabs.indexOf(val as FilterTab);
              setAnimationClass(newIdx > prevIdx ? 'animate-row-slide-right' : 'animate-row-slide-left');
              setActiveTab(val as FilterTab);
              setIsAnimating(true);
            }}
          />
        </div>

        <div className="flex flex-row w-full lg:w-auto gap-2 items-center">
          <div className="relative flex-1 min-w-0 lg:w-70">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 min-h-11 lg:min-h-0 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-slate-400"
            />
          </div>
          {onImportClick && (
            <button
              onClick={onImportClick}
              className="hidden lg:flex flex-shrink-0 items-center justify-center gap-2 px-4 min-h-11 lg:min-h-0 py-2.5 w-auto bg-white border border-slate-300 hover:bg-slate-50 active:scale-95 transition-all duration-120 text-slate-700 text-sm font-medium rounded-lg shadow-sm"
            >
              <Upload size={18} />
              <span className="inline">Import CSV</span>
            </button>
          )}
          <button
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Add Member"
            className="flex flex-shrink-0 items-center justify-center gap-2 px-4 min-h-11 lg:min-h-0 py-2.5 w-auto bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all duration-120 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden min-[360px]:inline">Add Member</span>
            <span className="min-[360px]:hidden">Add</span>
          </button>
        </div>
      </div>

      <div className="mt-2 lg:mt-0">
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
          animationKey={activeTab}
          animationClass={animationClass}
          onAnimationEnd={() => {
            setIsAnimating(false);
            setAnimationClass('');
          }}
        />
      </div>

      <AddMemberModal 
        isOpen={isAddModalOpen}
        plans={plans}
        trainers={trainers}
        onClose={handleCloseModal} 
        memberToEdit={memberToEdit} 
      />
    </>
  );
}
