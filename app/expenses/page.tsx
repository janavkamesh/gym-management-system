import { getExpenses } from '@/lib/queries/financials';
import ExpensesClient from '@/components/ExpensesClient';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  let expensesData: any[] | null = [];
  
  try {
    expensesData = await getExpenses();
  } catch (error) {
    console.error(error);
    expensesData = null;
  }

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <ExpensesClient 
        initialExpenses={expensesData}
      />
    </div>
  );
}
