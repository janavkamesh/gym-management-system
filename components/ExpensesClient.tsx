'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown } from 'lucide-react';
import { useToast } from './ToastProvider';
import Badge from './ui/Badge';
import AddExpenseModal from './AddExpenseModal';
import { FilterCard } from './FilterCard';
import PageHeader from './PageHeader';

interface ExpensesClientProps {
  initialExpenses: any[] | null;
  hideHeader?: boolean;
  initialAction?: string;
  initialCategory?: string;
}

export default function ExpensesClient({
  initialExpenses,
  hideHeader = false,
  initialAction,
  initialCategory,
}: ExpensesClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  useEffect(() => {
    if (initialAction === 'add') {
      setIsAddModalOpen(true);
    }
  }, [initialAction]);
  
  const now = new Date();
  const initialStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const initialEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [period, setPeriod] = useState('Overall');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  
  const { showToast } = useToast();
  const dateError = !!(from && to && from > to);
  const hasActiveFilters = !!(selectedCategory !== 'All Categories' || period !== 'This Month' || from !== initialStart || to !== initialEnd);

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

  const handleClear = () => {
    setSelectedCategory('All Categories');
    setPeriod('This Month');
    setFrom(initialStart);
    setTo(initialEnd);
  };

  return (
    <div className={hideHeader ? "w-full" : "px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto w-full"}>
      <PageHeader
        title="Expenses"
        subtitle="Track and manage your gym's operational expenses."
        hidden={hideHeader}
        className="mb-3 lg:mb-6"
      />

      <div className="space-y-6">
        <FilterCard
          variant="card"
          showCategory={true}
          category={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryOptions={filterCategories.map(c => ({ value: c, label: c === 'All Categories' ? 'All Categories' : c }))}
          
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
            <p className="text-slate-900 font-medium mb-1">No expenses found</p>
            <p className="text-slate-500 text-sm">
              {selectedCategory === 'All Categories' 
                ? "Click 'Add Expense' to start tracking rent, salaries, and bills." 
                : `No expenses logged for category "${selectedCategory}".`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden flex-1 flex flex-col min-h-0">
            <table className="w-full text-left min-w-[600px] flex flex-col flex-1 min-h-0">
              <thead className="table-header-dark border-b border-slate-200 text-slate-100 z-10 shrink-0">
                <tr className="text-xs font-medium tracking-wider grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
                  <th className="px-4 md:px-6 py-3 text-left">Category</th>
                  <th className="px-4 md:px-6 py-3 text-right">Amount</th>
                  <th className="px-4 md:px-6 py-3 text-left">Date</th>
                  <th className="px-4 md:px-6 py-3 text-center">Type</th>
                  <th className="px-4 md:px-6 py-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 flex-1 overflow-y-auto block min-h-0">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] items-center">
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
