'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { PLACEHOLDER_USER_ID } from '@/lib/constants'

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
  
  revalidatePath('/trainers')
  return trainer
}

export async function deleteTrainer(trainerId: string) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  const { error } = await supabase
    .from('trainers')
    .delete()
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
    .select('id')
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
  
  revalidatePath('/trainers')
  return assignment
}

export async function deletePtAssignment(assignmentId: string, trainerId: string) {
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
    .from('pt_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('trainer_id', trainerId)

  if (error) throw error
  
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
    .select('id')
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
    .select('id')
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
  
  revalidatePath('/trainers')
  return advance
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
