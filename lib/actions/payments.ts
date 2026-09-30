'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from '@/lib/activity-log'
import { formatINR } from '@/lib/utils/formatters'

export async function recalculateMemberExpiry(memberId: string) {
  const supabase = await createClient()

  const { data: payments, error: pError } = await supabase
    .from('payments')
    .select('period_end')
    .eq('member_id', memberId)
    .eq('payment_type', 'Membership')
    .is('is_voided', false)
    .order('period_end', { ascending: false })
    .limit(1)

  if (pError) throw pError

  let newExpiry: string

  if (payments && payments.length > 0 && payments[0].period_end) {
    newExpiry = payments[0].period_end
  } else {
    const { data: member } = await supabase.from('members').select('join_date').eq('id', memberId).single()
    if (!member) throw new Error('Member not found')
    newExpiry = member.join_date
  }

  const { error: updateError } = await supabase
    .from('members')
    .update({ expiry_date: newExpiry })
    .eq('id', memberId)

  if (updateError) throw updateError
}

export async function recalculatePtDueDate(assignmentId: string) {
  const supabase = await createClient()
  
  const { data: assignment } = await supabase
    .from('pt_assignments')
    .select('member_id, trainer_id, assigned_date')
    .eq('id', assignmentId)
    .single()
    
  if (!assignment) throw new Error('PT Assignment not found')

  const { data: payments, error: pError } = await supabase
    .from('payments')
    .select('period_start, period_end')
    .eq('member_id', assignment.member_id)
    .eq('trainer_id', assignment.trainer_id)
    .eq('payment_type', 'PT')
    .is('is_voided', false)
    .order('period_end', { ascending: false })
    .limit(1)

  if (pError) throw pError

  let newDueDate: string
  let newStartDate: string | null = null

  if (payments && payments.length > 0 && payments[0].period_end) {
    newDueDate = payments[0].period_end
    newStartDate = payments[0].period_start
  } else {
    newDueDate = assignment.assigned_date
  }

  const { error: updateError } = await supabase
    .from('pt_assignments')
    .update({ 
      next_pt_due_date: newDueDate,
      start_date: newStartDate,
      end_date: newDueDate
    })
    .eq('id', assignmentId)

  if (updateError) throw updateError
}

/**
 * Task 4 — Log Payment
 * Inserts a row into payments linked to a member. 
 * Does not change expiry_date directly as that's handled by renewal/creation.
 */
export async function logPayment(memberId: string, amount: number, method: string, date: string) {
  const supabase = await createClient()
  
  const { data: memberData } = await supabase.from('members').select('name, expiry_date, plan_id').eq('id', memberId).single()
  const { data: planData } = await supabase.from('plans').select('duration_days').eq('id', memberData?.plan_id).single()
  
  const expiryDate = memberData?.expiry_date ? new Date(memberData.expiry_date) : new Date();
  const startDate = new Date(expiryDate);
  if (planData) startDate.setDate(startDate.getDate() - planData.duration_days);
  
  const { data: payment, error } = await supabase
    .from('payments')
    .insert({
      member_id: memberId,
      amount,
      method,
      date,
      period_start: startDate.toISOString().split('T')[0],
      period_end: memberData?.expiry_date,
      payment_type: 'Membership'
    })
    .select()
    .single()

  if (error) throw error
  
  await logActivity({
    category: 'Payments',
    action: 'Collected',
    description: `Collected ${formatINR(amount)} via ${method} from ${memberData?.name || 'Unknown'}`,
    entityType: 'member',
    entityId: memberId,
    entityName: memberData?.name,
    amount: amount
  })

  // Revalidate relevant pages where payment logic/dashboard is shown
  revalidatePath('/members')
  revalidatePath('/financials')
  return payment
}

/**
 * Task Feature B — Collect Payment Amount
 * Updates member expiry and logs a payment with backdated recognition.
 */
export async function collectPaymentAmount(memberId: string, amount: number, method: string, customDate?: string) {
  const supabase = await createClient()

  // 1. Read current expiry_date and plan_id
  const { data: member, error: memberError } = await supabase
    .from('members')
    .select('name, expiry_date, plan_id')
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

  // 4. Insert payment with date = today (or customDate), period_start = oldExpiryStr, period_end = newExpiryStr
  const todayStr = customDate || new Date().toISOString().split('T')[0]
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      member_id: memberId,
      amount: amount,
      method: method,
      date: todayStr,
      collected_date: new Date().toISOString(),
      period_start: oldExpiryStr,
      period_end: newExpiryStr,
      payment_type: 'Membership'
    })
    .select()
    .single()

  if (paymentError) {
    console.error("Payment insert error:", paymentError);
    throw paymentError;
  }

  // 5. Recalculate member expiry
  await recalculateMemberExpiry(memberId)

  await logActivity({
    category: 'Payments',
    action: 'Collected',
    description: `Collected ${formatINR(amount)} via ${method} from ${member.name || 'Unknown'}`,
    entityType: 'member',
    entityId: memberId,
    entityName: member.name,
    amount: amount
  })

  revalidatePath('/members')
  revalidatePath('/financials')
  revalidatePath('/')
  
  return payment
}

