import { createClient } from '@/lib/supabase/server';
import DashboardClient from '../components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: plansData } = await supabase.from('plans').select('*');
  const { data: membersData, error } = await supabase.from('members').select('*, plans(*), payments(*), pt_assignments(*)').is('archived_at', null);
  const { data: trainersData } = await supabase.from('trainers').select('*').is('archived_at', null).order('name');

  // Compute pending payment for each member
  const mappedMembers = (membersData || []).map((member: any) => {
    const planPrice = member.plans?.price || 0;
    const totalPaid = (member.payments || [])
      .filter((p: any) => !p.is_voided && p.period_end === member.expiry_date && p.payment_type === 'Membership')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const pendingAmount = Math.max(0, planPrice - totalPaid);
    return { ...member, pendingAmount };
  });

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <DashboardClient 
        initialMembers={mappedMembers}
        plans={plansData || []}
        trainers={trainersData || []}
        initialError={error ? "Failed to load members. Check your connection." : undefined}
      />
    </div>
  );
}
