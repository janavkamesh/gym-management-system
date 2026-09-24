'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from './ToastProvider';
import { Plus, IndianRupee, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, ChevronDown, Receipt, PiggyBank } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import AddExpenseModal from '@/components/AddExpenseModal';
import TransactionsTable from '@/components/TransactionsTable';
import { StatCard } from './ui/StatCard';
import Badge from './ui/Badge';
import { FilterCard, DateChipOption } from './FilterCard';
import { getProfitability, getRevenueSplit, getPaymentMethodSplit, getTrendPayments } from '@/lib/queries/financials';

interface FinancialsClientProps {
  initialExpenses: any[] | null;
  profitability: { revenue: number; expenses: number; netProfit: number } | null;
  projectedRevenue: number | null;
  revenueSplit: { newRevenue: number; renewalRevenue: number } | null;
  paymentMethodSplit: { Cash: number; UPI: number; Card: number } | null;
  initialTrendPayments: any[] | null;
  distinctCategories: string[];
  initialError?: string;
}

const COLORS = {
  Cash: '#16A34A', // Green 600
  UPI: '#2563EB',  // Blue 600
  Card: '#EAB308', // Yellow 500
  New: '#2563EB',
  Renewal: '#0F172A', // Slate 900
};

export default function FinancialsClient({
  initialExpenses,
  profitability,
  projectedRevenue,
  revenueSplit,
  paymentMethodSplit,
  initialTrendPayments,
  distinctCategories,
  initialError
}: FinancialsClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // FilterCard State
  const now = new Date();
  const initialStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const initialEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [period, setPeriod] = useState('This Month');
  const [fromDate, setFromDate] = useState(initialStart);
  const [toDate, setToDate] = useState(initialEnd);
  const dateError = !!(fromDate && toDate && fromDate > toDate);
  const hasActiveFilters = period !== 'This Month' || fromDate !== initialStart || toDate !== initialEnd;

  // Local Data State for Filterable Widgets
  const [profitabilityData, setProfitabilityData] = useState(profitability);
  const [revenueSplitData, setRevenueSplitData] = useState(revenueSplit);
  const [paymentMethodSplitData, setPaymentMethodSplitData] = useState(paymentMethodSplit);
  const [trendPaymentsData, setTrendPaymentsData] = useState(initialTrendPayments);

  // Loading States
  const [isLoadingProfitability, setIsLoadingProfitability] = useState(false);
  const [isLoadingRevenueSplit, setIsLoadingRevenueSplit] = useState(false);
  const [isLoadingPaymentSplit, setIsLoadingPaymentSplit] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const isFirstRender = useRef(true);

  // Category Filter State
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        categoryDropdownRef.current && 
        !categoryDropdownRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest?.('#expenses-category-dropdown-portal')
      ) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialError) {
      showToast(initialError, 'error');
    }
  }, [initialError, showToast]);

  const fetchFilteredData = async () => {
    if (dateError) return;

    let fetchFrom = fromDate;
    let fetchTo = toDate;

    setIsLoadingProfitability(true);
    getProfitability(fetchFrom, fetchTo)
      .then(setProfitabilityData)
      .catch(() => showToast('Failed to load profitability', 'error'))
      .finally(() => setIsLoadingProfitability(false));

    setIsLoadingRevenueSplit(true);
    getRevenueSplit(fetchFrom, fetchTo)
      .then(setRevenueSplitData)
      .catch(() => showToast('Failed to load revenue split', 'error'))
      .finally(() => setIsLoadingRevenueSplit(false));

    setIsLoadingPaymentSplit(true);
    getPaymentMethodSplit(fetchFrom, fetchTo)
      .then(setPaymentMethodSplitData)
      .catch(() => showToast('Failed to load payment methods', 'error'))
      .finally(() => setIsLoadingPaymentSplit(false));

    setIsLoadingTrend(true);
    getTrendPayments(fetchFrom, fetchTo)
      .then(setTrendPaymentsData)
      .catch(() => showToast('Failed to load trend data', 'error'))
      .finally(() => setIsLoadingTrend(false));
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetchFilteredData();
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, fromDate, toDate]);

  const getPeriodLabel = () => {
    const today = new Date();
    let start: Date | null = null, end: Date | null = null;
    if (period === 'This Month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'Last 3 Months') {
      start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'Last 6 Months') {
      start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (period === 'This Year') {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
    }
    
    const isCustom = !start || !end || fromDate !== start.toISOString().split('T')[0] || toDate !== end.toISOString().split('T')[0];
    if (!isCustom) {
      return `(${period})`;
    }

    const formatShortDate = (isoString: string) => {
        try {
          return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(isoString));
        } catch {
          return '';
        }
      };
      
    const fromStr = fromDate ? formatShortDate(fromDate) : 'Start';
    const toStr = toDate ? formatShortDate(toDate) : 'End';
    return `(${fromStr} - ${toStr})`;
  };
  const periodLabel = getPeriodLabel();

  const isSingleMonth = () => {
    if (!fromDate || !toDate) return false;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    return start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  };

  const trendChartData = (() => {
    if (!trendPaymentsData) return [];
    
    if (isSingleMonth()) {
      const weeks = [
        { name: 'Week 1', revenue: 0 },
        { name: 'Week 2', revenue: 0 },
        { name: 'Week 3', revenue: 0 },
        { name: 'Week 4', revenue: 0 },
        { name: 'Week 5', revenue: 0 },
      ];
      trendPaymentsData.forEach((p: any) => {
        const d = new Date(p.date);
        const day = d.getDate();
        const weekIndex = Math.floor((day - 1) / 7);
        if (weekIndex >= 0 && weekIndex < 5) {
          weeks[weekIndex].revenue += Number(p.amount);
        }
      });
      if (weeks[4].revenue === 0) weeks.pop();
      return weeks;
    } else {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const months: { month: string, year: number, revenue: number, name: string }[] = [];
      let curr = new Date(start.getFullYear(), start.getMonth(), 1);
      const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);
      while (curr <= endLimit) {
        months.push({
          month: curr.toLocaleString('default', { month: 'short' }),
          year: curr.getFullYear(),
          revenue: 0,
          name: curr.toLocaleString('default', { month: 'short' })
        });
        curr.setMonth(curr.getMonth() + 1);
      }
      trendPaymentsData.forEach((p: any) => {
        const pDate = new Date(p.date);
        const bucket = months.find(m => m.year === pDate.getFullYear() && pDate.toLocaleString('default', { month: 'short' }) === m.month);
        if (bucket) {
          bucket.revenue += Number(p.amount);
        }
      });
      return months;
    }
  })();

  const handleExpenseAdded = (newExpense: any) => {
    setExpenses([newExpense, ...expenses]);
    showToast('Expense logged successfully', 'success');
  };

  const paymentPieData = paymentMethodSplitData ? [
    { name: 'Cash', value: paymentMethodSplitData.Cash },
    { name: 'UPI', value: paymentMethodSplitData.UPI },
    { name: 'Card', value: paymentMethodSplitData.Card },
  ].filter(d => d.value > 0) : [];

  const splitData = revenueSplitData ? [
    { name: 'New Revenue', value: revenueSplitData.newRevenue, fill: COLORS.New },
    { name: 'Renewal Revenue', value: revenueSplitData.renewalRevenue, fill: COLORS.Renewal },
  ].filter(d => d.value > 0) : [];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const filterCategories = ['All Categories', 'Rent', 'Electricity', 'Salaries', 'Maintenance', 'Equipment', 'Other'];
  
  const filteredExpenses = selectedCategory === 'All Categories' 
    ? expenses 
    : expenses.filter(exp => exp.category === selectedCategory);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight mb-2">Financials</h1>
          <p className="text-sm text-slate-500">Track profitability, expenses, and revenue trends.</p>
        </div>
      </div>

      <div className="mb-8">
        <FilterCard
          showCategory={true}
          category={period}
          onCategoryChange={(newPeriod) => {
            setPeriod(newPeriod);
            const today = new Date();
            let start: Date;
            let end: Date = new Date();
            if (newPeriod === 'This Month') {
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
            setFromDate(start.toISOString().split('T')[0]);
            setToDate(end.toISOString().split('T')[0]);
          }}
          categoryOptions={[
            { value: 'This Month', label: 'This Month' },
            { value: 'Last 3 Months', label: 'Last 3 Months' },
            { value: 'Last 6 Months', label: 'Last 6 Months' },
            { value: 'This Year', label: 'This Year' }
          ]}
          showDatePickers={true}
          fromDate={fromDate}
          onFromDateChange={setFromDate}
          toDate={toDate}
          onToDateChange={setToDate}
          dateError={dateError}
          hasActiveFilters={hasActiveFilters}
          onClear={() => {
            setPeriod('This Month');
            setFromDate(initialStart);
            setToDate(initialEnd);
          }}
        />
      </div>

      {/* Row 1: 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title={`Total Revenue ${periodLabel}`} value={isLoadingProfitability ? <div className="h-9 w-24 bg-white/30 animate-pulse rounded"></div> : (profitabilityData ? formatCurrency(profitabilityData.revenue) : <span className="text-sm text-red-500">Failed</span>)} icon={Wallet} variant="green" />
        <StatCard title={`Total Expenses ${periodLabel}`} value={isLoadingProfitability ? <div className="h-9 w-24 bg-white/30 animate-pulse rounded"></div> : (profitabilityData ? formatCurrency(profitabilityData.expenses) : <span className="text-sm text-red-500">Failed</span>)} icon={Receipt} variant="red" />
        <StatCard title={`Net Profit ${periodLabel}`} value={isLoadingProfitability ? <div className="h-9 w-24 bg-white/30 animate-pulse rounded"></div> : (profitabilityData ? formatCurrency(profitabilityData.netProfit) : <span className="text-sm text-red-500">Failed</span>)} icon={PiggyBank} variant="blue" />
        <StatCard title="Projected Revenue (Current)" value={projectedRevenue !== null ? formatCurrency(projectedRevenue) : <span className="text-sm text-red-500">Failed</span>} icon={TrendingUp} variant="yellow" />
      </div>

      {/* Row 2: Charts (Grid of 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        
        {/* New vs Renewal */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-700 mb-4">New vs. Renewal {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingRevenueSplit ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded-full animate-pulse"></div>
              </div>
            ) : revenueSplitData === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load split</div>
            ) : splitData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={splitData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {splitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: ValueType | undefined) => value !== undefined ? formatCurrency(Number(value)) : ''} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">Not enough data yet</span>
                <span className="text-xs text-slate-500">Log payments to see breakdown</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Pie */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Payment Methods {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingPaymentSplit ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded-full animate-pulse"></div>
              </div>
            ) : paymentMethodSplitData === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load methods</div>
            ) : paymentPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: ValueType | undefined) => value !== undefined ? formatCurrency(Number(value)) : ''} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">Not enough data yet</span>
                <span className="text-xs text-slate-500">Log payments to see breakdown</span>
              </div>
            )}
          </div>
        </div>

        {/* MoM Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Revenue Trend {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingTrend ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ) : trendPaymentsData === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load trend</div>
            ) : trendChartData.length > 0 && trendChartData.some(m => m.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                {isSingleMonth() ? (
                  <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis hide />
                    <RechartsTooltip formatter={(value: ValueType | undefined) => value !== undefined ? formatCurrency(Number(value)) : ''} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                ) : (
                  <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis hide />
                    <RechartsTooltip formatter={(value: ValueType | undefined) => value !== undefined ? formatCurrency(Number(value)) : ''} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">Not enough data yet</span>
                <span className="text-xs text-slate-500">Wait for next month to see trend</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Expenses List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-medium text-slate-900">Expenses Log</h2>
          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-white flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow min-w-[140px]"
              >
                <span className="text-slate-700 text-sm">{selectedCategory}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCategoryDropdownOpen && typeof document !== 'undefined' && createPortal(
                <div 
                  id="expenses-category-dropdown-portal"
                  className="fixed z-[9999] bg-white border border-slate-200 rounded-lg shadow-md max-h-60 overflow-y-auto mb-1"
                  style={{
                    bottom: window.innerHeight - (categoryDropdownRef.current?.getBoundingClientRect().top || 0),
                    left: categoryDropdownRef.current?.getBoundingClientRect().left,
                    width: Math.max(160, categoryDropdownRef.current?.getBoundingClientRect().width || 0),
                  }}
                >
                  <ul className="py-1">
                    {filterCategories.map(cat => (
                      <li key={cat}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${selectedCategory === cat ? 'text-blue-600 font-medium' : 'text-slate-900'}`}
                        >
                          {cat}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>,
                document.body
              )}
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95 whitespace-nowrap"
            >
              <Plus size={16} />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {initialExpenses === null ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium mb-1">Failed to load expenses</p>
            <p className="text-slate-500 text-sm">Check your connection and refresh.</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-900 font-medium mb-1">No expenses found</p>
            <p className="text-slate-500 text-sm">
              {selectedCategory === 'All Categories' 
                ? "Click 'Add Expense' to start tracking rent, salaries, and bills." 
                : `No expenses logged for category "${selectedCategory}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="table-header-dark border-b border-slate-200 text-slate-100">
                <tr className="text-xs font-medium tracking-wider">
                  <th className="px-4 md:px-6 text-left">Category</th>
                  <th className="px-4 md:px-6 text-right">Amount</th>
                  <th className="px-4 md:px-6 text-left">Date</th>
                  <th className="px-4 md:px-6 text-center">Type</th>
                  <th className="px-4 md:px-6 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-left text-sm font-medium text-slate-900 whitespace-nowrap max-w-30 md:max-w-50 overflow-hidden text-ellipsis" title={exp.category}>{exp.category}</td>
                    <td className="px-4 md:px-6 py-4 text-right tabular-nums text-sm text-slate-700">{formatCurrency(exp.amount)}</td>
                    <td className="px-4 md:px-6 py-4 text-left text-sm text-slate-500 whitespace-nowrap">{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 md:px-6 py-4 text-center text-sm text-slate-500">
                      {exp.recurring_flag ? (
                        <Badge className="bg-blue-100 text-blue-800">Recurring</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-800">One-time</Badge>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-center text-sm text-slate-500">
                      {exp.receipt_url ? (
                        <a href={exp.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex justify-center w-full">View</a>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionsTable categories={distinctCategories} />

      {/* Mobile FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 z-40 transition-transform"
      >
        <Plus size={24} />
      </button>

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleExpenseAdded}
      />
    </div>
  );
}
