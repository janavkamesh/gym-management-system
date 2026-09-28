import { getActivityLogs } from '@/lib/queries/activity-logs';
import ActivityLogsClient from '@/components/ActivityLogsClient';

export const dynamic = 'force-dynamic';

export default async function ActivityLogsPage() {
  let initialData: any[] = [];
  let initialHasMore = false;
  let initialError;

  try {
    const { data, hasMore } = await getActivityLogs({ limit: 50 });
    initialData = data;
    initialHasMore = hasMore;
  } catch (err: any) {
    initialError = err.message || 'Failed to load activity. Check your connection.';
  }

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <ActivityLogsClient 
        initialData={initialData} 
        initialHasMore={initialHasMore} 
        initialError={initialError} 
      />
    </div>
  );
}
