'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './ToastProvider';
import { getActivityLogs } from '@/lib/queries/activity-logs';
import { ActivityCategory } from '@/lib/activity-log';
import { formatINR } from '@/lib/utils/formatters';
import { Filter, X, Search, RotateCcw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from './ui/BottomSheet';
import { getPeriodRange, getPeriodSubtitle } from '@/lib/utils/date';
import { Dropdown } from './ui/Dropdown';
import { DatePicker } from './DatePicker';
import { FilterCard } from './FilterCard';
import Badge from './ui/Badge';
import PageHeader from './PageHeader';

const CATEGORY_COLORS: Record<string, string> = {
  Members: 'bg-blue-100 text-blue-700',
  Payments: 'bg-emerald-100 text-emerald-700',
  Leads: 'bg-violet-100 text-violet-700',
  Trainers: 'bg-sky-100 text-sky-700',
  Expenses: 'bg-rose-100 text-rose-700',
  WhatsApp: 'bg-teal-100 text-teal-700',
  Others: 'bg-slate-100 text-slate-700'
};

const formatDateTime = (iso: string) => {
  try {
    const d = new Date(iso);
    const datePart = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(d);
    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric', minute: '2-digit', hour12: true
    }).format(d);
    return { date: datePart, time: timePart };
  } catch (e) {
    return { date: iso, time: '' };
  }
};

const getISTStartOfDay = (dateString: string) => `${dateString}T00:00:00+05:30`;
const getISTEndOfDay = (dateString: string) => `${dateString}T23:59:59.999+05:30`;

