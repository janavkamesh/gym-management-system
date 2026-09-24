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

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [direction, setDirection] = useState<'all' | 'in' | 'out'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { showToast } = useToast();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);
  const requestCounter = useRef(0);
  
  const dateError = !!(from && to && from > to);
  const hasActiveFilters = !!(search || category !== 'All' || direction !== 'all' || from || to);

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
    setFrom('');
    setTo('');
  };

  return (
    <div className="mt-8 space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-2">Transactions</h2>
        <p className="text-sm text-slate-500">A complete ledger of all money in and money out.</p>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total In" value={isInitialLoading ? '-' : formatINR(summary.total_in)} icon={TrendingUp} variant="green" />
        <StatCard title="Total Out" value={isInitialLoading ? '-' : formatINR(summary.total_out)} icon={TrendingDown} variant="red" />
        <StatCard title="Net" value={isInitialLoading ? '-' : formatINR(summary.net)} icon={Wallet} variant="blue" />
      </div>

      {/* Filter card */}
      <FilterCard
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

        showDatePickers={true}
        fromDate={from}
        onFromDateChange={setFrom}
        toDate={to}
        onToDateChange={setTo}
        dateError={dateError}

        hasActiveFilters={hasActiveFilters}
        onClear={handleClear}
      />

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="overflow-x-auto flex-1 hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 table-header-dark border-b border-slate-200 text-slate-100 z-10">
              <tr>
                <th className="px-4 md:px-6 font-medium text-sm">Date</th>
                <th className="px-4 md:px-6 font-medium text-sm">Direction</th>
                <th className="px-4 md:px-6 font-medium text-sm">Category</th>
                <th className="px-4 md:px-6 font-medium text-sm w-1/3">Details</th>
                <th className="px-4 md:px-6 font-medium text-sm">Method</th>
                <th className="px-4 md:px-6 font-medium text-sm text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 md:px-6.5 md:py-3"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-4 md:px-6.5 md:py-3"><div className="h-6 bg-slate-200 rounded-full w-12"></div></td>
                    <td className="px-4 md:px-6.5 md:py-3"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-4 md:px-6.5 md:py-3"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                    <td className="px-4 md:px-6.5 md:py-3"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-4 md:px-6.5 md:py-3 flex justify-end"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
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
                    <tr key={`${row.source_table}-${row.id}`} className={`hover:bg-slate-50/50 transition-colors ${row.is_voided ? 'opacity-50' : ''}`}>
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
