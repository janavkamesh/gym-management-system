'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Task 4 — Log Payment
 * Inserts a row into payments linked to a member. 
 * Does not change expiry_date directly as that's handled by renewal/creation.
 */
export async function logPayment(memberId: string, amount: number, method: string, date: string) {
  const supabase = await createClient()
  
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      member_id: memberId,
      amount,
      method,
      date
    })
    .select()
    .single()

  if (error) throw error
  
  // Revalidate relevant pages where payment logic/dashboard is shown
  revalidatePath('/members')
  revalidatePath('/financials')
  return payment
}

/**
 * Task Feature B — Collect Payment Amount
 * Updates member expiry and logs a payment with backdated recognition.
 */
export async function collectPaymentAmount(memberId: string, amount: number, method: string) {
  const supabase = await createClient()

  // 1. Read current expiry_date and plan_id
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('expiry_date, plan_id')
    .eq('id', memberId)
    .single()

  if (memberError || !member) throw new Error('Member not found')

  // 2. Read duration_days for the plan
  const { data: plan, error: planError } = await supabase
    .from('plans')
    .select('duration_days')
    .eq('id', member.plan_id)
    .single()

  if (planError || !plan) throw new Error('Plan not found')

  // 3. Calculate new_expiry_date = old_expiry_date + duration_days
  const oldExpiryDate = new Date(member.expiry_date)
  const newExpiryDate = new Date(oldExpiryDate)
  newExpiryDate.setDate(newExpiryDate.getDate() + plan.duration_days)
  
  const oldExpiryStr = oldExpiryDate.toISOString().split('T')[0]
  const newExpiryStr = newExpiryDate.toISOString().split('T')[0]

  // 4. Update members.expiry_date
  const { error: updateError } = await supabase
    .from('members')
    .update({ expiry_date: newExpiryStr })
    .eq('id', memberId)

  if (updateError) throw updateError

  // 6 & 7. Insert payment with date = old_expiry_date
  // We added collected_date via SQL (it defaults to NOW() if not specified, but let's be explicit just in case)
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      member_id: memberId,
      amount: amount,
      method: method,
      date: oldExpiryStr,
      collected_date: new Date().toISOString()
    })
    .select()
    .single()

  if (paymentError) {
    // If it fails because collected_date doesn't exist, we fallback
    console.error("Payment insert error:", paymentError);
    throw paymentError;
  }

  revalidatePath('/members')
  revalidatePath('/financials')
  revalidatePath('/')
  
  return payment
}

