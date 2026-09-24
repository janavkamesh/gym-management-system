'use server';

import { createClient } from '../supabase/server';

export async function getExpenses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .is('is_voided', false)
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getProfitability(fromDate?: string, toDate?: string) {
  const supabase = await createClient();
  
  let expQuery = supabase.from('expenses').select('amount').is('is_voided', false)
  let payQuery = supabase.from('payments').select('amount').is('is_voided', false)

  if (fromDate) {
    expQuery = expQuery.gte('date', fromDate)
    payQuery = payQuery.gte('date', fromDate)
  } else {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    expQuery = expQuery.gte('date', firstDayOfMonth)
    payQuery = payQuery.gte('date', firstDayOfMonth)
  }

  if (toDate) {
    expQuery = expQuery.lte('date', toDate)
    payQuery = payQuery.lte('date', toDate)
  }

  const { data: expenses, error: expError } = await expQuery
  if (expError) throw expError

  const { data: payments, error: payError } = await payQuery
  if (payError) throw payError

  const totalExpenses = (expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const totalRevenue = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return {
    revenue: totalRevenue,
    expenses: totalExpenses,
    netProfit: totalRevenue - totalExpenses
  }
}

export async function getProjectedRevenue() {
  const supabase = await createClient();
  
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
    
    if (diffDays <= 3) {
      projectedRevenue += Number((Array.isArray(member.plans) ? member.plans[0] : member.plans)?.price || 0)
    }
  })

  return projectedRevenue
}

export async function getRevenueSplit(fromDate?: string, toDate?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('payments')
    .select('amount, date, member_id, members!inner(join_date)')
    .is('is_voided', false)

  if (fromDate) {
    query = query.gte('date', fromDate)
  } else {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    query = query.gte('date', firstDayOfMonth)
  }

  if (toDate) {
    query = query.lte('date', toDate)
  }

  const { data: payments, error } = await query

  if (error) throw error

  let newRevenue = 0
  let renewalRevenue = 0

  ;(payments || []).forEach((payment: any) => {
    const paymentDate = new Date(payment.date)
    const joinDate = new Date(payment.members.join_date)
    
    const diffTime = paymentDate.getTime() - joinDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 3 && diffDays >= -1) {
      newRevenue += Number(payment.amount)
    } else {
      renewalRevenue += Number(payment.amount)
    }
  })

  return { newRevenue, renewalRevenue }
}

export async function getPaymentMethodSplit(fromDate?: string, toDate?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from('payments')
    .select('amount, method')
    .is('is_voided', false)

  if (fromDate) {
    query = query.gte('date', fromDate)
  } else {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    query = query.gte('date', firstDayOfMonth)
  }

  if (toDate) {
    query = query.lte('date', toDate)
  }

  const { data: payments, error } = await query

  if (error) throw error

  const split = { Cash: 0, UPI: 0, Card: 0 }
  
  ;(payments || []).forEach(p => {
    const method = p.method as keyof typeof split
    if (split[method] !== undefined) {
      split[method] += Number(p.amount)
    } else {
      split.Cash += Number(p.amount)
    }
  })

  return split
}

export async function getMonthlyRevenueTrend() {
  const supabase = await createClient();
  const now = new Date()
  
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startDateStr = sixMonthsAgo.toISOString().split('T')[0]

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, date')
    .is('is_voided', false)
    .gte('date', startDateStr)

  if (error) throw error

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

export async function getTrendPayments(fromDate?: string, toDate?: string) {
  const supabase = await createClient();
  let query = supabase.from('payments').select('amount, date').is('is_voided', false);
  
  if (fromDate) query = query.gte('date', fromDate);
  if (toDate) query = query.lte('date', toDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