/**
 * Task Feature A & B — Collect PT Payment Amount
 * Updates PT assignment next_pt_due_date and logs a payment with backdated recognition.
 */
export async function collectPtPayment(assignmentId: string, amount: number, method: string, customDate?: string) {
  const supabase = await createClient()

  // 1. Read current assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from('pt_assignments')
    .select('*')
    .eq('id', assignmentId)
    .single()

  if (assignmentError || !assignment) throw new Error('PT Assignment not found')

  // 2. Calculate new_next_pt_due_date = old_next_pt_due_date + duration_days
  const oldDueStr = assignment.end_date || assignment.next_pt_due_date || assignment.assigned_date
  if (!oldDueStr) throw new Error('No base date found to calculate from')
  
  const oldDueDate = new Date(oldDueStr)
  const newDueDate = new Date(oldDueDate)
  
  const duration = assignment.duration_days || 30 // fallback to 30 if null
  newDueDate.setDate(newDueDate.getDate() + duration)
  
  const newDueStr = newDueDate.toISOString().split('T')[0]

  // 3. Insert payment with date = today (or customDate), period_start = oldDueStr, period_end = newDueStr
  const todayStr = customDate || new Date().toISOString().split('T')[0]
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      member_id: assignment.member_id,
      amount: amount,
      method: method,
      date: todayStr,
      collected_date: new Date().toISOString(),
      payment_type: 'PT',
      trainer_id: assignment.trainer_id,
      period_start: oldDueStr,
      period_end: newDueStr
    })
    .select()
    .single()

  if (paymentError) {
    console.error("PT Payment insert error:", paymentError);
    throw paymentError;
  }

  // 4. Recalculate PT due date
  await recalculatePtDueDate(assignmentId)

  const { data: memberData } = await supabase.from('members').select('name').eq('id', assignment.member_id).single()
  await logActivity({
    category: 'Payments',
    action: 'Collected',
    description: `Collected ${formatINR(amount)} via ${method} from ${memberData?.name || 'Unknown'}`,
    entityType: 'member',
    entityId: assignment.member_id,
    entityName: memberData?.name,
    amount: amount
  })

  revalidatePath('/trainers')
  revalidatePath('/members')
  revalidatePath('/financials')
  revalidatePath('/')
  
  return payment
}

export async function editPayment(paymentId: string, data: { amount?: number; method?: string; date?: string; note?: string }) {
  const supabase = await createClient()

  const { data: oldPayment } = await supabase.from('payments').select('*, members(name)').eq('id', paymentId).single()
  if (!oldPayment) throw new Error('Payment not found')

  const { data: updated, error } = await supabase
    .from('payments')
    .update({
      amount: data.amount !== undefined ? data.amount : oldPayment.amount,
      method: data.method !== undefined ? data.method : oldPayment.method,
      date: data.date !== undefined ? data.date : oldPayment.date,
      is_edited: true,
      edited_at: new Date().toISOString(),
      edit_count: (oldPayment.edit_count || 0) + 1
    })
    .eq('id', paymentId)
    .select()
    .single()

  if (error) throw error

  await logActivity({
    category: 'Payments',
    action: 'Edited',
    description: `Edited payment for ${oldPayment.members?.name || 'Unknown'}: ${formatINR(oldPayment.amount)} to ${formatINR(updated.amount)}`,
    entityType: 'payment',
    entityId: paymentId,
    amount: updated.amount,
    metadata: { old: oldPayment, new: updated }
  })

  revalidatePath('/members')
  revalidatePath('/financials')
  revalidatePath('/')
  return updated
}

export async function voidPayment(paymentId: string, voidReason: string) {
  const supabase = await createClient()

  const { data: payment } = await supabase.from('payments').select('*, members(name), pt_assignments(id)').eq('id', paymentId).single()
  if (!payment) throw new Error('Payment not found')

  const { error } = await supabase
    .from('payments')
    .update({
      is_voided: true,
      voided_at: new Date().toISOString(),
      void_reason: voidReason
    })
    .eq('id', paymentId)

  if (error) throw error

  if (payment.payment_type === 'PT') {
    // Need assignment ID to recalculate. Fetch assignment via trainer_id and member_id
    const { data: assignment } = await supabase
      .from('pt_assignments')
      .select('id')
      .eq('trainer_id', payment.trainer_id)
      .eq('member_id', payment.member_id)
      .eq('is_active', true)
      .single()
    if (assignment) {
      await recalculatePtDueDate(assignment.id)
    }
  } else {
    await recalculateMemberExpiry(payment.member_id)
  }

  await logActivity({
    category: 'Payments',
    action: 'Voided',
    description: `Voided payment for ${payment.members?.name || 'Unknown'}: ${formatINR(payment.amount)} (reason: ${voidReason})`,
    entityType: 'payment',
    entityId: paymentId,
    metadata: payment
  })

  revalidatePath('/members')
  revalidatePath('/financials')
  revalidatePath('/')
  return true
}

export async function fetchMemberPayments(memberId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', memberId)
    .order('date', { ascending: false })
    .order('collected_date', { ascending: false })
    
  if (error) throw error
  return data
}

export async function fetchTrainerSalaryPayments(trainerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('salary_payments')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('month_start', { ascending: false })
    
  if (error) throw error
  return data
}
