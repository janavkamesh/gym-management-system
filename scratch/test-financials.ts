import { createClient } from '@supabase/supabase-js'

// IMPORTANT: Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testFinancials() {
  console.log('--- Testing Financials Queries ---')
  
  // Note: To test the authenticated scoped functions via raw script, 
  // you must either login first or temporarily disable RLS, 
  // or use the Service Role Key for testing purposes.
  // Using Anon Key without a session will fail RLS for expenses.

  // 1. Test Profitability (Current Month)
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  
  console.log('\n[Task 2] Profitability (From', firstDayOfMonth, '):')
  const { data: exp } = await supabase.from('expenses').select('amount').gte('date', firstDayOfMonth)
  const { data: pay } = await supabase.from('payments').select('amount').gte('date', firstDayOfMonth)
  const totalExp = (exp || []).reduce((sum, e) => sum + Number(e.amount), 0)
  const totalRev = (pay || []).reduce((sum, p) => sum + Number(p.amount), 0)
  console.log({ revenue: totalRev, expenses: totalExp, netProfit: totalRev - totalExp })

  // 2. Test Projected Revenue
  console.log('\n[Task 3] Projected Revenue:')
  const { data: members } = await supabase.from('members').select('expiry_date, plans(price)')
  let projected = 0
  const today = new Date(); today.setHours(0,0,0,0)
  ;(members || []).forEach(m => {
    const diffDays = Math.ceil((new Date(m.expiry_date).getTime() - today.getTime()) / 86400000)
    if (diffDays <= 3) projected += Number(m.plans?.price || 0)
  })
  console.log({ projectedRevenue: projected })

  // 3. Test New vs Renewal Split
  console.log('\n[Task 4] New vs Renewal Split:')
  const { data: splitPay } = await supabase.from('payments').select('amount, date, member_id, members!inner(join_date)').gte('date', firstDayOfMonth)
  let newRev = 0, renRev = 0
  ;(splitPay || []).forEach((p: any) => {
    const diffDays = Math.floor((new Date(p.date).getTime() - new Date(p.members.join_date).getTime()) / 86400000)
    if (diffDays <= 3 && diffDays >= -1) newRev += Number(p.amount)
    else renRev += Number(p.amount)
  })
  console.log({ newRevenue: newRev, renewalRevenue: renRev })

  // 4. Test Payment Method Pie Chart
  console.log('\n[Task 5] Payment Method Split:')
  const { data: piePay } = await supabase.from('payments').select('amount, method').gte('date', firstDayOfMonth)
  const pie = { Cash: 0, UPI: 0, Card: 0 }
  ;(piePay || []).forEach(p => {
    const m = p.method as keyof typeof pie
    if (pie[m] !== undefined) pie[m] += Number(p.amount)
  })
  console.log(pie)

  // 5. Test MoM Bar Chart
  console.log('\n[Task 6] Month-over-Month (Last 6 Months):')
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]
  const { data: momPay } = await supabase.from('payments').select('amount, date').gte('date', sixMonthsAgo)
  console.log(`Fetched ${momPay?.length || 0} payments from the last 6 months.`)
}

testFinancials().catch(console.error)
