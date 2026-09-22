'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Task 1 — Create Member
 * Inserts a new member row. Fetches the plan duration to compute expiry_date.
 */
export async function createMember(data: { 
  name: string; 
  phone: string; 
  plan_id: string; 
  join_date: string;
  expiry_date?: string;
  payment_amount?: number;
  payment_method?: string;
}) {
  const supabase = await createClient()
  
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) throw new Error('Not authenticated')

  let finalExpiryDate = data.expiry_date;
  if (!finalExpiryDate) {
    // Fetch plan duration to calculate expiry_date
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('duration_days')
      .eq('id', data.plan_id)
      .single()

    if (planError || !plan) throw new Error('Plan not found')

    const joinDate = new Date(data.join_date)
    const expiryDate = new Date(joinDate)
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days)
    finalExpiryDate = expiryDate.toISOString().split('T')[0]
  }

  const { data: member, error } = await supabase
    .from('members')
    .insert({
      user_id: userData.user.id,
      plan_id: data.plan_id,
      name: data.name,
      phone: data.phone,
      join_date: data.join_date,
      expiry_date: finalExpiryDate,
      status: 'Active'
    })
    .select()
    .single()

  if (error) throw error

  if (data.payment_amount && data.payment_amount > 0) {
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        member_id: member.id,
        amount: data.payment_amount,
        method: data.payment_method || 'Cash',
        date: new Date().toISOString().split('T')[0]
      });
    
    if (paymentError) {
      console.error('Payment insertion failed:', paymentError);
    }
  }
  
  revalidatePath('/members')
  revalidatePath('/financials')
  revalidatePath('/') // Dashboard
  return member
}

/**
 * Task 2 — Update Member
 * Updates editable fields. Recalculates expiry_date if plan_id or join_date changes.
 */
export async function updateMember(memberId: string, data: { name?: string; phone?: string; plan_id?: string; join_date?: string }) {
  const supabase = await createClient()
  
  const updates: Record<string, any> = { ...data }

  // Recalculate expiry_date if plan or join_date changes
  if (data.plan_id || data.join_date) {
    const { data: currentMember, error: memberError } = await supabase
      .from('members')
      .select('plan_id, join_date')
      .eq('id', memberId)
      .single()

    if (memberError || !currentMember) throw new Error('Member not found')

    const newPlanId = data.plan_id || currentMember.plan_id
    const newJoinDateStr = data.join_date || currentMember.join_date

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('duration_days')
      .eq('id', newPlanId)
      .single()

    if (planError || !plan) throw new Error('Plan not found')

    const joinDate = new Date(newJoinDateStr)
    const expiryDate = new Date(joinDate)
    expiryDate.setDate(expiryDate.getDate() + plan.duration_days)

    updates.expiry_date = expiryDate.toISOString().split('T')[0]
  }

  const { data: updated, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/members')
  revalidatePath('/')
  return updated
}

/**
 * Task 3 — Freeze / Pause
 * Suspends the account and pushes expiry_date forward by the freeze duration.
 */
export async function freezeMember(memberId: string, freezeStart: string, freezeEnd: string) {
  const supabase = await createClient()

  const start = new Date(freezeStart)
  const end = new Date(freezeEnd)
  
  // Calculate freeze duration in days (freeze_end - freeze_start)
  const diffTime = end.getTime() - start.getTime()
  const freezeDurationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (freezeDurationDays <= 0) {
    throw new Error('Freeze end date must be after freeze start date')
  }

  // Fetch current expiry_date
  const { data: member, error: fetchError } = await supabase
    .from('members')
    .select('expiry_date')
    .eq('id', memberId)
    .single()

  if (fetchError || !member) throw new Error('Member not found')

  const expiryDate = new Date(member.expiry_date)
  expiryDate.setDate(expiryDate.getDate() + freezeDurationDays)

  const { data: updated, error } = await supabase
    .from('members')
    .update({
      freeze_start: start.toISOString().split('T')[0],
      freeze_end: end.toISOString().split('T')[0],
      expiry_date: expiryDate.toISOString().split('T')[0]
    })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  
  revalidatePath('/members')
  revalidatePath('/')
  return updated
}

/**
 * Task 4 — Delete Member
 * Removes a member from the database.
 */
export async function deleteMember(memberId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', memberId)

  if (error) throw error
  
  revalidatePath('/members')
  revalidatePath('/')
  return true
}
