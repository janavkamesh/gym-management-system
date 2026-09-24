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

// --- TRAINERS CRUD ---

export async function createTrainer(data: {
  name: string;
  phone: string;
  base_salary: number;
  join_date: string;
}) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { data: trainer, error } = await supabase
    .from('trainers')
    .insert({
      user_id: userId,
      name: data.name,
      phone: data.phone,
      base_salary: data.base_salary,
      join_date: data.join_date
    })
    .select()
    .single()

  if (error) throw error
  
  await logActivity({
    category: 'Trainers',
    action: 'Added',
    description: `Added trainer ${data.name}`,
    entityType: 'trainer',
    entityId: trainer.id,
    entityName: data.name
  })

  revalidatePath('/trainers')
  return trainer
}

export async function updateTrainer(trainerId: string, data: {
  name?: string;
  phone?: string;
  base_salary?: number;
}) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { data: trainer, error } = await supabase
    .from('trainers')
    .update(data)
    .eq('id', trainerId)
    .eq('user_id', userId) // explicit ownership check
    .select()
    .single()

  if (error) throw error
  
  await logActivity({
    category: 'Trainers',
    action: 'Edited',
    description: `Edited trainer ${trainer.name}`,
    entityType: 'trainer',
    entityId: trainer.id,
    entityName: trainer.name
  })

  revalidatePath('/trainers')
  return trainer
}

export async function deleteTrainer(trainerId: string) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { data: trainer } = await supabase.from('trainers').select('name').eq('id', trainerId).single()

  const { error } = await supabase
    .from('trainers')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', trainerId)
    .eq('user_id', userId)

  if (error) throw error
  
  await logActivity({
    category: 'Trainers',
    action: 'Removed',
    description: `Removed trainer ${trainer?.name || 'Unknown'}`,
    entityType: 'trainer',
    entityId: trainerId,
    entityName: trainer?.name
  })

  revalidatePath('/trainers')
  return true
}

export async function getArchivedTrainers() {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { data, error } = await supabase
    .from('trainers')
    .select('*')
    .eq('user_id', userId)
    .not('archived_at', 'is', null)
    .order('archived_at', { ascending: false })

  if (error) throw error
  return data
}

export async function restoreTrainer(trainerId: string) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { error } = await supabase
    .from('trainers')
    .update({ archived_at: null })
    .eq('id', trainerId)
    .eq('user_id', userId)

  if (error) throw error
  
  revalidatePath('/trainers')
  return true
}

// --- PT ASSIGNMENTS CRUD ---

export async function createPtAssignment(data: {
  trainer_id: string;
  member_id: string;
  commission_percent: number;
  assigned_date: string;
}) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  // Explicit ownership check
  const { data: trainer, error: trainerError } = await supabase
    .from('trainers')
    .select('id, name')
    .eq('id', data.trainer_id)
    .eq('user_id', userId)
    .single()

  if (trainerError || !trainer) throw new Error('Unauthorized or trainer not found')

  const { data: assignment, error } = await supabase
    .from('pt_assignments')
    .insert({
      trainer_id: data.trainer_id,
      member_id: data.member_id,
      commission_percent: data.commission_percent,
      assigned_date: data.assigned_date
    })
    .select()
    .single()

  if (error) throw error
  
  const { data: member } = await supabase.from('members').select('name').eq('id', data.member_id).single()

  await logActivity({
    category: 'Trainers',
    action: 'Assigned',
    description: `Assigned ${member?.name || 'Unknown'} to ${trainer.name || 'Unknown'} at ${data.commission_percent}% commission`,
    entityType: 'pt_assignment',
    entityId: assignment.id
  })

  revalidatePath('/trainers')
  return assignment
}

export async function deletePtAssignment(assignmentId: string, trainerId: string) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  // Explicit ownership check
  const { data: trainer, error: trainerError } = await supabase
    .from('trainers')
    .select('id, name')
    .eq('id', trainerId)
    .eq('user_id', userId)
    .single()

  if (trainerError || !trainer) throw new Error('Unauthorized or trainer not found')

  const { error } = await supabase
    .from('pt_assignments')
    .update({ is_active: false })
    .eq('id', assignmentId)
    .eq('trainer_id', trainerId)

  if (error) throw error
  
  const { data: assignmentData } = await supabase.from('pt_assignments').select('member_id').eq('id', assignmentId).single()
  let memberName = 'Unknown'
  if (assignmentData) {
    const { data: memberData } = await supabase.from('members').select('name').eq('id', assignmentData.member_id).single()
    if (memberData) memberName = memberData.name
  }

  await logActivity({
    category: 'Trainers',
    action: 'Removed',
    description: `Removed PT assignment for ${memberName} with ${trainer.name}`,
    entityType: 'pt_assignment',
    entityId: assignmentId
  })

  revalidatePath('/trainers')
  return true
}

// --- SALARY ADVANCES CRUD ---

export async function createSalaryAdvance(data: {
  trainer_id: string;
  amount: number;
  date: string;
  note?: string;
}) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  // Explicit ownership check
  const { data: trainer, error: trainerError } = await supabase
    .from('trainers')
    .select('id, name')
    .eq('id', data.trainer_id)
    .eq('user_id', userId)
    .single()

  if (trainerError || !trainer) throw new Error('Unauthorized or trainer not found')

  const { data: advance, error } = await supabase
    .from('salary_advances')
    .insert({
      trainer_id: data.trainer_id,
      amount: data.amount,
      date: data.date,
      note: data.note || null,
      deducted_flag: false // always starts false
    })
    .select()
    .single()

  if (error) throw error
  
  await logActivity({
    category: 'Trainers',
    action: 'Added',
    description: `Salary advance given: ${formatINR(data.amount)} for ${trainer.name}`,
    entityType: 'salary_advance',
    entityId: advance.id,
    amount: data.amount
  })

  revalidatePath('/trainers')
  return advance
}

