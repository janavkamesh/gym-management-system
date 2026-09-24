'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PLACEHOLDER_USER_ID } from '@/lib/constants'
import { logActivity } from '@/lib/activity-log'
import { formatINR } from '@/lib/utils/formatters'

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
  
  await logActivity({
    category: 'Expenses',
    action: 'Added',
    description: `Added expense ${data.category}: ${formatINR(data.amount)}`,
    entityType: 'expense',
    entityId: expense.id,
    amount: data.amount
  })

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

  const { data: expense } = await supabase.from('expenses').select('category, amount').eq('id', expenseId).single()

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    // RLS also protects this, but explicit equality is good practice
    .eq('user_id', userId)

  if (error) throw error
  
  await logActivity({
    category: 'Expenses',
    action: 'Removed',
    description: `Removed expense ${expense?.category}: ${formatINR(expense?.amount)}`,
    entityType: 'expense',
    entityId: expenseId,
    amount: expense?.amount
  })

  revalidatePath('/financials')
  return true
}

export async function editExpense(expenseId: string, data: { category?: string; amount?: number; date?: string; receipt_url?: string }) {
  const supabase = await createClient()

  const { data: oldExpense } = await supabase.from('expenses').select('*').eq('id', expenseId).single()
  if (!oldExpense) throw new Error('Expense not found')
  if (oldExpense.linked_entity_id) {
    throw new Error('This expense is linked to a salary payment — void the salary payment instead.')
  }

  const { data: updated, error } = await supabase
    .from('expenses')
    .update({
      category: data.category !== undefined ? data.category : oldExpense.category,
      amount: data.amount !== undefined ? data.amount : oldExpense.amount,
      date: data.date !== undefined ? data.date : oldExpense.date,
      receipt_url: data.receipt_url !== undefined ? data.receipt_url : oldExpense.receipt_url,
      is_edited: true,
      edited_at: new Date().toISOString()
    })
    .eq('id', expenseId)
    .select()
    .single()

  if (error) throw error

  await logActivity({
    category: 'Expenses',
    action: 'Edited',
    description: `Edited expense ${oldExpense.category}: ${formatINR(oldExpense.amount)} to ${formatINR(updated.amount)}`,
    entityType: 'expense',
    entityId: expenseId,
    amount: updated.amount,
    metadata: { old: oldExpense, new: updated }
  })

  revalidatePath('/financials')
  return updated
}

export async function voidExpense(expenseId: string, voidReason: string) {
  const supabase = await createClient()

  const { data: expense } = await supabase.from('expenses').select('*').eq('id', expenseId).single()
  if (!expense) throw new Error('Expense not found')
  if (expense.linked_entity_id) {
    throw new Error('This expense is linked to a salary payment — void the salary payment instead.')
  }

  const { error } = await supabase
    .from('expenses')
    .update({
      is_voided: true,
      voided_at: new Date().toISOString(),
      void_reason: voidReason
    })
    .eq('id', expenseId)

  if (error) throw error

  await logActivity({
    category: 'Expenses',
    action: 'Voided',
    description: `Voided expense ${expense.category}: ${formatINR(expense.amount)} (reason: ${voidReason})`,
    entityType: 'expense',
    entityId: expenseId,
    metadata: expense
  })

  revalidatePath('/financials')
  return true
}
