import { createClient } from '@/lib/supabase/server';
import DashboardClient from '@/components/DashboardClient';
import { mapMemberData } from '@/lib/utils/members';
import FirstLoadSuspense from '@/components/FirstLoadSuspense';
import DashboardSkeleton from '@/app/DashboardSkeleton';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <FirstLoadSuspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </FirstLoadSuspense>
  );
}

async function DashboardContent() {
  const supabase = await createClient();

  const { data: plansData } = await supabase.from('plans').select('*');
  const { data: membersData, error } = await supabase.from('members').select('*, plans(*), payments(*), pt_assignments(*)').is('archived_at', null);
  const { data: trainersData } = await supabase.from('trainers').select('*').is('archived_at', null).order('name');

  const mappedMembers = (membersData || []).map(mapMemberData);

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <DashboardClient 
        initialMembers={mappedMembers}
        plans={plansData || []}
        trainers={trainersData || []}
        initialError={error ? "Failed to load members. Check your connection." : undefined}
      />
    </div>
  );
}
