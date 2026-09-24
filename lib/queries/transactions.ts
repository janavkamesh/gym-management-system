'use server';

import { createClient } from '../supabase/server';

export interface TransactionFilters {
  search?: string;
  category?: string;
  from?: string;
  to?: string;
  direction?: 'in' | 'out' | 'all';
}

export async function getDistinctCategories() {
  const supabase = await createClient();
  
  const { data: expenses } = await supabase.from('expenses').select('category');
  const { data: payments } = await supabase.from('payments').select('payment_type');
  
  const cats = new Set<string>();
  expenses?.forEach(e => { if (e.category) cats.add(e.category); });
  payments?.forEach(p => { if (p.payment_type) cats.add(p.payment_type); });
  
  return Array.from(cats).sort();
}

export async function getTransactions(filters: TransactionFilters, limit = 50, offset = 0) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_transactions_v2', {
    p_search: filters.search || null,
    p_category: filters.category || 'All',
    p_from_date: filters.from || null,
    p_to_date: filters.to || null,
    p_direction: filters.direction || 'all',
    p_limit: limit + 1, // fetch one extra to check if there are more
    p_offset: offset
  });

  if (error) throw error;

  const hasMore = data && data.length > limit;
  const slicedData = hasMore ? data.slice(0, limit) : data;

  return { data: slicedData || [], hasMore };
}

export async function getTransactionsSummary(filters: TransactionFilters) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_transactions_summary_v2', {
    p_search: filters.search || null,
    p_category: filters.category || 'All',
    p_from_date: filters.from || null,
    p_to_date: filters.to || null,
    p_direction: filters.direction || 'all'
  });

  if (error) throw error;

  return data?.[0] || { total_in: 0, total_out: 0, net: 0 };
}
