'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './ToastProvider';
import { getTransactions, getTransactionsSummary, TransactionFilters } from '@/lib/queries/transactions';
import { formatINR } from '@/lib/utils/formatters';
import { Filter, X, Search, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';
import { DatePicker } from './DatePicker';
import { FilterCard } from './FilterCard';
import Badge from './ui/Badge';
import { StatCard } from './ui/StatCard';

export default function TransactionsTable({ categories }: { categories: string[] }) {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_in: 0, total_out: 0, net: 0 });
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const now = new Date();
  const initialStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const initialEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [period, setPeriod] = useState('This Month');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [direction, setDirection] = useState<'all' | 'in' | 'out'>('all');
  const [from, setFrom] = useState(initialStart);
  const [to, setTo] = useState(initialEnd);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { showToast } = useToast();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);
  const requestCounter = useRef(0);
  
  const dateError = !!(from && to && from > to);
  const hasActiveFilters = !!(search || category !== 'All' || direction !== 'all' || period !== 'This Month' || from !== initialStart || to !== initialEnd);

  const fetchTransactions = useCallback(async (isLoadMore = false) => {
    if (dateError) return;
    
    const reqId = ++requestCounter.current;
    if (isLoadMore) setIsLoading(true);
    else setIsInitialLoading(true);

    try {
      const currentOffset = isLoadMore ? offset : 0;
      const filters: TransactionFilters = { search, category, direction, from, to };
      
      const [result, sumResult] = await Promise.all([
        getTransactions(filters, 50, currentOffset),
        !isLoadMore ? getTransactionsSummary(filters) : Promise.resolve(null)
      ]);

      if (reqId === requestCounter.current) {
        if (isLoadMore) {
          setData(prev => [...prev, ...result.data]);
        } else {
          setData(result.data);
          if (sumResult) setSummary(sumResult);
        }
        setHasMore(result.hasMore);
        setOffset(currentOffset + 50);
      }
    } catch (err: any) {
      if (reqId === requestCounter.current) {
        showToast('Failed to load transactions. Check your connection.', 'error');
      }
    } finally {
      if (reqId === requestCounter.current) {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    }
  }, [search, category, direction, from, to, dateError, offset, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, direction, from, to]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading && !isInitialLoading) {
        fetchTransactions(true);
      }
    }, { rootMargin: '100px' });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoading, isInitialLoading, fetchTransactions]);

  const handleClear = () => {
    setSearch('');
    setCategory('All');
    setDirection('all');
    setPeriod('This Month');
    setFrom(initialStart);
    setTo(initialEnd);
  };

  return (
    <div className="space-y-6">
      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total In" value={isInitialLoading ? '-' : formatINR(summary.total_in)} icon={TrendingUp} variant="green" />
        <StatCard title="Total Out" value={isInitialLoading ? '-' : formatINR(summary.total_out)} icon={TrendingDown} variant="red" />
        <StatCard title="Net" value={isInitialLoading ? '-' : formatINR(summary.net)} icon={Wallet} variant="blue" />
      </div>

      {/* Filter Card */}
      <FilterCard
        variant="card"
        showSearch={true}
        search={search}
        onSearchChange={setSearch}
            searchPlaceholder="Search..."
            
            showDirection={true}
            direction={direction}
            onDirectionChange={(val) => setDirection(val as any)}
            directionOptions={[
              { value: 'all', label: 'All Directions' },
              { value: 'in', label: 'Money In' },
              { value: 'out', label: 'Money Out' }
            ]}

            showCategory={true}
            category={category}
            onCategoryChange={setCategory}
            categoryOptions={[
              { value: 'All', label: 'All Categories' },
              ...categories.map(cat => ({ value: cat, label: cat }))
            ]}

            showPeriod={true}
            period={period}
            onPeriodChange={(newPeriod) => {
              setPeriod(newPeriod);
              const today = new Date();
              let start: Date;
              let end: Date = new Date();
              if (newPeriod === 'Overall') {
                setFrom('');
                setTo('');
                return;
              } else if (newPeriod === 'This Month') {
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              } else if (newPeriod === 'Last 3 Months') {
                start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              } else if (newPeriod === 'Last 6 Months') {
                start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              } else if (newPeriod === 'This Year') {
                start = new Date(today.getFullYear(), 0, 1);
                end = new Date(today.getFullYear(), 11, 31);
              } else {
                return;
              }
              setFrom(start.toISOString().split('T')[0]);
              setTo(end.toISOString().split('T')[0]);
            }}
            periodOptions={[
              { value: 'Overall', label: 'Overall' },
              { value: 'This Month', label: 'This Month' },
              { value: 'Last 3 Months', label: 'Last 3 Months' },
              { value: 'Last 6 Months', label: 'Last 6 Months' },
              { value: 'This Year', label: 'This Year' }
            ]}

            showDatePickers={true}
            fromDate={from}
            onFromDateChange={setFrom}
            toDate={to}
            onToDateChange={setTo}
            dateError={dateError}

            hasActiveFilters={hasActiveFilters}
            onClear={handleClear}
          />

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <div className="overflow-x-auto overflow-y-hidden flex-1 flex flex-col min-h-0">
          <table className="w-full text-left min-w-[800px] flex flex-col flex-1 min-h-0">
            <thead className="table-header-dark border-b border-slate-200 text-slate-100 z-10 shrink-0">
              <tr className="grid grid-cols-[1.2fr_1fr_1.2fr_3fr_1fr_1fr]">
                <th className="px-4 md:px-6 font-medium text-sm">Date</th>
                <th className="px-4 md:px-6 font-medium text-sm">Direction</th>
                <th className="px-4 md:px-6 font-medium text-sm">Category</th>
                <th className="px-4 md:px-6 font-medium text-sm">Details</th>
                <th className="px-4 md:px-6 font-medium text-sm">Method</th>
                <th className="px-4 md:px-6 font-medium text-sm text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 flex-1 overflow-y-auto block min-h-0">
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse grid grid-cols-[1.2fr_1fr_1.2fr_3fr_1fr_1fr] items-center">
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-6 bg-slate-200 rounded-full w-12"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5 flex justify-end"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-12 text-center text-slate-500">
                    <p className="font-medium text-slate-900 mb-1">{hasActiveFilters ? "No matching transactions" : "No transactions yet"}</p>
                    <p className="text-sm">{hasActiveFilters ? "Try changing or clearing your filters." : "Payments and expenses will appear here."}</p>
                    {hasActiveFilters && (
                      <button onClick={handleClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((row: any) => {
                  const dt = new Date(row.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });
                  return (
                    <tr key={`${row.source_table}-${row.id}`} className={`hover:bg-slate-50/50 transition-colors grid grid-cols-[1.2fr_1fr_1.2fr_3fr_1fr_1fr] items-center ${row.is_voided ? 'opacity-50' : ''}`}>
                      <td className="px-4 md:px-6 py-[14px] text-sm text-slate-700 whitespace-nowrap">
                        {dt}
                      </td>
                      <td className="px-4 md:px-6 py-[14px] whitespace-nowrap">
                        {row.direction === 'in' ? (
                          <Badge className="gap-1 text-green-600 bg-green-50">
                            <ArrowDownRight size={14} /> In
                          </Badge>
                        ) : (
                          <Badge className="gap-1 text-red-600 bg-red-50">
                            <ArrowUpRight size={14} /> Out
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-[14px] text-sm font-medium text-slate-900 whitespace-nowrap">
                        {row.category}
                      </td>
                      <td className="px-4 md:px-6 py-[14px] text-sm text-slate-600 max-w-xs relative">
                        <div className="truncate" title={row.description}>
                          <span className={row.is_voided ? 'line-through' : ''}>{row.description}</span>
                          {row.is_edited && !row.is_voided && (
                            <span title={`Last edited: ${new Date(row.edited_at).toLocaleString()}`}>
                              <Badge className="ml-2 bg-blue-50 text-blue-600">
                                Edited
                              </Badge>
                            </span>
                          )}
                          {row.is_voided && (
                            <Badge className="ml-2 bg-red-100 text-red-700 uppercase tracking-wider">
                              Voided
                            </Badge>
                          )}
                        </div>
                        {row.is_voided && row.void_reason && (
                          <div className="text-xs text-red-600 mt-1 truncate">
                            Reason: {row.void_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-[14px] text-sm text-slate-500 whitespace-nowrap">
                        {row.method || '-'}
                      </td>
                      <td className={`px-4 md:px-6 py-[14px] text-sm font-medium text-right tabular-nums whitespace-nowrap ${row.is_voided ? 'text-slate-500 line-through' : row.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                        {row.direction === 'in' ? '+' : '-'}{formatINR(row.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
              
              {/* Infinite scroll sentinel */}
              {!isInitialLoading && data.length > 0 && (
                <tr ref={loadMoreRef}>
                  <td colSpan={6} className="px-4 py-4 text-center">
                    {isLoading ? (
                      <div className="flex justify-center items-center gap-2 text-sm text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                        Loading more...
                      </div>
                    ) : hasMore ? (
                      <button 
                        onClick={() => fetchTransactions(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Load more
                      </button>
                    ) : (
                      <p className="text-sm text-slate-500">End of transactions</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
