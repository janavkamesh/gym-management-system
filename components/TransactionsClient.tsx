'use client';

import TransactionsTable from './TransactionsTable';

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
      {!hideHeader && (
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-2">Transactions</h1>
          <p className="text-sm text-slate-500">A complete ledger of all money in and money out.</p>
        </div>
      )}

      <TransactionsTable categories={distinctCategories} />
    </div>
  );
}
