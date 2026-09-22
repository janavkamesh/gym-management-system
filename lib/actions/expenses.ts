'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not authenticated')

  const { data: expense, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userData.user.id,
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

  // Verify auth strictly before deleting
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    // RLS also protects this, but explicit equality is good practice
    .eq('user_id', userData.user.id)

  if (error) throw error
  
  revalidatePath('/financials')
  return true
}
