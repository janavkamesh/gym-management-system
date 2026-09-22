import { createClient } from '@/lib/supabase/server';
import DashboardClient from '../components/DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: plansData } = await supabase.from('plans').select('*');
  const { data: membersData, error } = await supabase.from('members').select('*, plans(*)');

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <DashboardClient 
        initialMembers={membersData || []}
        plans={plansData || []}
        initialError={error ? "Failed to load members. Check your connection." : undefined}
      />
    </div>
  );
}
