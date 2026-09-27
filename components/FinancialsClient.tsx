'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from './ToastProvider';
import { IndianRupee, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Receipt, PiggyBank } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { StatCard } from './ui/StatCard';
import Badge from './ui/Badge';
import { FilterCard, DateChipOption } from './FilterCard';
import { getProfitability, getRevenueSplit, getPaymentMethodSplit, getTrendPayments, getTrendExpenses, getPlanBreakdown, getNewVsLostMembers } from '@/lib/queries/financials';
import { TrendChart } from './ui/TrendChart';
import { SegmentedControl } from './ui/SegmentedControl';
import TransactionsClient from './TransactionsClient';
import ExpensesClient from './ExpensesClient';
import { PinnedChartWrapper } from './ui/usePinnedPoint';
import { isSingleMonth, toLocalISOString } from '@/lib/utils/date';
import { formatCompactINR } from '@/lib/utils/formatters';
import PageHeader from './PageHeader';

interface FinancialsClientProps {
  initialExpenses: any[] | null;
  profitability: { revenue: number; expenses: number; netProfit: number } | null;
  projectedRevenue: number | null;
  revenueSplit: { newRevenue: number; renewalRevenue: number } | null;
  paymentMethodSplit: { Cash: number; UPI: number; Card: number } | null;
  initialTrendPayments: any[] | null;
  initialSixMonthData: any[] | null;
  initialPlanBreakdownData: any[] | null;
  initialNewVsLostData: any[] | null;
  distinctCategories: string[];
  initialError?: string;
}

const COLORS = {
  Cash: '#1E3A8A', // Blue 900
  UPI: '#2563EB',  // Blue 600
  Card: '#60A5FA', // Blue 400
  New: '#1E3A8A', // Blue 900
  Renewal: '#3B82F6', // Blue 500
  Lost: '#93C5FD', // Blue 300
  Expense: '#60A5FA', // Blue 400
};
const PLAN_COLORS = ['#1E3A8A', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];

