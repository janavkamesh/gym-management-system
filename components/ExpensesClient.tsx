'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, Filter, RotateCcw } from 'lucide-react';
import { BottomSheet } from './ui/BottomSheet';
import { Dropdown } from './ui/Dropdown';
import { DatePicker } from './DatePicker';
import { useToast } from './ToastProvider';
import Badge from './ui/Badge';
import AddExpenseModal from './AddExpenseModal';
import { FilterCard } from './FilterCard';
import PageHeader from './PageHeader';

import { getPeriodRange, getPeriodSubtitle, getMobileDayLabel } from '@/lib/utils/date';

interface ExpensesClientProps {
  initialExpenses: any[] | null;
  hideHeader?: boolean;
  initialAction?: string;
  initialCategory?: string;
  sharedPeriod?: string;
  sharedFrom?: string;
  sharedTo?: string;
  onPeriodChange?: (period: string, from?: string, to?: string) => void;
  animationClass?: string;
  isAnimating?: boolean;
  onAnimationEnd?: () => void;
}

export default function ExpensesClient({
  initialExpenses,
  hideHeader = false,
  initialAction,
  initialCategory,
  sharedPeriod,
  sharedFrom,
  sharedTo,
  onPeriodChange,
  animationClass = '',
  isAnimating = false,
  onAnimationEnd
}: ExpensesClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All Categories');

  useEffect(() => {
    if (initialAction === 'add') {
      setIsAddModalOpen(true);
    }
  }, [initialAction]);

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
  
  const { showToast } = useToast();
  const dateError = !!(from && to && from > to);
  const hasActiveFilters = !!(selectedCategory !== 'All Categories' || period !== 'This Month');

  const handleExpenseAdded = (newExpense: any) => {
    setExpenses([newExpense, ...expenses]);
    showToast('Expense logged successfully', 'success');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const filterCategories = ['All Categories', 'Rent', 'Electricity', 'Salaries', 'Maintenance', 'Equipment', 'Other'];
  const filteredExpenses = expenses.filter(exp => {
    if (selectedCategory !== 'All Categories' && exp.category !== selectedCategory) return false;
    if (from && exp.date < from) return false;
    if (to && exp.date > to) return false;
    return true;
  });

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeFilterCount = (selectedCategory !== 'All Categories' ? 1 : 0) + (period !== 'This Month' ? 1 : 0);

  const handleClear = () => {
    setSelectedCategory('All Categories');
    handlePeriodChange('This Month');
  };

  return (
    <div className={hideHeader ? "w-full" : "px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto w-full"}>
      <PageHeader
        title="Expenses"
        subtitle="Track and manage your gym's operational expenses."
        hidden={hideHeader}
        className="mb-3 lg:mb-6"
      />

      {hideHeader && (
        <div className="flex lg:hidden justify-between items-center mb-6 mt-4">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Expenses</h1>
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

      <div className={`${animationClass} ${isAnimating ? 'overflow-x-clip' : ''}`} onAnimationEnd={onAnimationEnd}>
      <div className="max-lg:space-y-section lg:space-y-6">
        <div className={hideHeader ? "hidden lg:block" : "block"}>
        <FilterCard
          variant="card"
          showCategory={true}
          category={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryOptions={filterCategories.map(c => ({ value: c, label: c === 'All Categories' ? 'All Categories' : c }))}
          
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

          <div className="space-y-3 pb-8">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <Dropdown
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={filterCategories.map(c => ({ value: c, label: c === 'All Categories' ? 'All Categories' : c }))}
              renderInline={true}
            />
          </div>
        </div>
      </BottomSheet>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
            <h2 className="font-medium text-slate-900">Expense Log</h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 min-h-11 lg:min-h-0 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95 whitespace-nowrap"
            >
              <Plus size={16} />
              <span className="hidden min-[360px]:inline">Add Expense</span>
              <span className="min-[360px]:hidden">Add</span>
            </button>
          </div>

        {initialExpenses === null ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium mb-1">Failed to load expenses</p>
            <p className="text-slate-500 text-sm">Check your connection and refresh.</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-900 font-medium mb-1">
              No expenses found{period === 'Overall' ? '' : period === 'Custom' ? ' in this period' : ` in ${period}`}
            </p>
            <p className="text-slate-500 text-sm">
              {selectedCategory === 'All Categories' 
                ? "Click 'Add Expense' to start tracking rent, salaries, and bills." 
                : `No expenses logged for category "${selectedCategory}".`}
            </p>
            {hasActiveFilters && (
              <button onClick={handleClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:flex overflow-x-auto overflow-y-hidden flex-1 flex-col min-h-0">
              <table className="w-full text-left min-w-[600px] flex flex-col flex-1 min-h-0">
                <thead className="table-header-dark border-b border-slate-200 text-slate-100 z-10 shrink-0">
                  <tr className="text-xs font-medium tracking-wider grid grid-cols-[1.5fr_1fr_1fr_1fr]">
                    <th className="px-4 md:px-6 py-3 text-left">Category</th>
                    <th className="px-4 md:px-6 py-3 text-right">Amount</th>
                    <th className="px-4 md:px-6 py-3 text-left">Date</th>
                    <th className="px-4 md:px-6 py-3 text-center">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 flex-1 overflow-y-auto block min-h-0">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors grid grid-cols-[1.5fr_1fr_1fr_1fr] items-center">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="block lg:hidden flex-1 overflow-y-auto min-h-0 bg-slate-50">
              <ul className="flex flex-col divide-y divide-slate-200">
                {(() => {
                  const mobileGroups: { key: string; label: string; rows: any[] }[] = [];
                  const sortedData = [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                  
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
                      <div className="table-header-dark px-4 py-1.5 text-xs min-[380px]:text-sm font-medium text-slate-100 sticky top-0 z-10">
                        {group.label}
                      </div>
                      <ul className="divide-y divide-slate-200 bg-white">
                        {group.rows.map(row => (
                          <li key={row.id} className="mobile-table-row px-4 !py-3 !min-h-0 items-start flex-col gap-2">
                            <div className="flex items-start justify-between gap-3 w-full">
                              <div className="text-sm font-semibold text-slate-900 leading-tight break-words flex-1 min-w-0">
                                {row.category}
                              </div>
                              <div className="text-sm font-medium text-red-600 tabular-nums shrink-0">
                                -{formatCurrency(row.amount)}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3 w-full mt-1">
                              <div className="flex items-center gap-2">
                                {row.recurring_flag ? (
                                  <Badge className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 min-h-0">Recurring</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 min-h-0">One-time</Badge>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </>
        )}
      </div>
      </div>
    </div>



      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleExpenseAdded}
        initialCategory={initialCategory}
      />
    </div>
  );
}


