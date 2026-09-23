'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { deleteTrainer, fetchPtAssignments, fetchSalaryAdvances, fetchSalarySummary, deletePtAssignment, deleteSalaryAdvance, markAdvanceDeducted } from '@/lib/actions/trainers';
import { useToast } from './ToastProvider';
import { Trash2, ChevronDown, ChevronUp, Check, X, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import Tooltip from './Tooltip';
import AddPtAssignmentModal from './AddPtAssignmentModal';
import AddSalaryAdvanceModal from './AddSalaryAdvanceModal';

interface TrainerRowProps {
  trainer: any;
  members: any[];
  onDeleted: () => void;
}

export default function TrainerRow({ trainer, members, onDeleted }: TrainerRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [ptAssignments, setPtAssignments] = useState<any[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<any[]>([]);
  const [salarySummary, setSalarySummary] = useState<any>(null);
  
  const [isLoadingPt, setIsLoadingPt] = useState(false);
  const [isLoadingAdv, setIsLoadingAdv] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [ptError, setPtError] = useState(false);
  const [advError, setAdvError] = useState(false);
  const [summaryError, setSummaryError] = useState(false);

  // Modals
  const [isPtModalOpen, setIsPtModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

  // Default to current month for summary
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadPt = async () => {
    setIsLoadingPt(true);
    setPtError(false);
    try {
      const res = await fetchPtAssignments(trainer.id);
      setPtAssignments(res || []);
    } catch (err) {
      setPtError(true);
      showToast('Failed to load PT assignments. Check your connection.', 'error');
    } finally {
      setIsLoadingPt(false);
    }
  };

  const loadAdv = async () => {
    setIsLoadingAdv(true);
    setAdvError(false);
    try {
      const res = await fetchSalaryAdvances(trainer.id);
      setSalaryAdvances(res || []);
    } catch (err) {
      setAdvError(true);
      showToast('Failed to load salary advances. Check your connection.', 'error');
    } finally {
      setIsLoadingAdv(false);
    }
  };

  const loadSummary = async () => {
    setIsLoadingSummary(true);
    setSummaryError(false);
    try {
      const res = await fetchSalarySummary(trainer.id, currentMonth, currentYear);
      setSalarySummary(res);
    } catch (err) {
      setSummaryError(true);
      showToast('Failed to calculate salary. Check your connection.', 'error');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadDetails = () => {
    loadPt();
    loadAdv();
    loadSummary();
  };

  useEffect(() => {
    if (isExpanded) {
      loadDetails();
    }
  // eslint-disable-next-inline react-hooks/exhaustive-deps
  }, [isExpanded]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove trainer ${trainer.name}?`)) return;
    setIsDeleting(true);
    try {
      await deleteTrainer(trainer.id);
      showToast('Trainer removed successfully', 'success');
      onDeleted();
    } catch (error) {
      showToast('Failed to remove trainer. Check your connection.', 'error');
      setIsDeleting(false);
    }
  };

  const handleToggleDeducted = async (advance: any) => {
    try {
      await markAdvanceDeducted(advance.id, trainer.id, !advance.deducted_flag);
      // Optimistic update
      setSalaryAdvances(prev => prev.map(a => a.id === advance.id ? { ...a, deducted_flag: !a.deducted_flag } : a));
      loadSummary();
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    }
  };

  const handleDeletePt = async (ptId: string) => {
    if (!window.confirm('Remove this PT assignment?')) return;
    try {
      await deletePtAssignment(ptId, trainer.id);
      setPtAssignments(prev => prev.filter(p => p.id !== ptId));
      loadSummary();
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    }
  };

  const handleDeleteAdvance = async (advId: string) => {
    if (!window.confirm('Delete this advance?')) return;
    try {
      await deleteSalaryAdvance(advId, trainer.id);
      setSalaryAdvances(prev => prev.filter(a => a.id !== advId));
      loadSummary();
    } catch (error) {
      showToast('Failed to save. Check your connection.', 'error');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const renderWorkspace = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Left Column: PT Assignments */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-75">
          <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100 shrink-0">
            <h3 className="font-semibold text-slate-900 text-sm md:text-base">PT Clients</h3>
            <button 
              onClick={() => setIsPtModalOpen(true)}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 md:px-2.5 py-2 md:py-1.5 rounded-md transition-colors min-h-12 md:min-h-0"
            >
              <Plus size={16} className="md:w-3.5 md:h-3.5" /> <span className="hidden md:inline">Add Client</span><span className="md:hidden">Add</span>
            </button>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {isLoadingPt ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center animate-pulse">
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-16"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : ptError ? (
              <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center justify-center h-full">
                <AlertCircle size={24} className="text-red-400 mb-2" />
                <p>Failed to load PT clients</p>
                <button onClick={loadPt} className="mt-2 text-blue-600 font-medium flex items-center gap-1 hover:underline min-h-12 px-2"><RefreshCw size={14}/> Retry</button>
              </div>
            ) : ptAssignments.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center justify-center h-full">No PT clients assigned.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {ptAssignments.map(pt => (
                  <div key={pt.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1 mr-4">
                      <div className="font-medium text-slate-900 text-sm truncate">{pt.member?.name || 'Unknown Member'}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">Assigned: {new Date(pt.assigned_date).toLocaleDateString('en-GB')}</div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-medium">{pt.commission_percent}% Comm.</span>
                      <button onClick={() => handleDeletePt(pt.id)} className="text-slate-400 hover:text-red-600 p-2 min-h-12 min-w-12 md:min-h-0 md:min-w-0 md:p-0 flex items-center justify-center">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Salary Advances */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-75">
          <div className="flex items-center justify-between p-3 md:p-4 border-b border-slate-100 shrink-0">
            <h3 className="font-semibold text-slate-900 text-sm md:text-base">Salary Advances</h3>
            <button 
              onClick={() => setIsAdvanceModalOpen(true)}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 md:px-2.5 py-2 md:py-1.5 rounded-md transition-colors min-h-12 md:min-h-0"
            >
              <Plus size={16} className="md:w-3.5 md:h-3.5" /> <span className="hidden md:inline">Log Advance</span><span className="md:hidden">Log</span>
            </button>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            {isLoadingAdv ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center animate-pulse">
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-slate-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : advError ? (
              <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center justify-center h-full">
                <AlertCircle size={24} className="text-red-400 mb-2" />
                <p>Failed to load advances</p>
                <button onClick={loadAdv} className="mt-2 text-blue-600 font-medium flex items-center gap-1 hover:underline min-h-12 px-2"><RefreshCw size={14}/> Retry</button>
              </div>
            ) : salaryAdvances.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500 flex flex-col items-center justify-center h-full">No salary advances logged.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {salaryAdvances.map(adv => (
                  <div key={adv.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="font-medium text-slate-900 text-sm truncate">{formatCurrency(Number(adv.amount))}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {new Date(adv.date).toLocaleDateString('en-GB')} {adv.note ? `• ${adv.note}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 md:gap-3 shrink-0">
                      <button 
                        onClick={() => handleToggleDeducted(adv)}
                        className={`flex items-center gap-1 px-2 md:px-2 py-2 md:py-1 min-h-12 md:min-h-0 rounded text-xs font-medium border transition-colors ${
                          adv.deducted_flag 
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                        }`}
                      >
                        {adv.deducted_flag ? <><Check size={12}/> Deducted</> : 'Pending'}
                      </button>
                      <button onClick={() => handleDeleteAdvance(adv.id)} className="text-slate-400 hover:text-red-600 p-2 min-h-12 min-w-12 md:min-h-0 md:min-w-0 md:p-0 flex items-center justify-center">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Full Width Bottom Banner: Salary Summary */}
        <div className="md:col-span-2 bg-slate-900 text-white rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between shadow-sm min-h-25">
          {isLoadingSummary ? (
             <div className="w-full flex items-center justify-between animate-pulse">
                <div>
                  <div className="h-4 bg-slate-700 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-slate-700 rounded w-32"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-8 bg-slate-700 rounded w-16"></div>
                  <div className="h-8 bg-slate-700 rounded w-16"></div>
                </div>
             </div>
          ) : summaryError ? (
            <div className="w-full flex flex-col items-center justify-center text-sm text-slate-400 py-2">
              <AlertCircle size={20} className="text-red-400 mb-1" />
              <span>Failed to calculate summary</span>
              <button onClick={loadSummary} className="mt-2 text-blue-400 font-medium hover:underline flex items-center gap-1 min-h-12"><RefreshCw size={14}/> Retry</button>
            </div>
          ) : salarySummary ? (
            <>
              <div>
                <div className="text-sm text-slate-400 font-medium">Estimated Salary ({new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'short', year: 'numeric' })})</div>
                <div className="text-2xl font-semibold mt-1 truncate max-w-62.5">{formatCurrency(salarySummary.netPayable)}</div>
              </div>
              <div className="flex items-center gap-3 md:gap-6 mt-4 md:mt-0 text-xs md:text-sm">
                <div>
                  <div className="text-slate-400 text-10px md:text-xs">Base Salary</div>
                  <div className="font-medium truncate max-w-20 md:max-w-25">{formatCurrency(salarySummary.baseSalary)}</div>
                </div>
                <div className="text-slate-600">+</div>
                <div>
                  <div className="text-slate-400 text-10px md:text-xs">PT Commission</div>
                  <div className="font-medium text-green-400 truncate max-w-20 md:max-w-25">{formatCurrency(salarySummary.totalCommission)}</div>
                </div>
                <div className="text-slate-600">-</div>
                <div>
                  <div className="text-slate-400 text-10px md:text-xs">Pending Adv.</div>
                  <div className="font-medium text-red-400 truncate max-w-20 md:max-w-25">{formatCurrency(salarySummary.totalAdvances)}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full text-center text-sm text-slate-500">Summary unavailable</div>
          )}
        </div>

      </div>
    );
  };

  return (
    <>
      <tr 
        className={`transition-colors cursor-pointer md:cursor-default ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
        onClick={() => {
          if (window.innerWidth < 768) {
            setIsExpanded(true);
          }
        }}
      >
        <td className="px-4 md:px-6 py-4 md:py-3 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-37.5 text-slate-900">
          {trainer.name}
        </td>
        <td className="px-4 md:px-6 py-4 md:py-3 text-sm text-slate-500 whitespace-nowrap">
          {trainer.phone}
        </td>
        <td className="hidden md:table-cell px-6 py-3 whitespace-nowrap text-sm text-slate-900 font-medium">
          {formatCurrency(Number(trainer.base_salary))}
        </td>
        <td className="hidden md:table-cell px-6 py-3 whitespace-nowrap text-sm text-slate-500">
          {new Date(trainer.join_date).toLocaleDateString('en-GB')}
        </td>
        <td className="hidden md:table-cell px-6 py-3 text-center">
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="inline-flex mx-auto items-center justify-center min-h-9 px-3 gap-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors font-medium active:scale-95 touch-manipulation"
          >
            {isExpanded ? (
              <><ChevronUp size={16} /> Hide Details</>
            ) : (
              <><ChevronDown size={16} /> Manage</>
            )}
          </button>
        </td>
        <td className="hidden md:table-cell px-6 py-3 text-center">
          <Tooltip content="Remove Trainer">
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={isDeleting}
              className="inline-flex mx-auto items-center justify-center min-h-12 min-w-12 md:min-h-9 md:min-w-9 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 bg-red-50/50 rounded-md transition-all active:scale-95 disabled:opacity-50 touch-manipulation"
            >
              <Trash2 size={18} strokeWidth={2.5} />
            </button>
          </Tooltip>
        </td>
      </tr>

      {/* Desktop Expandable Row */}
      {isExpanded && (
        <tr className="hidden md:table-row bg-slate-50 border-b border-slate-200">
          <td colSpan={6} className="p-0">
            <div className="p-6 pt-0 border-t border-slate-200/50">
              {renderWorkspace()}
            </div>
          </td>
        </tr>
      )}

      {/* Mobile Drill-Down Sheet */}
      {mounted && isExpanded && createPortal(
        <div className="md:hidden fixed inset-0 z-60 bg-slate-50 flex flex-col animate-in slide-in-from-bottom-full duration-200">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm shrink-0 mt-safe">
            <div className="min-w-0 pr-4">
              <h2 className="font-semibold text-lg text-slate-900 truncate">{trainer.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{trainer.phone} • Base: {formatCurrency(Number(trainer.base_salary))}</p>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 shrink-0 text-slate-500 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 pb-30">
            {renderWorkspace()}
            <div className="mt-8 pt-6 border-t border-slate-200/50 flex justify-center">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-3 rounded-lg font-medium transition-colors active:scale-95 min-h-12"
              >
                <Trash2 size={18} />
                Remove Trainer
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modals for this row */}
      {mounted && createPortal(
        <>
          <AddPtAssignmentModal 
            isOpen={isPtModalOpen}
            onClose={() => setIsPtModalOpen(false)}
            trainerId={trainer.id}
            members={members}
            onSuccess={() => loadDetails()} // reload everything to update summary
          />
          <AddSalaryAdvanceModal 
            isOpen={isAdvanceModalOpen}
            onClose={() => setIsAdvanceModalOpen(false)}
            trainerId={trainer.id}
            onSuccess={() => loadDetails()}
          />
        </>,
        document.body
      )}
    </>
  );
}
