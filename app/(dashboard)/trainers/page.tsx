import { createClient } from '@/lib/supabase/server'
import TrainersClient from '@/components/TrainersClient'
import { getTrainers } from '@/lib/queries/trainers'
import { redirect } from 'next/navigation'
import FirstLoadSuspense from '@/components/FirstLoadSuspense'
import Skeleton from './Skeleton'

export const dynamic = 'force-dynamic';

export default function TrainersPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return (
    <FirstLoadSuspense fallback={<Skeleton />}>
      <TrainersContent {...props} />
    </FirstLoadSuspense>
  );
}

async function TrainersContent(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const trainerId = searchParams.trainerId as string | undefined;
  const action = searchParams.action as string | undefined;

  const supabase = await createClient();

  // 1. Fetch Trainers
  const trainersData = await getTrainers(supabase);
  
  if (trainersData === null) {
    // If auth fails or query fails, just pass empty array to match other tabs
    // instead of redirecting to a non-existent /login route
  }

  // 2. Fetch Members (needed for the Add PT Assignment modal dropdown)
  // We only need id and name
  const { data: userData } = await supabase.auth.getUser();
  let membersData: any[] = [];
  
  if (userData.user) {
    const { data } = await supabase
      .from('members')
      .select('id, name')
      .eq('user_id', userData.user.id)
      .order('name', { ascending: true });
      
    membersData = data || [];
  }

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <TrainersClient 
        initialTrainers={trainersData || []} 
        members={membersData} 
      />
    </div>
  );
}
