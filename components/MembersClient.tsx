'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { computeStatusColor } from '@/lib/utils/status';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import SharedMembersPanel from './SharedMembersPanel';
import MemberList from './MemberList';
import { getArchivedMembers, restoreMember } from '@/lib/actions/members';
import PageHeader from './PageHeader';

type FilterTab = 'All' | 'Expiring Soon' | 'Expired' | 'PT';

export default function MembersClient({ 
  initialMembers, plans, trainers, initialArchivedCount, initialFilter, initialMemberId, initialOpenMember, initialAction 
}: { 
  initialMembers: any[]; plans: any[]; trainers: any[]; initialArchivedCount: number;
  initialFilter?: string; initialMemberId?: string; initialOpenMember?: string; initialAction?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState(initialMembers);

  const [archivedCount, setArchivedCount] = useState(initialArchivedCount);
  const [isArchivedExpanded, setIsArchivedExpanded] = useState(false);
  const [archivedMembers, setArchivedMembers] = useState<any[]>([]);
  const [archivedSearchQuery, setArchivedSearchQuery] = useState('');
  const [isLoadingArchived, setIsLoadingArchived] = useState(false);
  const [highlightedMemberId, setHighlightedMemberId] = useState<string | null>(null);

  // Sync with server updates (e.g. after revalidatePath)
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  // Handle auto-opening member profile from push notification
  useEffect(() => {
    if (initialOpenMember) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('openMember');
      // Update URL without refresh
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
    }
  }, [initialOpenMember, pathname, router, searchParams]);

  const loadArchivedMembers = async () => {
    setIsLoadingArchived(true);
    try {
      const data = await getArchivedMembers();
      setArchivedMembers(data || []);
      setArchivedCount(data?.length || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingArchived(false);
    }
  };

  const toggleArchived = () => {
    if (!isArchivedExpanded && archivedMembers.length === 0) {
      loadArchivedMembers();
    }
    setIsArchivedExpanded(!isArchivedExpanded);
  };

  const handleMemberRemoved = (id: string) => {
    setArchivedCount(prev => prev + 1);
    if (isArchivedExpanded) {
      loadArchivedMembers();
    }
  };

  const handleRestore = async (id: string) => {
    await restoreMember(id);
    const restoredMember = archivedMembers.find(m => m.id === id);
    if (restoredMember) {
      setMembers(prev => [restoredMember, ...prev]);
      setArchivedMembers(prev => prev.filter(m => m.id !== id));
      setArchivedCount(prev => prev - 1);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setHighlightedMemberId(id);
      setTimeout(() => {
        setHighlightedMemberId(null);
      }, 2000);
    }
  };



  const filteredArchivedMembers = useMemo(() => {
    if (!archivedSearchQuery) return archivedMembers;
    const lowerQ = archivedSearchQuery.toLowerCase();
    return archivedMembers.filter(m => 
      m.name.toLowerCase().includes(lowerQ) || (m.phone && m.phone.includes(archivedSearchQuery))
    );
  }, [archivedMembers, archivedSearchQuery]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
      <PageHeader 
        title="Members" 
        subtitle="Track memberships, payments, and renewals in one place." 
      />

      <SharedMembersPanel
        members={members}
        setMembers={setMembers}
        plans={plans}
        trainers={trainers}
        highlightedMemberId={highlightedMemberId}
        onMemberRemoved={handleMemberRemoved}
        initialFilter={initialFilter}
        initialMemberId={initialMemberId}
        initialOpenMember={initialOpenMember}
        initialAction={initialAction}
      />

      {/* Archived Members Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div 
          className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 cursor-pointer hover:bg-slate-50 transition-colors gap-4"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('.archived-search')) return;
            toggleArchived();
          }}
        >
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-slate-900">Archived Members ({archivedCount})</h3>
            {isArchivedExpanded ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
          </div>
          
          <div className="relative w-full md:w-70 archived-search">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search archived..."
              value={archivedSearchQuery}
              onChange={(e) => setArchivedSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 min-h-12 md:min-h-0 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all placeholder-slate-400"
            />
          </div>
        </div>

        {isArchivedExpanded && (
          <div className="border-t border-slate-200">
            {isLoadingArchived ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : filteredArchivedMembers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No archived members found.
              </div>
            ) : (
              <MemberList
                members={filteredArchivedMembers}
                trainers={trainers}
                searchQuery={archivedSearchQuery}
                emptyTitle="No archived members found"
                emptySubtitle="No members match your search."
                onEdit={() => {}}
                onDeleted={() => {}}
                isArchived={true}
                onRestore={handleRestore}
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
}

