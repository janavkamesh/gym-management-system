import { createClient } from '@/lib/supabase/server';
import { 
  getExpenses, 
  getProfitability, 
  getProjectedRevenue, 
  getRevenueSplit, 
  getPaymentMethodSplit, 
  getTrendPayments,
  getSixMonthRevenueAndExpenses,
  getPlanBreakdown,
  getNewVsLostMembers
} from '@/lib/queries/financials';
import { getDistinctCategories } from '@/lib/queries/transactions';
import FinancialsClient from '../../components/FinancialsClient';

export const dynamic = 'force-dynamic';

export default async function FinancialsPage() {
  const supabase = await createClient();
  
  let expensesData: any[] | null = [];
  let profitabilityData: { revenue: number; expenses: number; netProfit: number } | null = { revenue: 0, expenses: 0, netProfit: 0 };
  let projectedRevenueData: number | null = 0;
  let revenueSplitData: { newRevenue: number; renewalRevenue: number } | null = { newRevenue: 0, renewalRevenue: 0 };
  let paymentMethodSplitData: { Cash: number; UPI: number; Card: number } | null = { Cash: 0, UPI: 0, Card: 0 };
  let initialTrendPaymentsData: any[] | null = [];
  let initialSixMonthData: any[] | null = [];
  let initialPlanBreakdownData: any[] | null = [];
  let initialNewVsLostData: any[] | null = [];
  let distinctCategories: string[] = [];
  let initialError: string | undefined;

  const now = new Date();
  const initialStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const initialEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  try {
    const results = await Promise.allSettled([
      getExpenses(),
      getProfitability(),
      getProjectedRevenue(),
      getRevenueSplit(),
      getPaymentMethodSplit(),
      getTrendPayments(initialStart, initialEnd),
      getDistinctCategories(),
      getSixMonthRevenueAndExpenses(),
      getPlanBreakdown(initialEnd),
      getNewVsLostMembers(initialStart, initialEnd)
    ]);

    // Check if ANY of them failed to trigger the global toast
    const hasError = results.some(r => r.status === 'rejected');
    if (hasError) {
      const errorMessages = results
        .map((r, i) => r.status === 'rejected' ? `Query ${i}: ${r.reason?.message || r.reason?.code || JSON.stringify(r.reason, Object.getOwnPropertyNames(r.reason))}` : null)
        .filter(Boolean)
        .join(' | ');
      initialError = "Failed to load financials: " + errorMessages;
      // For debugging in server logs
      results.forEach((r, i) => {
        if (r.status === 'rejected') console.error(`Financials query ${i} failed:`, r.reason);
      });
    }

    expensesData = results[0].status === 'fulfilled' ? results[0].value : null;
    profitabilityData = results[1].status === 'fulfilled' ? results[1].value : null;
    projectedRevenueData = results[2].status === 'fulfilled' ? results[2].value : null;
    revenueSplitData = results[3].status === 'fulfilled' ? results[3].value : null;
    paymentMethodSplitData = results[4].status === 'fulfilled' ? results[4].value : null;
    initialTrendPaymentsData = results[5].status === 'fulfilled' ? results[5].value : null;
    distinctCategories = results[6].status === 'fulfilled' ? results[6].value : [];
    initialSixMonthData = results[7].status === 'fulfilled' ? results[7].value : null;
    initialPlanBreakdownData = results[8].status === 'fulfilled' ? results[8].value : null;
    initialNewVsLostData = results[9].status === 'fulfilled' ? results[9].value : null;

  } catch (error) {
    initialError = "Failed to load financials. Check your connection.";
  }

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <FinancialsClient 
        initialExpenses={expensesData}
        profitability={profitabilityData}
        projectedRevenue={projectedRevenueData}
        revenueSplit={revenueSplitData}
        paymentMethodSplit={paymentMethodSplitData}
        initialTrendPayments={initialTrendPaymentsData}
        initialSixMonthData={initialSixMonthData}
        initialPlanBreakdownData={initialPlanBreakdownData}
        initialNewVsLostData={initialNewVsLostData}
        distinctCategories={distinctCategories}
        initialError={initialError}
      />
    </div>
  );
}
