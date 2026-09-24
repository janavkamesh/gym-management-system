'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit2, Ban, Plus, Save } from 'lucide-react';
import { fetchMemberPayments, editPayment, voidPayment } from '@/lib/actions/payments';
import { logActivity } from '@/lib/activity-log';
import { useToast } from './ToastProvider';
import { formatINR } from '@/lib/utils/formatters';
import { cleanPhone } from '@/lib/utils/whatsapp';
import CollectPaymentModal from './CollectPaymentModal';
import { WhatsAppIcon } from './MemberRow';

interface PaymentHistoryModalProps {
  member: any;
  onClose: () => void;
}

export default function PaymentHistoryModal({ member, onClose }: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const { showToast } = useToast();

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMemberPayments(member.id);
      setPayments(data || []);
    } catch (error) {
      showToast('Failed to load payments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [member.id]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: '', method: 'Cash', date: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditForm({ amount: p.amount.toString(), method: p.method, date: p.date });
  };

  const handleEditSubmit = async (p: any) => {
    if (editForm.amount === p.amount.toString() && editForm.method === p.method && editForm.date === p.date) {
      showToast('No changes made', 'error');
      setEditingId(null);
      return;
    }
    setIsSubmitting(true);
    try {
      await editPayment(p.id, {
        amount: Number(editForm.amount),
        method: editForm.method,
        date: editForm.date
      });
      showToast('Payment updated', 'success');
      setEditingId(null);
      loadPayments();
    } catch (e) {
      showToast('Failed to update payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  
  const handleVoidSubmit = async (p: any) => {
    if (!voidReason.trim()) return;
    setIsSubmitting(true);
    try {
      await voidPayment(p.id, voidReason);
      showToast('Payment voided', 'success');
      setVoidingId(null);
      setVoidReason('');
      loadPayments();
    } catch (e) {
      showToast('Failed to void payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastWaClick = useRef<number>(0);
  const handleWaReceipt = (p: any) => {
    const now = Date.now();
    if (now - lastWaClick.current > 3000) {
      lastWaClick.current = now;
      const message = `Hi ${member.name}, we have received your payment of ${formatINR(p.amount)} on ${new Date(p.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} via ${p.method}. Thank you!`;
      const link = `https://wa.me/${cleanPhone(member.phone)}?text=${encodeURIComponent(message)}`;
      window.open(link, '_blank');
      logActivity({
        category: 'WhatsApp',
        action: 'Opened',
        description: `Opened WhatsApp receipt for ${member.name}: ${formatINR(p.amount)}`,
        entityType: 'payment',
        entityId: p.id
      }).catch(console.error);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onPointerDown={onClose}></div>
      <div className="relative bg-slate-50 w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl shadow-2xl z-10 animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm shrink-0 rounded-t-2xl md:rounded-t-2xl pt-safe">
          <div className="min-w-0 pr-4">
            <h2 className="font-semibold text-lg text-slate-900 truncate">{member.name} - Payment History</h2>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{member.plans?.plan_name || 'No Plan'} • Expiry: {new Date(member.expiry_date).toLocaleDateString('en-GB')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowCollectModal(true)}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors active:scale-95"
            >
              <Plus size={16} /> <span className="hidden md:inline">Add Payment</span><span className="md:hidden">Add</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 shrink-0 text-slate-500 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 pb-safe">
          {isLoading ? (
            <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : payments.length === 0 ? (
            <div className="text-center text-slate-500 p-8">No payments recorded.</div>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className={`bg-white rounded-xl border ${p.is_voided ? 'border-red-100 opacity-60' : 'border-slate-200'} p-4 shadow-sm relative`}>
                  {p.is_voided && (
                    <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg rounded-tr-lg uppercase tracking-wider">
                      Voided
                    </div>
                  )}
                  {p.is_edited && !p.is_voided && (
                    <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[10px] font-medium px-2 py-0.5 rounded-bl-lg rounded-tr-lg" title={`Last edited: ${new Date(p.edited_at).toLocaleString()}`}>
                      Edited
                    </div>
                  )}

                  {editingId === p.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Amount</label>
                          <input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Method</label>
                          <select value={editForm.method} onChange={e => setEditForm({...editForm, method: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                            <option>Cash</option>
                            <option>UPI</option>
                            <option>Card</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-slate-500 mb-1">Date</label>
                          <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} disabled={isSubmitting} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                        <button onClick={() => handleEditSubmit(p)} disabled={isSubmitting} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"><Save size={14}/> Save</button>
                      </div>
                    </div>
                  ) : voidingId === p.id ? (
                     <div className="space-y-3">
                        <p className="text-sm font-medium text-red-600">Void this payment?</p>
                        <p className="text-xs text-slate-500">This excludes the payment from all totals and recalculates the member's expiry date.</p>
                        <input type="text" placeholder="Reason for voiding (required)" value={voidReason} onChange={e => setVoidReason(e.target.value)} className="w-full bg-slate-50 border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" autoFocus />
                        <div className="flex gap-2 justify-end mt-2">
                          <button onClick={() => { setVoidingId(null); setVoidReason(''); }} disabled={isSubmitting} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                          <button onClick={() => handleVoidSubmit(p)} disabled={isSubmitting || !voidReason.trim()} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"><Ban size={14}/> Confirm Void</button>
                        </div>
                     </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className={`text-lg font-semibold ${p.is_voided ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{formatINR(p.amount)}</span>
                          <span className="text-sm text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.method}</span>
                          <span className="text-sm text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.payment_type}</span>
                        </div>
                        <div className="text-sm text-slate-600">
                          Paid on {new Date(p.date).toLocaleDateString('en-GB')}
                        </div>
                        {p.period_start && p.period_end && (
                          <div className="text-xs text-slate-500 mt-1">
                            Period: {new Date(p.period_start).toLocaleDateString('en-GB')} → {new Date(p.period_end).toLocaleDateString('en-GB')}
                          </div>
                        )}
                        {p.is_voided && p.void_reason && (
                           <div className="text-xs text-red-600 mt-2 bg-red-50 p-1.5 rounded inline-block">
                             Reason: {p.void_reason}
                           </div>
                        )}
                      </div>

                      {!p.is_voided && (
                        <div className="flex items-center gap-2 mt-2 md:mt-0 shrink-0 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                          <button onClick={() => handleWaReceipt(p)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors active:scale-95" title="WhatsApp Receipt">
                            <WhatsAppIcon size={16} />
                          </button>
                          <button onClick={() => startEdit(p)} className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors active:scale-95" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setVoidingId(p.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors active:scale-95" title="Void">
                            <Ban size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showCollectModal && (
        <CollectPaymentModal 
          member={member} 
          onClose={() => {
            setShowCollectModal(false);
            loadPayments();
          }} 
        />
      )}
    </div>,
    document.body
  );
}
