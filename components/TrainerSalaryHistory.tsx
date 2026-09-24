'use client';

import { useState } from 'react';
import { Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { voidSalaryPayment } from '@/lib/actions/trainers';
import { useToast } from './ToastProvider';
import { formatINR } from '@/lib/utils/formatters';
import Badge from './ui/Badge';

interface TrainerSalaryHistoryProps {
  trainer: any;
  payments: any[];
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TrainerSalaryHistory({ trainer, payments, isLoading, onRefresh }: TrainerSalaryHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleVoidSubmit = async (p: any) => {
    if (!voidReason.trim()) return;
    setIsSubmitting(true);
    try {
      await voidSalaryPayment(p.id, voidReason);
      showToast('Salary payment voided', 'success');
      setVoidingId(null);
      setVoidReason('');
      onRefresh();
    } catch (e) {
      showToast('Failed to void salary payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100 shrink-0">
        <h3 className="font-semibold text-slate-900 text-sm md:text-base">Salary History</h3>
      </div>
      <div className="p-0 flex-1 overflow-y-auto max-h-72">
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : payments.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No salary payments recorded.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map(p => {
              const d = new Date(p.month_start);
              const isExpanded = expandedId === p.id;
              
              return (
                <div key={p.id} className={`flex flex-col p-3 md:p-4 hover:bg-slate-50 transition-colors ${p.is_voided ? 'bg-slate-50 opacity-60' : ''}`}>
                  {voidingId === p.id ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-red-600">Void this salary payment?</p>
                      <p className="text-xs text-slate-500">This reverses the linked expense and makes any deducted advances pending again.</p>
                      <input type="text" placeholder="Reason for voiding (required)" value={voidReason} onChange={e => setVoidReason(e.target.value)} className="w-full bg-white border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" autoFocus />
                      <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => { setVoidingId(null); setVoidReason(''); }} disabled={isSubmitting} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                        <button onClick={() => handleVoidSubmit(p)} disabled={isSubmitting || !voidReason.trim()} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"><Ban size={14}/> Confirm Void</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : p.id)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-semibold ${p.is_voided ? 'line-through text-slate-500' : 'text-slate-900'}`}>{formatINR(p.net_paid)}</span>
                            <Badge className="bg-slate-100 text-slate-600">{d.toLocaleString('default', { month: 'short', year: 'numeric' })}</Badge>
                            {p.is_voided && <Badge className="bg-red-100 text-red-700 uppercase tracking-wider">Voided</Badge>}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Paid on {new Date(p.paid_date).toLocaleDateString('en-GB')} via {p.method}
                          </div>
                          {p.is_voided && p.void_reason && (
                             <div className="text-xs text-red-600 mt-2 bg-red-50 p-1.5 rounded inline-block">
                               Reason: {p.void_reason}
                             </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!p.is_voided && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setVoidingId(p.id); }} 
                              className="p-1.5 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-md transition-colors border border-slate-200 hover:border-red-100" 
                              title="Void"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                          <div className="p-1 text-slate-400">
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100/80">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <div className="text-slate-500 mb-0.5">Base Salary</div>
                              <div className="font-medium text-slate-900">{formatINR(p.base_salary_snapshot)}</div>
                            </div>
                            <div className="bg-green-50/50 p-2 rounded-lg border border-green-100/50">
                              <div className="text-slate-500 mb-0.5">Commission</div>
                              <div className="font-medium text-green-700">{formatINR(p.commission_snapshot)}</div>
                            </div>
                            <div className="bg-red-50/50 p-2 rounded-lg border border-red-100/50">
                              <div className="text-slate-500 mb-0.5">Advances Deducted</div>
                              <div className="font-medium text-red-700">{formatINR(p.advances_deducted_snapshot)}</div>
                            </div>
                          </div>
                          {p.note && (
                            <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                              "{p.note}"
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
