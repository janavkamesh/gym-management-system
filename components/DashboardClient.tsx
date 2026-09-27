'use client';

import { useState, useMemo, useEffect } from 'react';
import { useToast } from './ToastProvider';
import { computeStatusColor } from '@/lib/utils/status';
import { Users, UserCheck, AlertTriangle, AlertCircle, Plus, Search, Upload, Clock, UserX } from 'lucide-react';
import SharedMembersPanel from './SharedMembersPanel';
import { StatCard } from './ui/StatCard';
import PageHeader from './PageHeader';

interface DashboardClientProps {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialMembers: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plans: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trainers: any[];
  initialError?: string;
}

type FilterTab = 'All' | 'Expiring Soon' | 'Expired' | 'PT';

export default function DashboardClient({ initialMembers, plans, trainers, initialError }: DashboardClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const { showToast } = useToast();

  // Sync with server updates
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    if (initialError) {
      showToast(initialError, 'error');
    }
  }, [initialError, showToast]);



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



  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
      <PageHeader 
        title="Dashboard" 
        subtitle="Your daily overview of renewals, follow-ups, and reviews due." 
      />

      {/* Top Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Total Members" value={stats.total} icon={Users} variant="blue" />
        <StatCard title="Active" value={stats.active} icon={UserCheck} variant="green" />
        <StatCard title="Expiring Soon" value={stats.expiring} icon={Clock} variant="yellow" />
        <StatCard title="Expired" value={stats.expired} icon={UserX} variant="red" />
      </div>

      <SharedMembersPanel
        members={members}
        setMembers={setMembers}
        plans={plans}
        trainers={trainers}
        emptySubtitle="Your dashboard is all caught up."
      />
    </div>
  );
}
