import { SupabaseClient } from '@supabase/supabase-js'
import { PLACEHOLDER_USER_ID } from '@/lib/constants'
import { getPtStatusText } from '@/lib/utils/members'

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

export async function getTrainerStats(supabase: SupabaseClient, trainerId: string) {
  // 1. ptClientsCount (counting active PT assignments, meaning clients currently assigned)
  const { count: ptClientsCount } = await supabase
    .from('pt_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('trainer_id', trainerId)
    .eq('is_active', true)

  // 2. lifetimePaid
  const { data: payments } = await supabase
    .from('salary_payments')
    .select('net_paid')
    .eq('trainer_id', trainerId)
    .eq('is_voided', false)

  const lifetimePaid = (payments || []).reduce((sum, p) => sum + Number(p.net_paid || 0), 0)

  // 3. pendingAdvance
  const { data: advances } = await supabase
    .from('salary_advances')
    .select('amount')
    .eq('trainer_id', trainerId)
    .eq('deducted_flag', false)

  const pendingAdvance = (advances || []).reduce((sum, a) => sum + Number(a.amount || 0), 0)

  // 4. thisMonthStatus
  const d = new Date()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  const currentMonthStart = new Date(year, month - 1, 1).toISOString().split('T')[0]
  
  const salaryData = await calculateMonthlySalary(supabase, trainerId, month, year)
  const netPayable = salaryData?.netPayable || 0

  const { data: thisMonthPayments } = await supabase
    .from('salary_payments')
    .select('net_paid')
    .eq('trainer_id', trainerId)
    .eq('month_start', currentMonthStart)
    .eq('is_voided', false)

  const totalPaid = (thisMonthPayments || []).reduce((sum, p) => sum + Number(p.net_paid || 0), 0)
  
  const thisMonthStatus = (thisMonthPayments && thisMonthPayments.length > 0 && totalPaid >= netPayable) ? 'Paid' : 'Pending'

  return {
    ptClientsCount: ptClientsCount || 0,
    lifetimePaid,
    pendingAdvance,
    thisMonthStatus
  }
}

export async function getTrainerLedger(supabase: SupabaseClient, trainerId: string) {
  // Get salary payments
  const { data: salaries } = await supabase
    .from('salary_payments')
    .select('net_paid, paid_date, method, note')
    .eq('trainer_id', trainerId)
    .eq('is_voided', false)

  // Get salary advances
  const { data: advances } = await supabase
    .from('salary_advances')
    .select('amount, date, note')
    .eq('trainer_id', trainerId)

  const ledger: Array<{
    type: 'Salary' | 'Advance',
    amount: number,
    method: string | null,
    date: string,
    note: string | null
  }> = []

  if (salaries) {
    salaries.forEach(s => {
      ledger.push({
        type: 'Salary',
        amount: Number(s.net_paid || 0),
        method: s.method || null,
        date: s.paid_date,
        note: s.note || null
      })
    })
  }

  if (advances) {
    advances.forEach(a => {
      ledger.push({
        type: 'Advance',
        amount: Number(a.amount || 0),
        method: null, // advances don't have a method in schema
        date: a.date,
        note: a.note || null
      })
    })
  }

  // Sort by date, most recent first
  ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return ledger
}
export async function getTrainerPtClients(supabase: SupabaseClient, trainerId: string) {
  const { data: assignments, error } = await supabase
    .from('pt_assignments')
    .select(`
      *,
      member:members(
        name,
        uid,
        plan:plans(duration_days)
      )
    `)
    .eq('trainer_id', trainerId)
    .order('assigned_date', { ascending: false })

  if (error || !assignments) return []

  return assignments.map(a => {
    // Determine the plan duration
    // @ts-ignore
    const durationDays = a.member?.plan?.duration_days || 0
    let planText = 'Unknown'
    if (durationDays === 30) planText = '1 Month'
    else if (durationDays === 90) planText = '3 Months'
    else if (durationDays === 180) planText = '6 Months'
    else if (durationDays === 365) planText = '1 Year'
    else if (durationDays > 0) planText = `${durationDays} Days`

    const sharePercent = Number(a.trainer_share || a.commission_percent || 0)
    const shareAmount = (Number(a.fee_amount || 0) * sharePercent) / 100
    
    // Status color logic reusing members util
    const ptEndDate = a.end_date || a.next_pt_due_date || null
    const status = a.is_active ? getPtStatusText(ptEndDate) || 'Active' : 'Expired'

    return {
      // @ts-ignore
      memberName: a.member?.name || 'Unknown',
      // @ts-ignore
      memberUid: a.member?.uid,
      plan: planText,
      commissionPercent: sharePercent,
      shareAmount,
      assignedDate: a.assigned_date,
      status
    }
  })
}
