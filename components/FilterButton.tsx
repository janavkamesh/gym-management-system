import { Filter } from 'lucide-react';

export function getActiveFilterCount({
  period,
  defaultPeriod,
  category,
  direction
}: {
  period: string;
  defaultPeriod: string;
  category?: string;
  direction?: string;
}) {
  let count = 0;
  if (period !== defaultPeriod) count++;
  if (category && category !== 'All' && category !== 'All Categories') count++;
  if (direction && direction !== 'all') count++;
  return count;
}

interface FilterButtonProps {
  activeCount: number;
  onClick: () => void;
}

export default function FilterButton({ activeCount, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      aria-label="Filters"
      onClick={onClick}
      className="relative flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-lg bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-700 active:scale-95 transition-all touch-manipulation"
      style={{ paddingRight: activeCount > 0 ? '40px' : '16px' }}
    >
      <Filter size={18} />
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="absolute top-[6px] right-[6px] bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm pointer-events-none">
          {activeCount}
        </span>
      )}
    </button>
  );
}
