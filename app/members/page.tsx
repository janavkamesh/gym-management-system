import { createClient } from '@/lib/supabase/server'
import MembersClient from '@/components/MembersClient'

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const supabase = await createClient();

  const { data: plansData } = await supabase.from('plans').select('*');
  const { data: membersData } = await supabase.from('members').select('*, plans(*), payments(*)');

  // Compute pending payment for each member
  // Pending Payment = plans.price - SUM(payments.amount)
  const mappedMembers = (membersData || []).map((member: any) => {
    const planPrice = member.plans?.price || 0;
    const totalPaid = (member.payments || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    const pendingAmount = Math.max(0, planPrice - totalPaid);

    return {
      ...member,
      pendingAmount
    };
  });

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <MembersClient initialMembers={mappedMembers} plans={plansData || []} />
    </div>
  );
}
