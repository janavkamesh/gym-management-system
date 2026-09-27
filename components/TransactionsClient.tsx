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
    <div className={hideHeader ? "w-full" : "p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8"}>
      <PageHeader 
        title="Transactions" 
        subtitle="A complete ledger of all money in and money out." 
        hidden={hideHeader}
        className="mb-6"
      />

      <TransactionsTable categories={distinctCategories} />
    </div>
  );
}
