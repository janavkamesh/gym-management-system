import { createClient } from '@/lib/supabase/server'
import MembersClient from '@/components/MembersClient'
import { mapMemberData } from '@/lib/utils/members'
import FirstLoadSuspense from '@/components/FirstLoadSuspense'
import Skeleton from './Skeleton'

export const dynamic = 'force-dynamic';

export default function MembersPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  return (
    <FirstLoadSuspense fallback={<Skeleton />}>
      <MembersContent {...props} />
    </FirstLoadSuspense>
  );
}

async function MembersContent(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const filter = searchParams.filter as string | undefined;
  const memberId = searchParams.memberId as string | undefined;
  const openMember = searchParams.openMember as string | undefined;
  const action = searchParams.action as string | undefined;

  const supabase = await createClient();

  const [
    { data: plansData },
    { data: membersData },
    { data: trainersData },
    { count: archivedCount }
  ] = await Promise.all([
    supabase.from('plans').select('*'),
    supabase.from('members').select('*, plans(*), payments(*), pt_assignments(*)').is('archived_at', null),
    supabase.from('trainers').select('*').is('archived_at', null).order('name'),
    supabase.from('members').select('*', { count: 'exact', head: true }).not('archived_at', 'is', null)
  ]);

  const mappedMembers = (membersData || []).map(mapMemberData);

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <MembersClient 
        initialMembers={mappedMembers} 
        plans={plansData || []} 
        trainers={trainersData || []} 
        initialArchivedCount={archivedCount || 0} 
        initialFilter={filter}
        initialMemberId={memberId}
        initialOpenMember={openMember}
        initialAction={action}
      />
    </div>
  );
}
