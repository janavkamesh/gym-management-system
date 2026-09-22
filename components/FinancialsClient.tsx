'use client';

import { useState, useEffect } from 'react';
import { useToast } from './ToastProvider';
import { Plus, IndianRupee, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';
import AddExpenseModal from '@/components/AddExpenseModal';

interface FinancialsClientProps {
  initialExpenses: any[] | null;
  profitability: { revenue: number; expenses: number; netProfit: number } | null;
  projectedRevenue: number | null;
  revenueSplit: { newRevenue: number; renewalRevenue: number } | null;
  paymentMethodSplit: { Cash: number; UPI: number; Card: number } | null;
  monthlyTrend: { month: string; revenue: number }[] | null;
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
  monthlyTrend,
  initialError
}: FinancialsClientProps) {
  const [expenses, setExpenses] = useState(initialExpenses || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (initialError) {
      showToast(initialError, 'error');
    }
  }, [initialError, showToast]);

  const handleExpenseAdded = (newExpense: any) => {
    setExpenses([newExpense, ...expenses]);
    showToast('Expense logged successfully', 'success');
  };

  const paymentPieData = paymentMethodSplit ? [
    { name: 'Cash', value: paymentMethodSplit.Cash },
    { name: 'UPI', value: paymentMethodSplit.UPI },
    { name: 'Card', value: paymentMethodSplit.Card },
  ].filter(d => d.value > 0) : [];

  const splitData = revenueSplit ? [
    { name: 'New Revenue', value: revenueSplit.newRevenue, fill: COLORS.New },
    { name: 'Renewal Revenue', value: revenueSplit.renewalRevenue, fill: COLORS.Renewal },
  ].filter(d => d.value > 0) : [];

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-semibold text-[#0F172A] tracking-tight mb-2">Financials</h1>
          <p className="text-sm text-slate-500">Track profitability, expenses, and revenue trends.</p>
        </div>
      </div>

      {/* Row 1: 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-500">Total Revenue (This Month)</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={18} /></div>
          </div>
          <span className="text-2xl font-semibold text-slate-900">{profitability ? formatCurrency(profitability.revenue) : <span className="text-sm text-red-500">Failed to load</span>}</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-500">Total Expenses (This Month)</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={18} /></div>
          </div>
          <span className="text-2xl font-semibold text-slate-900">{profitability ? formatCurrency(profitability.expenses) : <span className="text-sm text-red-500">Failed to load</span>}</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-500">Net Profit (This Month)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={18} /></div>
          </div>
          <span className="text-2xl font-semibold text-slate-900">{profitability ? formatCurrency(profitability.netProfit) : <span className="text-sm text-red-500">Failed to load</span>}</span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-500">Projected Revenue (Renewals)</span>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg"><IndianRupee size={18} /></div>
          </div>
          <span className="text-2xl font-semibold text-slate-900">{projectedRevenue !== null ? formatCurrency(projectedRevenue) : <span className="text-sm text-red-500">Failed to load</span>}</span>
        </div>
      </div>

      {/* Row 2: Charts (Grid of 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        
        {/* New vs Renewal */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-700 mb-4">New vs. Renewal (This Month)</h2>
          <div className="h-64">
            {revenueSplit === null ? (
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
                  <Legend />
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
          <h2 className="text-sm font-medium text-slate-700 mb-4">Payment Methods (This Month)</h2>
          <div className="h-64">
            {paymentMethodSplit === null ? (
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
                  <Legend />
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

        {/* MoM Trend Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
          <h2 className="text-sm font-medium text-slate-700 mb-4">Revenue Trend (Last 6 Months)</h2>
          <div className="h-64">
            {monthlyTrend === null ? (
              <div className="h-full flex items-center justify-center text-red-500 text-sm">Failed to load trend</div>
            ) : monthlyTrend.length > 0 && monthlyTrend.some(m => m.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis hide />
                  <RechartsTooltip formatter={(value: ValueType | undefined) => value !== undefined ? formatCurrency(Number(value)) : ''} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="revenue" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="hidden md:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>

        {initialExpenses === null ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium mb-1">Failed to load expenses</p>
            <p className="text-slate-500 text-sm">Check your connection and refresh.</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-900 font-medium mb-1">No expenses logged yet</p>
            <p className="text-slate-500 text-sm">Click 'Add Expense' to start tracking rent, salaries, and bills.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 md:px-6 py-3.5 md:py-3 text-sm font-medium text-slate-900 whitespace-nowrap max-w-[120px] md:max-w-[200px] overflow-hidden text-ellipsis" title={exp.category}>{exp.category}</td>
                    <td className="px-4 md:px-6 py-3.5 md:py-3 text-sm text-slate-700">{formatCurrency(exp.amount)}</td>
                    <td className="px-4 md:px-6 py-3.5 md:py-3 text-sm text-slate-500 whitespace-nowrap">{new Date(exp.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 md:px-6 py-3.5 md:py-3 text-sm text-slate-500">
                      {exp.recurring_flag ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Recurring</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">One-time</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3.5 md:py-3 text-sm text-slate-500">
                      {exp.receipt_url ? (
                        <a href={exp.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
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
