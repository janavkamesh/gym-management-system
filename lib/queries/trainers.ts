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
    .is('archived_at', null)
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
    .eq('is_active', true)
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

  const { data: ptPayments, error: ptError } = await supabase
    .from('payments')
    .select('amount, member_id')
    .eq('trainer_id', trainerId)
    .eq('payment_type', 'PT')
    .is('is_voided', false)
    .gte('date', startDate)
    .lte('date', endDate)

  let totalCommission = 0

  if (!ptError && ptPayments && ptPayments.length > 0) {
    for (const payment of ptPayments) {
      const { data: assignment } = await supabase
        .from('pt_assignments')
        .select('commission_percent, trainer_share')
        .eq('trainer_id', trainerId)
        .eq('member_id', payment.member_id)
        .order('assigned_date', { ascending: false })
        .limit(1)
        .single()

      if (assignment) {
        const sharePercent = Number(assignment.trainer_share || assignment.commission_percent || 0)
        totalCommission += Number(payment.amount) * (sharePercent / 100)
      }
    }
  }

  // 3. Sum undeducted salary advances for that month
  const { data: advances, error: advancesError } = await supabase
    .from('salary_advances')
    .select('id, amount')
    .eq('trainer_id', trainerId)
    .eq('deducted_flag', false)
    .gte('date', startDate)
    .lte('date', endDate)

  let totalAdvances = 0
  let advanceIds: string[] = []
  if (!advancesError && advances) {
    totalAdvances = advances.reduce((sum, adv) => sum + Number(adv.amount), 0)
    advanceIds = advances.map(adv => adv.id)
  }

  return {
    baseSalary,
    totalCommission,
    totalAdvances,
    netPayable: baseSalary + totalCommission - totalAdvances,
    advanceIds
  }
}
