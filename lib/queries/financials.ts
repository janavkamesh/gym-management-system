import { SupabaseClient } from '@supabase/supabase-js'

export async function getExpenses(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProfitability(supabase: SupabaseClient) {
  // As assumed in the plan, calculating for Current Calendar Month
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const { data: expenses, error: expError } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', firstDayOfMonth)

  if (expError) throw expError

  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('amount')
    .gte('date', firstDayOfMonth)

  if (payError) throw payError

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const totalRevenue = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return {
    revenue: totalRevenue,
    expenses: totalExpenses,
    netProfit: totalRevenue - totalExpenses
  }
}

export async function getProjectedRevenue(supabase: SupabaseClient) {
  // Same logic as Dashboard Action List: members expiring soon or already expired
  // Projected revenue assumes they will renew their current plan
  
  const { data: members, error } = await supabase
    .from('members')
    .select('expiry_date, status, plans(price)')
    
  if (error) throw error

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let projectedRevenue = 0

  ;(members || []).forEach(member => {
    const expiry = new Date(member.expiry_date)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    // Status thresholds: Yellow (0-3 days) or Red (<0 days)
    if (diffDays <= 3) {
      projectedRevenue += Number((Array.isArray(member.plans) ? member.plans[0] : member.plans)?.price || 0)
    }
  })

  return projectedRevenue
}

export async function getRevenueSplit(supabase: SupabaseClient) {
  // Current Month New vs Renewal
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  // We need payments joined with member join_date
  // Since payments -> members is a relation, we can fetch it
  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, date, member_id, members!inner(join_date)')
    .gte('date', firstDayOfMonth)

  if (error) throw error

  let newRevenue = 0
  let renewalRevenue = 0

  ;(payments || []).forEach((payment: any) => {
    const paymentDate = new Date(payment.date)
    const joinDate = new Date(payment.members.join_date)
    
    const diffTime = paymentDate.getTime() - joinDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Assumption: If payment is made within 3 days of joining, it's "New Revenue"
    if (diffDays <= 3 && diffDays >= -1) {
      newRevenue += Number(payment.amount)
    } else {
      renewalRevenue += Number(payment.amount)
    }
  })

  return { newRevenue, renewalRevenue }
}

export async function getPaymentMethodSplit(supabase: SupabaseClient) {
  // Current Month Pie Chart
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, method')
    .gte('date', firstDayOfMonth)

  if (error) throw error

  const split = { Cash: 0, UPI: 0, Card: 0 }
  
  ;(payments || []).forEach(p => {
    const method = p.method as keyof typeof split
    if (split[method] !== undefined) {
      split[method] += Number(p.amount)
    } else {
      // Default to cash if invalid
      split.Cash += Number(p.amount)
    }
  })

  return split
}

export async function getMonthlyRevenueTrend(supabase: SupabaseClient) {
  // Last 6 months bar chart
  const now = new Date()
  
  // Calculate date 6 months ago (1st of that month)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startDateStr = sixMonthsAgo.toISOString().split('T')[0]

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, date')
    .gte('date', startDateStr)

  if (error) throw error

  // Initialize array for the last 6 months (chronological)
  const months: { month: string, year: number, revenue: number, monthIndex: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      month: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      revenue: 0,
      monthIndex: d.getMonth()
    })
  }

  ;(payments || []).forEach(p => {
    const pDate = new Date(p.date)
    const pMonth = pDate.getMonth()
    const pYear = pDate.getFullYear()
    
    const bucket = months.find(m => m.monthIndex === pMonth && m.year === pYear)
    if (bucket) {
      bucket.revenue += Number(p.amount)
    }
  })

  return months.map(m => ({ month: m.month, revenue: m.revenue }))
}
