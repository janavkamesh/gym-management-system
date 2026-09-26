import { getDistinctCategories } from '@/lib/queries/transactions';
import TransactionsClient from '@/components/TransactionsClient';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  let distinctCategories: string[] = [];
  
  try {
    distinctCategories = await getDistinctCategories();
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <TransactionsClient 
        distinctCategories={distinctCategories}
      />
    </div>
  );
}
