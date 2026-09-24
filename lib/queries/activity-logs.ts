'use server';

import { createClient } from '@/lib/supabase/server';
import { PLACEHOLDER_USER_ID } from '@/lib/constants';
import { ActivityCategory } from '@/lib/activity-log';

export interface GetActivityLogsParams {
  category?: ActivityCategory | 'All';
  search?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  cursor?: { created_at: string; id: string };
}

export async function getActivityLogs({
  category,
  search,
  fromDate,
  toDate,
  limit = 50,
  cursor
}: GetActivityLogsParams) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id || PLACEHOLDER_USER_ID;

  let query = supabase
    .from('activity_logs')
    .select('id, category, action, description, entity_name, amount, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (fromDate) {
    query = query.gte('created_at', fromDate);
  }

  if (toDate) {
    query = query.lte('created_at', toDate);
  }

  if (search && search.trim() !== '') {
    // Sanitize for ilike
    const sanitizedSearch = search
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    query = query.ilike('description', `%${sanitizedSearch}%`);
  }

  if (cursor) {
    query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('getActivityLogs error:', error);
    throw new Error('Failed to load activity. Check your connection.');
  }

  const hasMore = (data?.length || 0) > limit;
  const rows = hasMore ? data.slice(0, limit) : (data || []);
  
  return {
    data: rows,
    hasMore
  };
}
