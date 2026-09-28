'use client';

import TransactionsTable from './TransactionsTable';
import PageHeader from './PageHeader';

interface TransactionsClientProps {
  initialExpenses?: any[] | null; // Kept for backward compatibility if still passed from somewhere, but ignored
  distinctCategories: string[];
  hideHeader?: boolean;
}

export default function TransactionsClient({
  distinctCategories,
  hideHeader = false,
}: TransactionsClientProps) {
  return (
    <div className={hideHeader ? "w-full" : "px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto w-full"}>
      <PageHeader 
        title="Transactions" 
        subtitle="A complete ledger of all money in and money out." 
        hidden={hideHeader}
        className="mb-3 lg:mb-6"
      />

      <TransactionsTable categories={distinctCategories} />
    </div>
  );
}
