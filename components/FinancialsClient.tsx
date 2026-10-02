'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from './ToastProvider';
import { IndianRupee, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Receipt, PiggyBank, Filter, X, RotateCcw } from 'lucide-react';
import { StatCard } from './ui/StatCard';
import Badge from './ui/Badge';
import { FilterCard, DateChipOption } from './FilterCard';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { getProfitability, getRevenueSplit, getPaymentMethodSplit, getTrendPayments, getTrendExpenses, getPlanBreakdown, getNewVsLostMembers } from '@/lib/queries/financials';
import { TrendChart } from './ui/TrendChart';
import { ChartCard } from './ui/ChartCard';
import { DonutChart } from './ui/DonutChart';
import { SlidingTabs } from './ui/SlidingTabs';
import TransactionsClient from './TransactionsClient';
import ExpensesClient from './ExpensesClient';
import { PinnedChartWrapper } from './ui/usePinnedPoint';
import { isSingleMonth, toLocalISOString, getExclusivePeriodRange } from '@/lib/utils/date';
import { formatCompactINR } from '@/lib/utils/formatters';
import PageHeader from './PageHeader';
import { Users, CreditCard, Activity, PieChart as PieChartIcon } from 'lucide-react';

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
  Card: '#64748b', // Slate 500
  New: '#1E3A8A', // Blue 900
  Renewal: '#3B82F6', // Blue 500
  Lost: '#93C5FD', // Blue 300
  Expense: '#60A5FA', // Blue 400
};
const PLAN_COLORS = ['#3B82F6', '#93C5FD', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9'];

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
  const [animationClass, setAnimationClass] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab) return;
    const tabs = ['Financials', 'Transactions', 'Expenses'];
    const prevIdx = tabs.indexOf(activeTab);
    const newIdx = tabs.indexOf(newTab);
    setAnimationClass(newIdx > prevIdx ? 'animate-page-slide-right' : 'animate-page-slide-left');
    setActiveTab(newTab);
    setIsAnimating(true);
  };
  
  // FilterCard State
  const { from: initialStart, to: initialEnd } = getExclusivePeriodRange('This Month');
  
  const DEFAULT_PERIOD = 'This Month';
  const DEFAULT_FROM = initialStart;
  const DEFAULT_TO = initialEnd;

  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [fromDate, setFromDate] = useState(DEFAULT_FROM);
  const [toDate, setToDate] = useState(DEFAULT_TO);
  const dateError = !!(fromDate && toDate && fromDate > toDate);
  const hasActiveFilters = period !== DEFAULT_PERIOD || fromDate !== DEFAULT_FROM || toDate !== DEFAULT_TO;

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
  const currentRequestId = useRef(0);

  const { showToast } = useToast();

  useEffect(() => {
    if (initialError) {
      showToast(initialError, 'error');
    }
  }, [initialError, showToast]);

  const fetchFilteredData = async () => {
    if (dateError) return;

    const { from: fetchFrom, toExclusive: fetchTo } = getExclusivePeriodRange(period, fromDate, toDate);
    
    currentRequestId.current += 1;
    const reqId = currentRequestId.current;

    setIsLoadingProfitability(true);
    getProfitability(fetchFrom, fetchTo)
      .then(res => { if (reqId === currentRequestId.current) setProfitabilityData(res); })
      .catch(() => showToast('Failed to load profitability', 'error'))
      .finally(() => { if (reqId === currentRequestId.current) setIsLoadingProfitability(false); });

    setIsLoadingRevenueSplit(true);
    getRevenueSplit(fetchFrom, fetchTo)
      .then(res => { if (reqId === currentRequestId.current) setRevenueSplitData(res); })
      .catch(() => showToast('Failed to load revenue split', 'error'))
      .finally(() => { if (reqId === currentRequestId.current) setIsLoadingRevenueSplit(false); });

    setIsLoadingPaymentSplit(true);
    getPaymentMethodSplit(fetchFrom, fetchTo)
      .then(res => { if (reqId === currentRequestId.current) setPaymentMethodSplitData(res); })
      .catch(() => showToast('Failed to load payment methods', 'error'))
      .finally(() => { if (reqId === currentRequestId.current) setIsLoadingPaymentSplit(false); });

    setIsLoadingTrend(true);
    Promise.all([
      getTrendPayments(fetchFrom, fetchTo).then(res => { if (reqId === currentRequestId.current) setTrendPaymentsData(res); }),
      getTrendExpenses(fetchFrom, fetchTo).then(res => { if (reqId === currentRequestId.current) setTrendExpensesData(res); })
    ])
      .catch(() => showToast('Failed to load trend data', 'error'))
      .finally(() => { if (reqId === currentRequestId.current) setIsLoadingTrend(false); });

    setIsLoadingPlanBreakdown(true);
    getPlanBreakdown(fetchTo)
      .then(res => { if (reqId === currentRequestId.current) setPlanBreakdownData(res); })
      .catch(() => showToast('Failed to load plan breakdown', 'error'))
      .finally(() => { if (reqId === currentRequestId.current) setIsLoadingPlanBreakdown(false); });

    setIsLoadingNewVsLost(true);
    getNewVsLostMembers(fetchFrom, fetchTo)
      .then(res => { if (reqId === currentRequestId.current) setNewVsLostData(res); })
      .catch(() => showToast('Failed to load new vs lost members', 'error'))
      .finally(() => { if (reqId === currentRequestId.current) setIsLoadingNewVsLost(false); });
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
    { name: 'Cash', value: paymentMethodSplitData.Cash, fill: COLORS.Cash },
    { name: 'UPI', value: paymentMethodSplitData.UPI, fill: COLORS.UPI },
    { name: 'Card', value: paymentMethodSplitData.Card, fill: COLORS.Card },
  ].filter(d => d.value > 0) : [];

  const splitData = revenueSplitData ? [
    { name: 'New Revenue', value: revenueSplitData.newRevenue, fill: COLORS.New },
    { name: 'Renewal Revenue', value: revenueSplitData.renewalRevenue, fill: COLORS.Renewal },
  ].filter(d => d.value > 0) : [];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden">
      <style>{`
        .chart-card *:focus:not(:focus-visible) { outline: none !important; }
        .chart-card *:focus-visible { outline: 2px solid #2563EB !important; outline-offset: 2px; }
        .recharts-legend-item { display: inline-flex !important; align-items: center !important; margin-right: 16px !important; }
        .recharts-legend-item-text { font-size: 0.75rem !important; color: #64748b !important; padding-top: 1px !important; }
      `}</style>
      
      <div className="md:hidden flex w-full lg:w-auto items-center gap-3 max-lg:mb-header lg:mb-6">
        <SlidingTabs 
          options={['Financials', 'Transactions', 'Expenses']} 
          value={activeTab} 
          onChange={handleTabChange} 
          containerClassName="w-full lg:w-auto h-10 lg:h-auto overflow-x-auto hide-scrollbar touch-manipulation"
          buttonClassName="flex-1 lg:flex-none px-4 h-full lg:h-auto lg:py-2"
        />
      </div>

      <div className={activeTab === 'Financials' ? 'block' : 'hidden'}>
        <PageHeader 
          title="Financials"
          subtitle="Track profitability, expenses, and revenue trends."
          className="hidden lg:flex mb-6"
        />

        {/* Mobile Header Row */}
        <div className="flex lg:hidden justify-between items-center max-lg:mb-section lg:mb-6">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Financials</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {(() => {
                const fmt = (d: Date) => {
                  try {
                    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
                  } catch {
                    return '';
                  }
                };
                const s = fmt(effectiveStart);
                const e = fmt(effectiveEnd);
                if (period === 'Custom' || period === 'Overall' || !period) {
                  return `${s} to ${e}`;
                }
                return `${period} - ${s} to ${e}`;
              })()}
            </p>
          </div>
          <button
            type="button"
            aria-label="Filters"
            onClick={() => setIsFilterSheetOpen(true)}
            className="flex items-center gap-2 min-h-12 px-4 rounded-lg bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-900 active:scale-95 transition-all duration-120 relative touch-manipulation"
          >
            <Filter size={20} className="text-slate-700" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>

      <div className="hidden lg:block mb-8">
        <FilterCard
          showPeriod={true}
          period={period}
          onPeriodChange={(newPeriod) => {
            setPeriod(newPeriod);
            const { from, to } = getExclusivePeriodRange(newPeriod);
            setFromDate(from);
            setToDate(to);
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
            setPeriod(DEFAULT_PERIOD);
            setFromDate(DEFAULT_FROM);
            setToDate(DEFAULT_TO);
          }}
        />
      </div>

      <div 
        className={`${activeTab === 'Financials' ? animationClass : ''} ${isAnimating ? 'overflow-x-clip' : ''}`}
        onAnimationEnd={() => {
          if (activeTab === 'Financials') {
            setIsAnimating(false);
            setAnimationClass('');
          }
        }}
      >
      {/* Row 1: 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-lg:mb-section lg:mb-8">
        <StatCard label="Total Revenue" value={isLoadingProfitability ? <div className="h-9 w-24 bg-white/30 animate-pulse rounded"></div> : (profitabilityData ? formatCurrency(profitabilityData.revenue) : <span className="text-sm text-red-500">Failed</span>)} icon={Wallet} colorClass="card-gradient-green" />
        <StatCard label="Total Expenses" value={isLoadingProfitability ? <div className="h-9 w-24 bg-white/30 animate-pulse rounded"></div> : (profitabilityData ? formatCurrency(profitabilityData.expenses) : <span className="text-sm text-red-500">Failed</span>)} icon={Receipt} colorClass="card-gradient-red" />
        <StatCard label="Net Profit" value={isLoadingProfitability ? <div className="h-9 w-24 bg-white/30 animate-pulse rounded"></div> : (profitabilityData ? formatCurrency(profitabilityData.netProfit) : <span className="text-sm text-red-500">Failed</span>)} icon={PiggyBank} colorClass="card-gradient-blue" />
        <StatCard label="Projected Revenue" value={projectedRevenue !== null ? formatCurrency(projectedRevenue) : <span className="text-sm text-red-500">Failed</span>} icon={TrendingUp} colorClass="card-gradient-yellow" />
      </div>

      {/* Row 2: Charts (Grid of 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* New vs Renewal */}
        <ChartCard
          title="New vs. Renewal"
          subtitle={periodLabel.replace(/[()]/g, '')}
          icon={PieChartIcon}
          isLoading={isLoadingRevenueSplit}
          isEmpty={splitData.length === 0}
          emptyMessage="Not enough data yet"
        >
          {splitData.length > 0 && revenueSplitData !== null && (
            <DonutChart data={splitData} totalLabel="Total" />
          )}
        </ChartCard>

        {/* Payment Method Pie */}
        <ChartCard
          title="Payment Methods"
          subtitle={periodLabel.replace(/[()]/g, '')}
          icon={CreditCard}
          isLoading={isLoadingPaymentSplit}
          isEmpty={paymentPieData.length === 0}
          emptyMessage="Not enough data yet"
        >
          {paymentPieData.length > 0 && paymentMethodSplitData !== null && (
            <DonutChart data={paymentPieData} totalLabel="Total" />
          )}
        </ChartCard>

        {/* MoM Trend Chart */}
        <ChartCard
          title="Revenue Trend"
          subtitle={periodLabel.replace(/[()]/g, '')}
          icon={TrendingUp}
          isLoading={isLoadingTrend}
          isEmpty={trendChartData.length === 0 || !trendChartData.some(m => m.revenue > 0)}
          emptyMessage="Wait for next month to see trend"
        >
          {trendChartData.length > 0 && trendChartData.some(m => m.revenue > 0) && trendPaymentsData !== null && (
            <TrendChart 
              data={trendChartData} 
              chartType={period === 'Overall' || period === 'This Year' ? 'area' : 'bar'} 
              series={[{ key: 'revenue', color: '#2563EB' }]} 
              valueFormatter={formatCompactINR} 
            />
          )}
        </ChartCard>
      </div>

      {/* Row 3: New Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-lg:mb-section lg:mb-8">
        {/* Revenue vs Expenses (Fixed 6 months) */}
        <ChartCard
          title="Revenue vs. Expenses"
          subtitle={periodLabel.replace(/[()]/g, '')}
          icon={Activity}
          isLoading={isLoadingTrend}
          isEmpty={revenueVsExpensesChartData.length === 0 || !revenueVsExpensesChartData.some((m: any) => m.revenue > 0 || m.expenses > 0)}
          emptyMessage="Log payments or expenses to compare"
        >
          {revenueVsExpensesChartData.length > 0 && revenueVsExpensesChartData.some((m: any) => m.revenue > 0 || m.expenses > 0) && trendPaymentsData && trendExpensesData && (
            <TrendChart 
              data={revenueVsExpensesChartData} 
              chartType="bar" 
              series={[
                { key: 'revenue', name: 'Revenue', color: COLORS.New },
                { key: 'expenses', name: 'Expenses', color: COLORS.Expense }
              ]} 
              valueFormatter={formatCompactINR} 
            />
          )}
        </ChartCard>

        {/* Plan Breakdown */}
        <ChartCard
          title="Plan Breakdown"
          subtitle={periodLabel.replace(/[()]/g, '')}
          icon={Users}
          isLoading={isLoadingPlanBreakdown}
          isEmpty={!planBreakdownData || planBreakdownData.length === 0}
          emptyMessage="No active members"
        >
          {planBreakdownData && planBreakdownData.length > 0 && (
            <DonutChart 
              data={planBreakdownData.map((d: any, i: number) => ({ ...d, fill: PLAN_COLORS[i % PLAN_COLORS.length] }))} 
              totalLabel="Members" 
              valueFormatter={(v: number) => v.toString()}
            />
          )}
        </ChartCard>

        {/* New vs Lost Members */}
        <ChartCard
          title="New vs. Lost Members"
          subtitle={periodLabel.replace(/[()]/g, '')}
          icon={Users}
          isLoading={isLoadingNewVsLost}
          isEmpty={newVsLostChartData.length === 0 || !newVsLostChartData.some((m: any) => m.New > 0 || m['Lost Members'] > 0)}
          emptyMessage="Wait for next month to see trend"
        >
          {newVsLostChartData.length > 0 && newVsLostChartData.some((m: any) => m.New > 0 || m['Lost Members'] > 0) && newVsLostData !== null && (
            <TrendChart 
              data={newVsLostChartData} 
              chartType={period === 'Overall' || period === 'This Year' ? 'area' : 'bar'} 
              series={[
                { key: 'New', color: COLORS.New },
                { key: 'Lost Members', color: COLORS.Lost }
              ]} 
              valueFormatter={(val: number) => Math.round(val).toString()}
            />
          )}
        </ChartCard>
      </div>
      </div>
      </div>      <div className={activeTab === 'Transactions' ? 'md:hidden block' : 'hidden'}>
        <TransactionsClient 
          distinctCategories={distinctCategories}
          hideHeader={true}
          sharedPeriod={period}
          sharedFrom={fromDate}
          sharedTo={toDate}
          onPeriodChange={(p, f, t) => {
            setPeriod(p);
            if (f !== undefined) setFromDate(f);
            if (t !== undefined) setToDate(t);
          }}
          animationClass={activeTab === 'Transactions' ? animationClass : ''}
          isAnimating={activeTab === 'Transactions' ? isAnimating : false}
          onAnimationEnd={() => {
            if (activeTab === 'Transactions') {
              setIsAnimating(false);
              setAnimationClass('');
            }
          }}
        />
      </div>

      <div className={activeTab === 'Expenses' ? 'md:hidden block' : 'hidden'}>
        <ExpensesClient 
          initialExpenses={initialExpenses}
          hideHeader={true}
          sharedPeriod={period}
          sharedFrom={fromDate}
          sharedTo={toDate}
          onPeriodChange={(p, f, t) => {
            setPeriod(p);
            if (f !== undefined) setFromDate(f);
            if (t !== undefined) setToDate(t);
          }}
          animationClass={activeTab === 'Expenses' ? animationClass : ''}
          isAnimating={activeTab === 'Expenses' ? isAnimating : false}
          onAnimationEnd={() => {
            if (activeTab === 'Expenses') {
              setIsAnimating(false);
              setAnimationClass('');
            }
          }}
        />
      </div>

      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filters"
        headerAction={
          <button
            onClick={() => {
              setPeriod(DEFAULT_PERIOD);
              setFromDate(DEFAULT_FROM);
              setToDate(DEFAULT_TO);
            }}
            className="flex items-center gap-1.5 min-h-8 px-3 text-sm rounded-full bg-white border border-slate-200 shadow-sm font-semibold text-slate-900 active:scale-95 transition-all duration-120 touch-manipulation"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        }
        footer={
          <button
            onClick={() => setIsFilterSheetOpen(false)}
            className="w-full h-12 bg-blue-600 text-white rounded-lg font-medium active:scale-95 transition-all touch-manipulation shadow-sm"
          >
            Done
          </button>
        }
      >
        <div className="-mx-4 -mt-4">
          <FilterCard
            variant="inline"
            showPeriod={true}
            period={period}
            onPeriodChange={(newPeriod) => {
              setPeriod(newPeriod);
              const { from, to } = getExclusivePeriodRange(newPeriod);
              setFromDate(from);
              setToDate(to);
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
              setPeriod(DEFAULT_PERIOD);
              setFromDate(DEFAULT_FROM);
              setToDate(DEFAULT_TO);
            }}
          />
        </div>
      </BottomSheet>
    </div>
  );
}
