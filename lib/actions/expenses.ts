'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PLACEHOLDER_USER_ID } from '@/lib/constants'

async function getUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: userData } = await supabase.auth.getUser()
  return userData?.user?.id || PLACEHOLDER_USER_ID
}

/**
 * Task 1 — Create Expense
 * Inserts a new expense record for the authenticated user.
 */
export async function createExpense(data: { 
  category: string; 
  amount: number; 
  recurring_flag?: boolean; 
  receipt_url?: string;
  date?: string;
}) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      category: data.category,
      amount: data.amount,
      recurring_flag: data.recurring_flag || false,
      receipt_url: data.receipt_url || null,
      date: data.date || new Date().toISOString().split('T')[0]
    })
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/financials')
  return expense
}

/**
 * Task 1 — Delete Expense
 * Removes an expense from the database.
 */
export async function deleteExpense(expenseId: string) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    // RLS also protects this, but explicit equality is good practice
    .eq('user_id', userId)

  if (error) throw error
  
  revalidatePath('/financials')
  return true
}
