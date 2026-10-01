'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './ToastProvider';
import { getTransactions, getTransactionsSummary, TransactionFilters } from '@/lib/queries/transactions';
import { formatINR } from '@/lib/utils/formatters';
import { Filter, X, Search, ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';
import { DatePicker } from './DatePicker';
import { FilterCard } from './FilterCard';
import Badge from './ui/Badge';
import { StatCard } from './ui/StatCard';
import { BottomSheet } from './ui/BottomSheet';

import { getPeriodRange, getPeriodSubtitle } from '@/lib/utils/date';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const getMobileDayLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  const isYesterday = d.getFullYear() === yesterday.getFullYear() && d.getMonth() === yesterday.getMonth() && d.getDate() === yesterday.getDate();
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export default function TransactionsTable({ 
  categories,
  sharedPeriod,
  sharedFrom,
  sharedTo,
  onPeriodChange,
  isMobileTab = false,
  animationClass = '',
  isAnimating = false,
  onAnimationEnd
}: { 
  categories: string[];
  sharedPeriod?: string;
  sharedFrom?: string;
  sharedTo?: string;
  onPeriodChange?: (period: string, from?: string, to?: string) => void;
  isMobileTab?: boolean;
  animationClass?: string;
  isAnimating?: boolean;
  onAnimationEnd?: () => void;
}) {
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ total_in: 0, total_out: 0, net: 0 });
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [internalPeriod, setInternalPeriod] = useState('This Month');
  const [internalFrom, setInternalFrom] = useState('');
  const [internalTo, setInternalTo] = useState('');

  const period = sharedPeriod !== undefined ? sharedPeriod : internalPeriod;
  const { from, to } = getPeriodRange(
    period,
    sharedPeriod !== undefined ? sharedFrom : internalFrom,
    sharedPeriod !== undefined ? sharedTo : internalTo
  );

  const handlePeriodChange = (p: string, f?: string, t?: string) => {
    if (onPeriodChange) {
      onPeriodChange(p, f, t);
    } else {
      setInternalPeriod(p);
      setInternalFrom(f || '');
      setInternalTo(t || '');
    }
  };

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [direction, setDirection] = useState<'all' | 'in' | 'out'>('all');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { showToast } = useToast();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);
  const requestCounter = useRef(0);
  
  const dateError = !!(from && to && from > to);
  const hasActiveFilters = !!(search || category !== 'All' || direction !== 'all' || period !== 'This Month');

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
    handlePeriodChange('This Month');
  };

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeFilterCount = (search ? 1 : 0) + (category !== 'All' ? 1 : 0) + (direction !== 'all' ? 1 : 0) + (period !== 'This Month' ? 1 : 0);

  return (
    <div>
      {isMobileTab && (
        <div className="flex lg:hidden justify-between items-center max-lg:mb-section lg:mb-6">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Transactions</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {getPeriodSubtitle(period, from, to)}
            </p>
          </div>
          
          <button 
            onClick={() => setIsSheetOpen(true)}
            className="flex items-center gap-1.5 min-h-12 px-4 rounded-lg bg-white border border-slate-200 shadow-sm font-medium text-slate-700 active:scale-95 transition-all touch-manipulation"
          >
            <div className="relative">
              <Filter size={18} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-navy text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </div>
            Filters
          </button>
        </div>
      )}

      <div className={`max-lg:space-y-section lg:space-y-6 ${animationClass} ${isAnimating ? 'overflow-x-clip' : ''}`} onAnimationEnd={onAnimationEnd}>
      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total In" value={isInitialLoading ? <div className="h-8 w-20 bg-white/30 animate-pulse rounded" /> : formatINR(summary.total_in)} icon={TrendingUp} colorClass="card-gradient-green" />
        <StatCard label="Total Out" value={isInitialLoading ? <div className="h-8 w-20 bg-white/30 animate-pulse rounded" /> : formatINR(summary.total_out)} icon={TrendingDown} colorClass="card-gradient-red" />
        <div className="col-span-2 md:col-span-1">
          <StatCard label="Net" value={isInitialLoading ? <div className="h-8 w-20 bg-white/30 animate-pulse rounded" /> : formatINR(summary.net)} icon={Wallet} colorClass="card-gradient-blue" />
        </div>
      </div>


      {/* Desktop Filter Card */}
      <div className={isMobileTab ? "hidden lg:block" : "block"}>
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
              const { from: newF, to: newT } = getPeriodRange(newPeriod, from, to);
              handlePeriodChange(newPeriod, newF, newT);
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
            onFromDateChange={(val) => handlePeriodChange('Custom', val, to)}
            toDate={to}
            onToDateChange={(val) => handlePeriodChange('Custom', from, val)}
            dateError={dateError}

            hasActiveFilters={hasActiveFilters}
            onClear={handleClear}
          />
      </div>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Filters"
        headerAction={
          hasActiveFilters ? (
            <button 
              onClick={handleClear}
              className="flex items-center gap-1.5 min-h-8 px-3 text-sm rounded-full bg-white border border-slate-200 shadow-sm font-semibold text-slate-900 active:scale-95 transition-all duration-120 touch-manipulation"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          ) : null
        }
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Time Period</label>
            <Dropdown
              value={period}
              onChange={(newPeriod) => {
                const { from: newF, to: newT } = getPeriodRange(newPeriod, from, to);
                handlePeriodChange(newPeriod, newF, newT);
              }}
              options={[
                { value: 'Overall', label: 'Overall' },
                { value: 'This Month', label: 'This Month' },
                { value: 'Last 3 Months', label: 'Last 3 Months' },
                { value: 'Last 6 Months', label: 'Last 6 Months' },
                { value: 'This Year', label: 'This Year' }
              ]}
              renderInline={true}
            />
          </div>
          
          {(period !== 'Overall') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">From</label>
                <DatePicker
                  value={from}
                  onChange={(val) => handlePeriodChange('Custom', val, to)}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">To</label>
                <DatePicker
                  value={to}
                  onChange={(val) => handlePeriodChange('Custom', from, val)}
                  placeholder="End date"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Direction</label>
            <Dropdown
              value={direction}
              onChange={(val) => setDirection(val as any)}
              options={[
                { value: 'all', label: 'All Directions' },
                { value: 'in', label: 'Money In' },
                { value: 'out', label: 'Money Out' }
              ]}
              renderInline={true}
            />
          </div>
          
          <div className="space-y-3 pb-8">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <Dropdown
              value={category}
              onChange={setCategory}
              options={[
                { value: 'All', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat, label: cat }))
              ]}
              renderInline={true}
            />
          </div>
        </div>
      </BottomSheet>

      {/* Mobile Search & Feed Group */}
      <div className="max-lg:space-y-control">
        {/* Mobile Search */}
        {isMobileTab && (
          <div className="lg:hidden relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
        )}

        {/* Mobile Feed */}
        <div className="block lg:hidden">
        {isInitialLoading ? (
          <div className="mobile-table-card">
            <ul className="flex flex-col divide-y divide-slate-200">
              <li className="flex flex-col">
                <div className="table-header-dark px-4 py-1.5 text-xs min-[380px]:text-sm font-medium text-slate-100">
                  <div className="h-3 w-16 bg-slate-600 rounded animate-pulse" />
                </div>
                <ul className="divide-y divide-slate-200">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <li key={i} className="mobile-table-row px-4 !py-3 !min-h-0 items-start">
                      <div className="flex items-start justify-between gap-3 w-full animate-pulse">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full mt-[5px] shrink-0 bg-slate-200" />
                          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                            <div className="h-4 bg-slate-200 rounded w-3/4" />
                            <div className="flex items-center gap-2">
                              <div className="h-5 bg-slate-200 rounded-full w-16" />
                              <div className="h-3 bg-slate-200 rounded w-12" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        ) : data.length === 0 ? (
          <div className="mobile-table-card p-8 text-center text-slate-500">
            <p className="font-medium text-slate-900 mb-1">
              No transactions found{period === 'Overall' ? '' : period === 'Custom' ? ' in this period' : ` in ${period}`}
            </p>
            <p className="text-sm">
              {(search || category !== 'All' || direction !== 'all') ? "Try clearing your filters." : "Payments and expenses will appear here."}
            </p>
            {(search || category !== 'All' || direction !== 'all' || period !== 'This Month') && (
              <button onClick={handleClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="mobile-table-card">
            <ul className="flex flex-col divide-y divide-slate-200">
              {(() => {
                const mobileGroups: { key: string; label: string; rows: any[] }[] = [];
                const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                
                sortedData.forEach((row: any) => {
                  const key = row.date;
                  let group = mobileGroups.find(g => g.key === key);
                  if (!group) {
                    group = { key, label: getMobileDayLabel(row.date), rows: [] };
                    mobileGroups.push(group);
                  }
                  group.rows.push(row);
                });
                
                return mobileGroups.map((group) => (
                  <li key={group.key} className="flex flex-col">
                    <div className="table-header-dark px-4 py-1.5 text-xs min-[380px]:text-sm font-medium text-slate-100">
                      {group.label}
                    </div>
                    <ul className="divide-y divide-slate-200">
                      {group.rows.map(row => {
                        const isVoided = row.is_voided;
                        const directionColor = row.direction === 'in' ? 'bg-green-500' : 'bg-red-500';
                        
                        return (
                          <li key={`${row.source_table}-${row.id}`} className={`mobile-table-row px-4 !py-3 !min-h-0 items-start ${isVoided ? 'opacity-50' : ''}`}>
                            <div className="flex items-start justify-between gap-3 w-full">
                              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                <div className={`w-2 h-2 rounded-full mt-[5px] shrink-0 ${directionColor}`} aria-hidden="true" />
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                  <div className={`text-sm text-slate-900 leading-tight break-words ${isVoided ? 'line-through' : ''}`}>
                                    {row.description}
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 min-h-0">
                                      {row.category}
                                    </Badge>
                                    <span className="mobile-table-sub">
                                      {row.method || '-'}
                                    </span>
                                    {row.is_edited && !isVoided && (
                                      <Badge className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 min-h-0">
                                        Edited
                                      </Badge>
                                    )}
                                    {isVoided && (
                                      <Badge className="bg-red-100 text-red-700 uppercase tracking-wider text-[10px] px-2 py-0.5 min-h-0">
                                        Voided
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className={`text-sm font-medium tabular-nums shrink-0 ${isVoided ? 'text-slate-500 line-through' : row.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                {row.direction === 'in' ? '+' : '-'}{formatINR(row.amount)}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ));
              })()}
            </ul>
            {!isInitialLoading && data.length > 0 && (
              <div ref={loadMoreRef} className="px-4 py-4 text-center border-t border-slate-200 flex justify-center w-full">
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
                  <p className="text-sm text-slate-500 w-full text-center">End of transactions</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      <div className="hidden lg:flex bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
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
            <tbody className="divide-y divide-slate-200 flex-1 overflow-y-auto flex flex-col min-h-0">
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse grid grid-cols-[1.2fr_1fr_1.2fr_3fr_1fr_1fr] items-center w-full">
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-6 bg-slate-200 rounded-full w-12"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-4 md:px-6 md:py-3 py-3.5 flex justify-end"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr className="flex-1 flex items-center justify-center w-full">
                  <td colSpan={6} className="px-4 md:px-6 py-12 text-center text-slate-500 w-full">
                    <p className="font-medium text-slate-900 mb-1">No transactions found{period === 'Overall' ? '' : period === 'Custom' ? ' in this period' : ` in ${period}`}</p>
                    <p className="text-sm">{(search || category !== 'All' || direction !== 'all') ? "Try clearing your filters." : "Payments and expenses will appear here."}</p>
                    {(search || category !== 'All' || direction !== 'all' || period !== 'This Month') && (
                      <button onClick={handleClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((row: any) => {
                  const dt = new Date(row.date).toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' });
                  return (
                    <tr key={`${row.source_table}-${row.id}`} className={`hover:bg-slate-50/50 transition-colors grid grid-cols-[1.2fr_1fr_1.2fr_3fr_1fr_1fr] items-center w-full ${row.is_voided ? 'opacity-50' : ''}`}>
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
                <tr ref={loadMoreRef} className="w-full flex justify-center">
                  <td colSpan={6} className="px-4 py-4 text-center w-full flex justify-center">
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
                      <p className="text-sm text-slate-500 w-full text-center">End of transactions</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}


