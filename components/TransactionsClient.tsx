'use client';

import TransactionsTable from './TransactionsTable';
import PageHeader from './PageHeader';

interface TransactionsClientProps {
  initialExpenses?: any[] | null; // Kept for backward compatibility if still passed from somewhere, but ignored
  distinctCategories: string[];
  hideHeader?: boolean;
  sharedPeriod?: string;
  sharedFrom?: string;
  sharedTo?: string;
  onPeriodChange?: (period: string, from?: string, to?: string) => void;
  animationClass?: string;
  isAnimating?: boolean;
  onAnimationEnd?: () => void;
}

export default function TransactionsClient({
  distinctCategories,
  hideHeader = false,
  sharedPeriod,
  sharedFrom,
  sharedTo,
  onPeriodChange,
  animationClass,
  isAnimating,
  onAnimationEnd
}: TransactionsClientProps) {
  return (
    <div className={hideHeader ? "w-full" : "px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto w-full"}>
      <PageHeader 
        title="Transactions" 
        subtitle="A complete ledger of all money in and money out." 
        hidden={hideHeader}
        className="mb-6 lg:mb-6"
      />

      <TransactionsTable 
        categories={distinctCategories} 
        sharedPeriod={sharedPeriod}
        sharedFrom={sharedFrom}
        sharedTo={sharedTo}
        onPeriodChange={onPeriodChange}
        isMobileTab={hideHeader}
        animationClass={animationClass}
        isAnimating={isAnimating}
        onAnimationEnd={onAnimationEnd}
      />
    </div>
  );
}
