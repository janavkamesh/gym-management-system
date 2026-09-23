import { SupabaseClient } from '@supabase/supabase-js'
import { PLACEHOLDER_USER_ID } from '@/lib/constants'

async function getUserId(supabase: SupabaseClient) {
  const { data: userData } = await supabase.auth.getUser()
  return userData?.user?.id || PLACEHOLDER_USER_ID
}

export async function getTrainers(supabase: SupabaseClient) {
  const userId = await getUserId(supabase)

  const { data, error } = await supabase
    .from('trainers')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching trainers:', error)
    return null
  }

  return data
}

export async function getPtAssignments(supabase: SupabaseClient, trainerId: string) {
  const { data, error } = await supabase
    .from('pt_assignments')
    .select(`
      *,
      member:members(name)
    `)
    .eq('trainer_id', trainerId)
    .order('assigned_date', { ascending: false })

  if (error) {
    console.error('Error fetching pt assignments:', error)
    return null
  }

  return data
}

export async function getSalaryAdvances(supabase: SupabaseClient, trainerId: string) {
  const { data, error } = await supabase
    .from('salary_advances')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching salary advances:', error)
    return null
  }

  return data
}

export async function calculateMonthlySalary(supabase: SupabaseClient, trainerId: string, month: number, year: number) {
  const userId = await getUserId(supabase)

  // 1. Verify ownership and get base salary
  const { data: trainer, error: trainerError } = await supabase
    .from('trainers')
    .select('base_salary')
    .eq('id', trainerId)
    .eq('user_id', userId)
    .single()

  if (trainerError || !trainer) {
    console.error('Trainer not found or unauthorized')
    return null
  }

  const baseSalary = Number(trainer.base_salary)

  // 2. Calculate Total Commission from member payments this month
  // Month is 1-indexed (1 = Jan, 12 = Dec)
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Last day of month

  const { data: assignments, error: assignmentsError } = await supabase
    .from('pt_assignments')
    .select('member_id, commission_percent')
    .eq('trainer_id', trainerId)

  let totalCommission = 0

  if (!assignmentsError && assignments && assignments.length > 0) {
    for (const assignment of assignments) {
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('member_id', assignment.member_id)
        .gte('date', startDate)
        .lte('date', endDate)

      if (payments) {
        const memberTotalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
        totalCommission += memberTotalPaid * (Number(assignment.commission_percent) / 100)
      }
    }
  }

  // 3. Sum undeducted salary advances for that month
  const { data: advances, error: advancesError } = await supabase
    .from('salary_advances')
    .select('amount')
    .eq('trainer_id', trainerId)
    .eq('deducted_flag', false)
    .gte('date', startDate)
    .lte('date', endDate)

  let totalAdvances = 0
  if (!advancesError && advances) {
    totalAdvances = advances.reduce((sum, adv) => sum + Number(adv.amount), 0)
  }

  return {
    baseSalary,
    totalCommission,
    totalAdvances,
    netPayable: baseSalary + totalCommission - totalAdvances
  }
}
