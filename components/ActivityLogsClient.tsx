'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from './ToastProvider';
import { getActivityLogs } from '@/lib/queries/activity-logs';
import { ActivityCategory } from '@/lib/activity-log';
import { formatINR } from '@/lib/utils/formatters';
import { Filter, X, Search } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';
import { DatePicker } from './DatePicker';
import { FilterCard } from './FilterCard';
import Badge from './ui/Badge';

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
  const [data, setData] = useState(initialData);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ActivityCategory | 'All'>('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const { showToast } = useToast();
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLTableRowElement>(null);
  const requestCounter = useRef(0);
  const isFirstRender = useRef(true);
  
  const dateError = !!(from && to && from > to);
  const hasActiveFilters = !!(search || category !== 'All' || from || to);

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

      const fromDate = from ? getISTStartOfDay(from) : undefined;
      const toDate = to ? getISTEndOfDay(to) : undefined;

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
    setFrom('');
    setTo('');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
      {/* 1. Heading and subtext */}
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-2">Activity Logs</h1>
        <p className="text-slate-500 text-sm">A permanent record of everything done in your gym.</p>
      </div>

      {/* 2. Filter card */}
      <FilterCard
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

        showDatePickers={true}
        fromDate={from}
        onFromDateChange={setFrom}
        toDate={to}
        onToDateChange={setTo}
        dateError={dateError}

        hasActiveFilters={hasActiveFilters}
        onClear={handleClear}
      />

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
                    <p className="font-medium text-slate-900 mb-1">{hasActiveFilters ? "No matching activity" : "No activity yet"}</p>
                    <p className="text-sm">{hasActiveFilters ? "Try changing or clearing your filters." : "Actions like adding members and logging payments will appear here."}</p>
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