export async function deleteSalaryAdvance(advanceId: string, trainerId: string) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  // Explicit ownership check
  const { data: trainer, error: trainerError } = await supabase
    .from('trainers')
    .select('id')
    .eq('id', trainerId)
    .eq('user_id', userId)
    .single()

  if (trainerError || !trainer) throw new Error('Unauthorized or trainer not found')

  const { error } = await supabase
    .from('salary_advances')
    .delete()
    .eq('id', advanceId)
    .eq('trainer_id', trainerId)

  if (error) throw error
  
  revalidatePath('/trainers')
  return true
}

// Task 5 - Mark Advance as Deducted
export async function markAdvanceDeducted(advanceId: string, trainerId: string, deducted: boolean = true) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  // Explicit ownership check
  const { data: trainer, error: trainerError } = await supabase
    .from('trainers')
    .select('id, name')
    .eq('id', trainerId)
    .eq('user_id', userId)
    .single()

  if (trainerError || !trainer) throw new Error('Unauthorized or trainer not found')

  const { data: advance, error } = await supabase
    .from('salary_advances')
    .update({ deducted_flag: deducted })
    .eq('id', advanceId)
    .eq('trainer_id', trainerId)
    .select()
    .single()

  if (error) throw error
  
  await logActivity({
    category: 'Trainers',
    action: 'Edited',
    description: `Marked salary advance of ${formatINR(advance.amount)} as ${deducted ? 'deducted' : 'pending'} for ${trainer.name}`,
    entityType: 'salary_advance',
    entityId: advance.id,
    amount: advance.amount
  })

  revalidatePath('/trainers')
  return advance
}

export async function paySalary(trainerId: string, monthStart: string, paidDate: string, method: string, note: string) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const d = new Date(monthStart)
  const month = d.getMonth() + 1 // 1-indexed
  const year = d.getFullYear()

  const salaryDetails = await calculateMonthlySalary(supabase, trainerId, month, year)
  if (!salaryDetails) throw new Error('Failed to calculate salary')

  const { baseSalary, totalCommission, totalAdvances, netPayable, advanceIds } = salaryDetails

  const { data: salaryPaymentId, error } = await supabase.rpc('pay_salary', {
    p_trainer_id: trainerId,
    p_month_start: monthStart,
    p_paid_date: paidDate,
    p_method: method,
    p_note: note,
    p_base_salary_snapshot: baseSalary,
    p_commission_snapshot: totalCommission,
    p_advances_deducted_snapshot: totalAdvances,
    p_net_paid: netPayable,
    p_user_id: userId,
    p_advance_ids: advanceIds
  })

  if (error) throw error

  const { data: trainer } = await supabase.from('trainers').select('name').eq('id', trainerId).single()
  
  await logActivity({
    category: 'Trainers',
    action: 'Salary Paid',
    description: `Paid salary for ${trainer?.name || 'Unknown'}: ${formatINR(netPayable)} for ${d.toLocaleString('default', { month: 'short', year: 'numeric' })}`,
    entityType: 'salary_payment',
    entityId: salaryPaymentId,
    amount: netPayable,
    metadata: { baseSalary, totalCommission, totalAdvances, advanceIds }
  })

  revalidatePath('/trainers')
  revalidatePath('/financials')
  return salaryPaymentId
}

export async function voidSalaryPayment(salaryPaymentId: string, voidReason: string) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { data: payment } = await supabase.from('salary_payments').select('*, trainers(name)').eq('id', salaryPaymentId).single()
  if (!payment) throw new Error('Payment not found')

  const { error } = await supabase.rpc('void_salary_payment', {
    p_salary_payment_id: salaryPaymentId,
    p_void_reason: voidReason,
    p_user_id: userId
  })

  if (error) throw error

  const d = new Date(payment.month_start)

  await logActivity({
    category: 'Trainers',
    action: 'Salary Voided',
    description: `Voided salary payment for ${payment.trainers?.name || 'Unknown'}: ${formatINR(payment.net_paid)} for ${d.toLocaleString('default', { month: 'short', year: 'numeric' })} (reason: ${voidReason})`,
    entityType: 'salary_payment',
    entityId: salaryPaymentId
  })

  revalidatePath('/trainers')
  revalidatePath('/financials')
  return true
}

// --- FETCH WRAPPERS FOR CLIENT COMPONENTS ---
import { getPtAssignments, getSalaryAdvances, calculateMonthlySalary } from '@/lib/queries/trainers'

export async function fetchPtAssignments(trainerId: string) {
  const supabase = await createClient()
  return getPtAssignments(supabase, trainerId)
}

export async function fetchSalaryAdvances(trainerId: string) {
  const supabase = await createClient()
  return getSalaryAdvances(supabase, trainerId)
}

export async function fetchSalarySummary(trainerId: string, month: number, year: number) {
  const supabase = await createClient()
  return calculateMonthlySalary(supabase, trainerId, month, year)
}