export default function ActivityLogsClient({ initialData, initialHasMore, initialError }: any) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ActivityCategory | 'All'>('All');
  const [period, setPeriod] = useState('This Month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const { from: computedFrom, to: computedTo } = getPeriodRange(period, from, to);
  
  const handlePeriodChange = (p: string, f?: string, t?: string) => {
    setPeriod(p);
    setFrom(f || '');
    setTo(t || '');
  };
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const { showToast } = useToast();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);
  const requestCounter = useRef(0);
  const isFirstRender = useRef(true);
  
  const dateError = !!(computedFrom && computedTo && computedFrom > computedTo);
  const activeFilterCount = (search ? 1 : 0) + (category !== 'All' ? 1 : 0) + (period !== 'This Month' ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  useEffect(() => {
    if (initialError) showToast(initialError, 'error');
  }, [initialError, showToast]);

  const fetchLogs = useCallback(async (isLoadMore = false) => {
    if (dateError) return;
    
    const reqId = ++requestCounter.current;
    if (isLoadMore) setIsLoading(true);
    else setIsInitialLoading(true);

    try {
      const cursor = isLoadMore && data.length > 0 
        ? { created_at: data[data.length - 1].created_at, id: data[data.length - 1].id }
        : undefined;

      const fromDate = computedFrom ? getISTStartOfDay(computedFrom) : undefined;
      const toDate = computedTo ? getISTEndOfDay(computedTo) : undefined;

      const result = await getActivityLogs({
        search,
        category,
        fromDate,
        toDate,
        cursor
      });

      if (reqId === requestCounter.current) {
        if (isLoadMore) {
          setData((prev: any) => [...prev, ...result.data]);
        } else {
          setData(result.data);
        }
        setHasMore(result.hasMore);
      }
    } catch (err: any) {
      if (reqId === requestCounter.current) {
        showToast('Failed to load activity. Check your connection.', 'error');
      }
    } finally {
      if (reqId === requestCounter.current) {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    }
  }, [search, category, from, to, dateError, data, showToast]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchLogs(false);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, from, to]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoading && !isInitialLoading) {
        fetchLogs(true);
      }
    }, { rootMargin: '100px' });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoading, isInitialLoading, fetchLogs]);

  const handleClear = () => {
    setSearch('');
    setCategory('All');
    handlePeriodChange('This Month');
  };

  return (
    <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto space-y-3 lg:space-y-6">
      <div className="hidden lg:block">
        <PageHeader
          title="Activity Logs"
          subtitle="A permanent record of everything done in your gym."
        />
      </div>

      <div className="flex lg:hidden justify-between items-center mb-6 mt-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (window.history.length > 2) {
                router.back();
              } else {
                router.push('/');
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-700 shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {getPeriodSubtitle(period, computedFrom, computedTo)}
          </p>
          </div>
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
      
      <div className="lg:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search activity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
        />
      </div>

      <div className="hidden lg:block">
        <FilterCard
          variant="card"
          showSearch={true}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search activity..."

          showCategory={true}
          category={category}
          onCategoryChange={(val) => setCategory(val as ActivityCategory | 'All')}
          categoryOptions={[
            { value: 'All', label: 'All Categories' },
            { value: 'Members', label: 'Members' },
            { value: 'Payments', label: 'Payments' },
            { value: 'Leads', label: 'Leads' },
            { value: 'Trainers', label: 'Trainers' },
            { value: 'Expenses', label: 'Expenses' },
            { value: 'WhatsApp', label: 'WhatsApp' },
            { value: 'Others', label: 'Others' }
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
          fromDate={computedFrom}
          onFromDateChange={(val) => handlePeriodChange('Custom', val, to)}
          toDate={computedTo}
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
                  value={computedFrom}
                  onChange={(val) => handlePeriodChange('Custom', val, to)}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">To</label>
                <DatePicker
                  value={computedTo}
                  onChange={(val) => handlePeriodChange('Custom', from, val)}
                  placeholder="End date"
                />
              </div>
            </div>
          )}

          <div className="space-y-3 pb-8">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <Dropdown
              value={category}
              onChange={(val) => setCategory(val as ActivityCategory | 'All')}
              options={[
                { value: 'All', label: 'All Categories' },
                { value: 'Members', label: 'Members' },
                { value: 'Payments', label: 'Payments' },
                { value: 'Leads', label: 'Leads' },
                { value: 'Trainers', label: 'Trainers' },
                { value: 'Expenses', label: 'Expenses' },
                { value: 'WhatsApp', label: 'WhatsApp' },
                { value: 'Others', label: 'Others' }
              ]}
              renderInline={true}
            />
          </div>
        </div>
      </BottomSheet>

      {/* 3. Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        <div className="overflow-x-auto overflow-y-hidden flex-1 flex flex-col min-h-0">
          <table className="w-full text-left min-w-[800px] flex flex-col flex-1 min-h-0">
            <thead className="table-header-dark border-b border-slate-200 text-slate-100 z-10 shrink-0">
              <tr className="grid grid-cols-[1.2fr_1fr_1fr_2.2fr_0.8fr]">
                <th className="px-4 md:px-6 font-medium text-sm">Date & Time</th>
                <th className="px-4 md:px-6 font-medium text-sm">Category</th>
                <th className="px-4 md:px-6 font-medium text-sm">Action</th>
                <th className="px-4 md:px-6 font-medium text-sm">Details</th>
                <th className="px-4 md:px-6 font-medium text-sm text-center">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 flex-1 overflow-y-auto flex flex-col min-h-0">
              {isInitialLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse grid grid-cols-[1.2fr_1fr_1fr_2.2fr_0.8fr] items-center w-full">
                    <td className="px-4 md:px-6 py-3.5 md:py-3"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-4 md:px-6 py-3.5 md:py-3"><div className="h-6 bg-slate-200 rounded-full w-20"></div></td>
                    <td className="px-4 md:px-6 py-3.5 md:py-3"><div className="h-4 bg-slate-200 rounded w-20"></div></td>
                    <td className="px-4 md:px-6 py-3.5 md:py-3"><div className="h-4 bg-slate-200 rounded w-full"></div></td>
                    <td className="px-4 md:px-6 py-3.5 md:py-3 flex justify-center"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr className="flex-1 flex items-center justify-center w-full">
                  <td colSpan={5} className="px-4 md:px-6 py-12 text-center text-slate-500 w-full">
                    <p className="font-medium text-slate-900 mb-1">
                      No activity found{period === 'Overall' ? '' : period === 'Custom' ? ' in this period' : ` in ${period}`}
                    </p>
                    <p className="text-sm">
                      {(search || category !== 'All') ? "Try clearing your filters." : "Actions like adding members and logging payments will appear here."}
                    </p>
                    {hasActiveFilters && (
                      <button onClick={handleClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data.map((row: any) => {
                  const dt = formatDateTime(row.created_at);
                  const pillClass = CATEGORY_COLORS[row.category] || CATEGORY_COLORS['Others'];
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors grid grid-cols-[1.2fr_1fr_1fr_2.2fr_0.8fr] items-center w-full">
                      <td className="px-4 md:px-6 py-[14px] text-sm text-slate-700 whitespace-nowrap">
                        <div>{dt.date}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{dt.time}</div>
                      </td>
                      <td className="px-4 md:px-6 py-[14px] whitespace-nowrap">
                        <Badge className={pillClass}>
                          {row.category}
                        </Badge>
                      </td>
                      <td className="px-4 md:px-6 py-[14px] text-sm font-medium text-slate-900 whitespace-nowrap">
                        {row.action}
                      </td>
                      <td className="px-4 md:px-6 py-[14px] text-sm text-slate-600 max-w-xs">
                        <div className="truncate" title={row.description}>
                          {row.description}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-[14px] text-sm text-slate-900 font-medium text-center tabular-nums whitespace-nowrap">
                        {row.amount != null ? formatINR(row.amount) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
              
              {/* Infinite scroll sentinel */}
              {!isInitialLoading && data.length > 0 && (
                <tr ref={loadMoreRef}>
                  <td colSpan={5} className="px-4 py-4 text-center">
                    {isLoading ? (
                      <div className="flex justify-center items-center gap-2 text-sm text-slate-500">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                        Loading more...
                      </div>
                    ) : hasMore ? (
                      <button 
                        onClick={() => fetchLogs(true)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors"
                      >
                        Load more
                      </button>
                    ) : (
                      <p className="text-sm text-slate-500">End of activity log</p>
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