export default function FinancialsClient({
  initialExpenses,
  profitability,
  projectedRevenue,
  revenueSplit,
  paymentMethodSplit,
  initialTrendPayments,
  initialSixMonthData,
  initialPlanBreakdownData,
  initialNewVsLostData,
  distinctCategories,
  initialError
}: FinancialsClientProps) {
  const [activeTab, setActiveTab] = useState('Financials');
  
  // FilterCard State
  const now = new Date();
  const initialStart = toLocalISOString(new Date(now.getFullYear(), now.getMonth(), 1));
  const initialEnd = toLocalISOString(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [period, setPeriod] = useState('Overall');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const dateError = !!(fromDate && toDate && fromDate > toDate);
  const hasActiveFilters = period !== 'This Month' || fromDate !== initialStart || toDate !== initialEnd;

  // Local Data State for Filterable Widgets
  const [profitabilityData, setProfitabilityData] = useState(profitability);
  const [revenueSplitData, setRevenueSplitData] = useState(revenueSplit);
  const [paymentMethodSplitData, setPaymentMethodSplitData] = useState(paymentMethodSplit);
  const [trendPaymentsData, setTrendPaymentsData] = useState(initialTrendPayments);
  const [trendExpensesData, setTrendExpensesData] = useState<any[] | null>(null);
  const [planBreakdownData, setPlanBreakdownData] = useState(initialPlanBreakdownData);
  const [newVsLostData, setNewVsLostData] = useState(initialNewVsLostData);

  // Loading States
  const [isLoadingProfitability, setIsLoadingProfitability] = useState(false);
  const [isLoadingRevenueSplit, setIsLoadingRevenueSplit] = useState(false);
  const [isLoadingPaymentSplit, setIsLoadingPaymentSplit] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [isLoadingPlanBreakdown, setIsLoadingPlanBreakdown] = useState(false);
  const [isLoadingNewVsLost, setIsLoadingNewVsLost] = useState(false);
  const isFirstRender = useRef(true);

  const { showToast } = useToast();

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
    Promise.all([
      getTrendPayments(fetchFrom, fetchTo).then(setTrendPaymentsData),
      getTrendExpenses(fetchFrom, fetchTo).then(setTrendExpensesData)
    ])
      .catch(() => showToast('Failed to load trend data', 'error'))
      .finally(() => setIsLoadingTrend(false));

    setIsLoadingPlanBreakdown(true);
    getPlanBreakdown(fetchTo)
      .then(setPlanBreakdownData)
      .catch(() => showToast('Failed to load plan breakdown', 'error'))
      .finally(() => setIsLoadingPlanBreakdown(false));

    setIsLoadingNewVsLost(true);
    getNewVsLostMembers(fetchFrom, fetchTo)
      .then(setNewVsLostData)
      .catch(() => showToast('Failed to load new vs lost members', 'error'))
      .finally(() => setIsLoadingNewVsLost(false));
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      getTrendExpenses(fromDate, toDate).then(setTrendExpensesData).catch(() => {});
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
    
    if (period === 'Overall') {
      return '(Overall)';
    }

    const isCustom = !start || !end || fromDate !== toLocalISOString(start) || toDate !== toLocalISOString(end);
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

  const getEffectiveDateRange = () => {
    if (fromDate && toDate) return { start: new Date(fromDate), end: new Date(toDate) };
    
    const allDates = [
      ...(trendPaymentsData || []).map((p: any) => p.date),
      ...(trendExpensesData || []).map((e: any) => e.date),
      ...(newVsLostData || []).map((m: any) => m.date)
    ].filter(Boolean).sort();
    
    if (allDates.length > 0) {
      return { start: new Date(allDates[0]), end: new Date(allDates[allDates.length - 1]) };
    }
    
    const now = new Date();
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
  };

  const { start: effectiveStart, end: effectiveEnd } = getEffectiveDateRange();

  const isSingleMonthRange = isSingleMonth(
    fromDate || effectiveStart.toISOString().split('T')[0], 
    toDate || effectiveEnd.toISOString().split('T')[0]
  );

  const trendChartData = (() => {
    if (!trendPaymentsData) return [];
    
    if (isSingleMonthRange) {
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
      const start = effectiveStart;
      const end = effectiveEnd;
      const spansMultipleYears = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) >= 12;
      const months: { month: string, year: number, revenue: number, name: string }[] = [];
      let curr = new Date(start.getFullYear(), start.getMonth(), 1);
      const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);
      while (curr <= endLimit) {
        const monthStr = curr.toLocaleString('default', { month: 'short' });
        months.push({
          month: monthStr,
          year: curr.getFullYear(),
          revenue: 0,
          name: spansMultipleYears ? `${monthStr} ${curr.getFullYear()}` : monthStr
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

  const revenueVsExpensesChartData = (() => {
    if (!trendPaymentsData || !trendExpensesData) return [];
    
    if (isSingleMonthRange) {
      const weeks = [
        { name: 'Week 1', revenue: 0, expenses: 0 },
        { name: 'Week 2', revenue: 0, expenses: 0 },
        { name: 'Week 3', revenue: 0, expenses: 0 },
        { name: 'Week 4', revenue: 0, expenses: 0 },
        { name: 'Week 5', revenue: 0, expenses: 0 },
      ];
      trendPaymentsData.forEach((p: any) => {
        const d = new Date(p.date);
        const day = d.getDate();
        const weekIndex = Math.floor((day - 1) / 7);
        if (weekIndex >= 0 && weekIndex < 5) weeks[weekIndex].revenue += Number(p.amount);
      });
      trendExpensesData.forEach((e: any) => {
        const d = new Date(e.date);
        const day = d.getDate();
        const weekIndex = Math.floor((day - 1) / 7);
        if (weekIndex >= 0 && weekIndex < 5) weeks[weekIndex].expenses += Number(e.amount);
      });
      if (weeks[4].revenue === 0 && weeks[4].expenses === 0) weeks.pop();
      return weeks;
    } else {
      const start = effectiveStart;
      const end = effectiveEnd;
      const spansMultipleYears = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) >= 12;
      const months: { month: string, year: number, revenue: number, expenses: number, name: string }[] = [];
      let curr = new Date(start.getFullYear(), start.getMonth(), 1);
      const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);
      
      while (curr <= endLimit) {
        const monthStr = curr.toLocaleString('default', { month: 'short' });
        months.push({
          month: monthStr,
          year: curr.getFullYear(),
          revenue: 0,
          expenses: 0,
          name: spansMultipleYears ? `${monthStr} ${curr.getFullYear()}` : monthStr
        });
        curr.setMonth(curr.getMonth() + 1);
      }

      trendPaymentsData.forEach((p: any) => {
        const pDate = new Date(p.date);
        const bucket = months.find(m => m.year === pDate.getFullYear() && pDate.toLocaleString('default', { month: 'short' }) === m.month);
        if (bucket) bucket.revenue += Number(p.amount);
      });

      trendExpensesData.forEach((e: any) => {
        const eDate = new Date(e.date);
        const bucket = months.find(m => m.year === eDate.getFullYear() && eDate.toLocaleString('default', { month: 'short' }) === m.month);
        if (bucket) bucket.expenses += Number(e.amount);
      });

      return months;
    }
  })();

  const newVsLostChartData = (() => {
    if (!newVsLostData) return [];
    
    if (isSingleMonthRange) {
      const weeks = [
        { name: 'Week 1', New: 0, 'Lost Members': 0 },
        { name: 'Week 2', New: 0, 'Lost Members': 0 },
        { name: 'Week 3', New: 0, 'Lost Members': 0 },
        { name: 'Week 4', New: 0, 'Lost Members': 0 },
        { name: 'Week 5', New: 0, 'Lost Members': 0 },
      ];
      newVsLostData.forEach((m: any) => {
        const d = new Date(m.date);
        const day = d.getDate();
        const weekIndex = Math.floor((day - 1) / 7);
        if (weekIndex >= 0 && weekIndex < 5) {
          if (m.type === 'New') weeks[weekIndex].New += 1;
          else if (m.type === 'Lost') weeks[weekIndex]['Lost Members'] += 1;
        }
      });
      if (weeks[4].New === 0 && weeks[4]['Lost Members'] === 0) weeks.pop();
      return weeks;
    } else {
      const start = effectiveStart;
      const end = effectiveEnd;
      const spansMultipleYears = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) >= 12;
      const months: { month: string, year: number, New: number, 'Lost Members': number, name: string }[] = [];
      let curr = new Date(start.getFullYear(), start.getMonth(), 1);
      const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);
      while (curr <= endLimit) {
        const monthStr = curr.toLocaleString('default', { month: 'short' });
        months.push({
          month: monthStr,
          year: curr.getFullYear(),
          New: 0,
          'Lost Members': 0,
          name: spansMultipleYears ? `${monthStr} ${curr.getFullYear()}` : monthStr
        });
        curr.setMonth(curr.getMonth() + 1);
      }
      newVsLostData.forEach((m: any) => {
        const dDate = new Date(m.date);
        const bucket = months.find(b => b.year === dDate.getFullYear() && dDate.toLocaleString('default', { month: 'short' }) === b.month);
        if (bucket) {
          if (m.type === 'New') bucket.New += 1;
          else if (m.type === 'Lost') bucket['Lost Members'] += 1;
        }
      });
      return months;
    }
  })();

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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 overflow-hidden">
      <style>{`
        @keyframes tabSlideIn { 
          from { opacity: 0; transform: translateX(10px); } 
          to { opacity: 1; transform: translateX(0); } 
        }
        .animate-tab-slide { animation: tabSlideIn 180ms ease-out forwards; }
        .chart-card *:focus:not(:focus-visible) { outline: none !important; }
        .chart-card *:focus-visible { outline: 2px solid #2563EB !important; outline-offset: 2px; }
        .recharts-legend-item { display: inline-flex !important; align-items: center !important; margin-right: 16px !important; }
        .recharts-legend-item-text { font-size: 0.75rem !important; color: #64748b !important; padding-top: 1px !important; }
      `}</style>
      
      <div className="md:hidden flex justify-center mb-6">
        <SegmentedControl 
          options={['Financials', 'Transactions', 'Expenses']} 
          value={activeTab} 
          onChange={setActiveTab} 
        />
      </div>

      <div className={activeTab === 'Financials' ? 'animate-tab-slide block' : 'hidden'}>
        <PageHeader 
          title="Financials"
          subtitle="Track profitability, expenses, and revenue trends."
          className="mb-6"
        />

      <div className="mb-8">
        <FilterCard
          showPeriod={true}
          period={period}
          onPeriodChange={(newPeriod) => {
            setPeriod(newPeriod);
            const today = new Date();
            let start: Date;
            let end: Date = new Date();
            if (newPeriod === 'Overall') {
              setFromDate('');
              setToDate('');
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
            setFromDate(toLocalISOString(start));
            setToDate(toLocalISOString(end));
          }}
          periodOptions={[
            { value: 'Overall', label: 'Overall' },
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
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 chart-card">
          <h2 className="text-sm font-medium text-slate-700 mb-4">New vs. Renewal {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingRevenueSplit ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded-full animate-pulse"></div>
              </div>
            ) : revenueSplitData === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load split</div>
            ) : splitData.length > 0 ? (
              <PinnedChartWrapper resetDeps={[revenueSplitData]} valueFormatter={formatCompactINR}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={splitData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {splitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: ValueType | undefined) => value !== undefined ? formatCurrency(Number(value)) : ''} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </PinnedChartWrapper>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">Not enough data yet</span>
                <span className="text-xs text-slate-500">Log payments to see breakdown</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Method Pie */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 chart-card">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Payment Methods {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingPaymentSplit ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded-full animate-pulse"></div>
              </div>
            ) : paymentMethodSplitData === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load methods</div>
            ) : paymentPieData.length > 0 ? (
              <PinnedChartWrapper resetDeps={[paymentMethodSplitData]} valueFormatter={formatCompactINR}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={paymentPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {paymentPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: ValueType | undefined) => value !== undefined ? formatCurrency(Number(value)) : ''} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </PinnedChartWrapper>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">Not enough data yet</span>
                <span className="text-xs text-slate-500">Log payments to see breakdown</span>
              </div>
            )}
          </div>
        </div>

        {/* MoM Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 chart-card">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Revenue Trend {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingTrend ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ) : trendPaymentsData === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load trend</div>
            ) : trendChartData.length > 0 && trendChartData.some(m => m.revenue > 0) ? (
              <PinnedChartWrapper resetDeps={[trendPaymentsData, isSingleMonthRange]} valueFormatter={formatCompactINR}>
                <ResponsiveContainer width="100%" height="100%">
                  <TrendChart 
                    data={trendChartData} 
                    chartType={period === 'Overall' || period === 'This Year' ? 'area' : 'bar'} 
                    series={[{ key: 'revenue', color: '#2563EB' }]} 
                    valueFormatter={formatCompactINR} 
                  />
                </ResponsiveContainer>
              </PinnedChartWrapper>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">Not enough data yet</span>
                <span className="text-xs text-slate-500">Wait for next month to see trend</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: New Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        
        {/* Revenue vs Expenses (Fixed 6 months) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 chart-card">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Revenue vs. Expenses {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingTrend ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ) : (!trendPaymentsData || !trendExpensesData) ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load data</div>
            ) : revenueVsExpensesChartData.length > 0 && revenueVsExpensesChartData.some((m: any) => m.revenue > 0 || m.expenses > 0) ? (
              <PinnedChartWrapper resetDeps={[trendPaymentsData, trendExpensesData, isSingleMonthRange]} valueFormatter={formatCompactINR}>
                <ResponsiveContainer width="100%" height="100%">
                  <TrendChart 
                    data={revenueVsExpensesChartData} 
                    chartType="bar" 
                    series={[
                      { key: 'revenue', name: 'Revenue', color: COLORS.New },
                      { key: 'expenses', name: 'Expenses', color: COLORS.Expense }
                    ]} 
                    valueFormatter={formatCompactINR} 
                  />
                </ResponsiveContainer>
              </PinnedChartWrapper>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">Not enough data yet</span>
                <span className="text-xs text-slate-500">Log payments or expenses to compare</span>
              </div>
            )}
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 chart-card">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Plan Breakdown {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingPlanBreakdown ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded-full animate-pulse"></div>
              </div>
            ) : planBreakdownData === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load plan breakdown</div>
            ) : planBreakdownData.length > 0 ? (
              <PinnedChartWrapper resetDeps={[planBreakdownData]}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planBreakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {planBreakdownData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </PinnedChartWrapper>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">No active members</span>
                <span className="text-xs text-slate-500">Add members to see plan distribution</span>
              </div>
            )}
          </div>
        </div>

        {/* New vs Lost Members */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 chart-card">
          <h2 className="text-sm font-medium text-slate-700 mb-4">New vs. Lost Members {periodLabel}</h2>
          <div className="h-64 relative">
            {isLoadingNewVsLost ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 bg-slate-200 rounded animate-pulse"></div>
              </div>
            ) : newVsLostData === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load data</div>
            ) : newVsLostChartData.length > 0 && newVsLostChartData.some((m: any) => m.New > 0 || m['Lost Members'] > 0) ? (
              <PinnedChartWrapper resetDeps={[newVsLostData, isSingleMonthRange]}>
                <ResponsiveContainer width="100%" height="100%">
                  <TrendChart 
                    data={newVsLostChartData} 
                    chartType={period === 'Overall' || period === 'This Year' ? 'area' : 'bar'} 
                    series={[
                      { key: 'New', color: COLORS.New },
                      { key: 'Lost Members', color: COLORS.Lost }
                    ]} 
                    valueFormatter={(val) => Math.round(val).toString()}
                  />
                </ResponsiveContainer>
              </PinnedChartWrapper>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-slate-900 mb-1">Not enough data yet</span>
                <span className="text-xs text-slate-500">Wait for next month to see trend</span>
              </div>
            )}
          </div>
        </div>

      </div>

      </div>
      
      <div className={activeTab === 'Transactions' ? 'md:hidden animate-tab-slide block' : 'hidden'}>
        <TransactionsClient 
          distinctCategories={distinctCategories}
          hideHeader={true}
        />
      </div>

      <div className={activeTab === 'Expenses' ? 'md:hidden animate-tab-slide block' : 'hidden'}>
        <ExpensesClient 
          initialExpenses={initialExpenses}
          hideHeader={true}
        />
      </div>
    </div>
  );
}
