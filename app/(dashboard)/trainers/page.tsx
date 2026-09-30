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

  // Fetch all in parallel. Members query relies on RLS filtering by user_id automatically.
  const [
    trainersData,
    { data: membersDataRaw },
    { count: archivedCount }
  ] = await Promise.all([
    getTrainers(supabase),
    supabase.from('members').select('id, name').order('name', { ascending: true }),
    supabase.from('trainers').select('*', { count: 'exact', head: true }).not('archived_at', 'is', null)
  ]);

  const membersData = membersDataRaw || [];

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <TrainersClient 
        initialTrainers={trainersData || []} 
        members={membersData}
        initialArchivedCount={archivedCount || 0}
      />
    </div>
  );
}
