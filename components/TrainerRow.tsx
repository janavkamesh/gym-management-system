'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { deleteTrainer, fetchPtAssignments, fetchSalaryAdvances, fetchSalarySummary, deletePtAssignment, deleteSalaryAdvance, markAdvanceDeducted, restoreTrainer } from '@/lib/actions/trainers';
import { useToast } from './ToastProvider';
import { Trash2, ChevronDown, ChevronUp, Check, X, Plus, AlertCircle, RefreshCw, Undo2, Eye, Banknote } from 'lucide-react';
import Tooltip from './Tooltip';
import AddSalaryAdvanceModal from './AddSalaryAdvanceModal';
import CollectPtPaymentModal from './CollectPtPaymentModal';
import TrainerSalaryHistory from './TrainerSalaryHistory';
import PaySalaryModal from './PaySalaryModal';
import TrainerProfileModal from './TrainerProfileModal';
import { fetchTrainerSalaryPayments } from '@/lib/actions/payments';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

interface TrainerRowProps {
  trainer: any;
  members: any[];
  onDeleted: () => void;
  onRestore?: () => void;
  isTarget?: boolean;
  action?: string;
  isDesktop?: boolean;
}

export default function TrainerRow({ trainer, members, onDeleted, onRestore, isTarget, action, isDesktop = true }: TrainerRowProps) {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { showToast } = useToast();
  
  const isArchived = !!trainer.archived_at;
  
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

  const [salaryPayments, setSalaryPayments] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Modals
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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

  const loadPayments = async () => {
    setIsLoadingPayments(true);
    try {
      const res = await fetchTrainerSalaryPayments(trainer.id);
      setSalaryPayments(res || []);
    } catch (err) {
      // ignore
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const loadDetails = () => {
    loadPt();
    loadAdv();
    loadSummary();
    loadPayments();
  };



  useEffect(() => {
    // Phase 3 will handle data fetching on demand
  }, []);

  useEffect(() => {
    if (isTarget) {
      setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  // eslint-disable-next-inline react-hooks/exhaustive-deps
  }, [isTarget]);

  useEffect(() => {
    if (isTarget && action === 'pay_salary' && salarySummary && salarySummary.netPayable > 0 && salaryPayments) {
      const monthStartStr = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
      const hasPaid = salaryPayments.some(p => p.month_start === monthStartStr && !p.is_voided);
      if (!hasPaid) setShowPayModal(true);
    }
  }, [isTarget, action, salarySummary, salaryPayments, currentYear, currentMonth]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTrainer(trainer.id);
      showToast('Trainer removed successfully', 'success');
      setShowDeleteModal(false);
      onDeleted();
    } catch (error) {
      showToast('Failed to remove trainer. Check your connection.', 'error');
      setIsDeleting(false);
    }
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRestoring(true);
    try {
      await restoreTrainer(trainer.id);
      showToast('Trainer restored successfully', 'success');
      if (onRestore) onRestore();
    } catch (error) {
      showToast('Failed to restore trainer. Check your connection.', 'error');
      setIsRestoring(false);
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

  const [ptToDelete, setPtToDelete] = useState<string | null>(null);
  const [paymentPt, setPaymentPt] = useState<any | null>(null);

  const confirmDeletePt = async () => {
    if (!ptToDelete) return;
    try {
      await deletePtAssignment(ptToDelete, trainer.id);
      setPtAssignments(prev => prev.filter(p => p.id !== ptToDelete));
      loadSummary();
      setPtToDelete(null);
      showToast('PT assignment removed successfully', 'success');
    } catch (error) {
      showToast('Failed to remove PT assignment. Check your connection.', 'error');
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

  const viewBtn = (
    <Tooltip content="View Profile">
      <button
        onClick={(e) => { e.stopPropagation(); setShowProfileModal(true); }}
        className="mobile-table-btn text-blue-600 bg-blue-50 hover:bg-blue-100"
      >
        <Eye size={18} />
      </button>
    </Tooltip>
  );

  const payBtn = (
    <Tooltip content="Pay Salary">
      <button
        onClick={async (e) => { 
          e.stopPropagation(); 
          if (!salarySummary) {
            await loadSummary();
          }
          setShowPayModal(true); 
        }}
        disabled={isLoadingSummary}
        className="mobile-table-btn text-green-600 bg-green-50 hover:bg-green-100 disabled:opacity-50"
      >
        {isLoadingSummary ? <RefreshCw size={18} className="animate-spin" /> : <Banknote size={18} />}
      </button>
    </Tooltip>
  );

  const advBtn = (
    <Tooltip content="Log Advance">
      <button
        onClick={(e) => { e.stopPropagation(); setIsAdvanceModalOpen(true); }}
        className="mobile-table-btn text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900"
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </Tooltip>
  );

  const removeBtn = (
    <Tooltip content="Remove Trainer">
      <button
        onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
        disabled={isDeleting}
        className="mobile-table-btn text-red-500 hover:text-red-700 hover:bg-red-50 bg-red-50/50 disabled:opacity-50"
      >
        <Trash2 size={18} strokeWidth={2.5} />
      </button>
    </Tooltip>
  );

  const modals = (
    <>
      {mounted && createPortal(
        <>
          <TrainerProfileModal 
            isOpen={showProfileModal}
            trainer={trainer} 
            onClose={() => setShowProfileModal(false)} 
            onRemove={() => setShowDeleteModal(true)}
          />
          <AddSalaryAdvanceModal 
            isOpen={isAdvanceModalOpen}
            onClose={() => setIsAdvanceModalOpen(false)}
            trainerId={trainer.id}
            onSuccess={() => setSalarySummary(null)}
          />
          {salarySummary && (
            <PaySalaryModal 
              isOpen={showPayModal}
              trainer={trainer}
              summary={salarySummary}
              month={currentMonth}
              year={currentYear}
              onClose={() => setShowPayModal(false)}
              onSuccess={() => setSalarySummary(null)}
            />
          )}
        </>,
        document.body
      )}

      {typeof document !== 'undefined' && createPortal(
        <ModalTransition 
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          containerClassName="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <ModalHeader title="Remove Trainer" onClose={() => setShowDeleteModal(false)} />
          <div className="p-6">
            <p className="text-slate-500 mb-6">
              Are you sure you want to remove <span className="font-semibold text-slate-900">{trainer.name}</span>?
            </p>
            <div className="flex gap-3 pb-safe">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors active:scale-95 flex justify-center items-center disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </ModalTransition>,
        document.body
      )}

      {typeof document !== 'undefined' && createPortal(
        <ModalTransition 
          isOpen={!!ptToDelete}
          onClose={() => setPtToDelete(null)}
          containerClassName="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          <ModalHeader title="Remove PT Client" onClose={() => setPtToDelete(null)} />
          <div className="p-6">
            <p className="text-slate-500 mb-6">
              Are you sure you want to unassign this PT client?
            </p>
            <div className="flex gap-3 pb-safe">
              <button
                onClick={() => setPtToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePt}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors active:scale-95 flex justify-center items-center"
              >
                Remove
              </button>
            </div>
          </div>
        </ModalTransition>,
        document.body
      )}

      {createPortal(
        <CollectPtPaymentModal 
          isOpen={!!paymentPt}
          assignment={paymentPt} 
          onClose={() => setPaymentPt(null)}
          onSuccess={() => loadDetails()}
        />,
        document.body
      )}
    </>
  );

  if (!isDesktop) {
    return (
      <>
        <div
          ref={rowRef as any}
          role="button"
          tabIndex={0}
          onClick={() => { if (!isArchived) setShowProfileModal(true); }}
          onKeyDown={(e) => {
            if (!isArchived && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setShowProfileModal(true);
            }
          }}
          className={`mobile-member-grid mobile-table-row ${!isArchived ? 'active:bg-slate-50 cursor-pointer' : 'opacity-50'} ${isTarget ? 'bg-blue-50/80 outline outline-2 outline-blue-400' : ''}`}
        >
          <div className="flex flex-col min-w-0 pr-2">
            <span className="mobile-table-name">{trainer.name}</span>
            <span className="mobile-table-sub">{trainer.phone}</span>
          </div>

          {!isArchived ? (
            <>
              <div className="text-center justify-self-center min-w-0 flex items-center justify-center">
                {advBtn}
              </div>
              <div className="text-center justify-self-center min-w-0 flex items-center justify-center">
                {payBtn}
              </div>
              <div className="text-center justify-self-center min-w-0 flex items-center justify-center">
                {viewBtn}
              </div>
            </>
          ) : (
            <div className="col-start-4 text-center justify-self-center">
              <button
                onClick={handleRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded transition-all active:scale-95 disabled:opacity-50"
              >
                <Undo2 size={14} className={isRestoring ? 'animate-spin' : ''} />
                Restore
              </button>
            </div>
          )}
        </div>
        {!isArchived && modals}
      </>
    );
  }

  return (
    <>
      <tr 
        ref={rowRef}
        onClick={() => { if (!isArchived) setShowProfileModal(true); }}
        className={`transition-colors hover:bg-slate-50 ${!isArchived ? 'cursor-pointer' : ''} ${isTarget ? 'bg-blue-50/80 outline outline-2 outline-blue-400' : ''}`}
      >
        <td className={`px-4 md:px-6 py-4 md:py-3 text-sm font-medium text-left whitespace-nowrap overflow-hidden text-ellipsis max-w-37.5 text-slate-900 ${isArchived ? 'opacity-50' : ''}`}>
          {trainer.name}
        </td>
        <td className={`px-4 md:px-6 py-4 md:py-3 text-sm text-left text-slate-500 whitespace-nowrap ${isArchived ? 'opacity-50' : ''}`}>
          {trainer.phone}
        </td>
        <td className={`hidden md:table-cell px-6 py-3 whitespace-nowrap text-sm text-right text-slate-900 font-medium ${isArchived ? 'opacity-50' : ''}`}>
          {formatCurrency(Number(trainer.base_salary))}
        </td>
        <td className={`hidden md:table-cell px-6 py-3 whitespace-nowrap text-sm text-left text-slate-500 ${isArchived ? 'opacity-50' : ''}`}>
          {new Date(trainer.join_date).toLocaleDateString('en-GB')}
        </td>
        
        {!isArchived ? (
          <>
            <td className="px-4 md:px-6 py-3.5 md:py-3 text-center">
              {viewBtn}
            </td>
            <td className="px-4 md:px-6 py-3.5 md:py-3 text-center">
              {payBtn}
            </td>
            <td className="px-4 md:px-6 py-3.5 md:py-3 text-center">
              {advBtn}
            </td>
            <td className="px-4 md:px-6 py-3.5 md:py-3 text-center">
              {removeBtn}
            </td>
          </>
        ) : (
          <td colSpan={2} className="px-4 md:px-6 py-4 md:py-3 text-right md:text-center">
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 rounded-lg transition-all duration-120 active:scale-95 disabled:opacity-50"
            >
              <Undo2 size={16} className={isRestoring ? 'animate-spin' : ''} />
              {isRestoring ? 'Restoring...' : 'Restore'}
            </button>
          </td>
        )}
      </tr>



      {modals}
    </>
  );
}
