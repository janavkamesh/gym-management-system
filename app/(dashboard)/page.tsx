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

  const [
    { data: plansData },
    { data: membersData, error },
    { data: trainersData }
  ] = await Promise.all([
    supabase.from('plans').select('id, plan_name, price'),
    supabase.from('members').select('id, name, phone, join_date, expiry_date, plan_id, amount, gender, uid, archived_at, review_requested_at, plans(id, plan_name, price), payments(id, amount, is_voided, period_end, payment_type), pt_assignments(id, is_active, fee_amount, end_date, next_pt_due_date, duration_days, trainer_share, trainer_id)').is('archived_at', null),
    supabase.from('trainers').select('id, name').is('archived_at', null).order('name')
  ]);

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
