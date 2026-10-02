'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Edit2, Ban, Plus, Save, ReceiptText } from 'lucide-react';
import { fetchMemberPayments, editPayment, voidPayment } from '@/lib/actions/payments';
import { logActivity } from '@/lib/activity-log';
import { useToast } from './ToastProvider';
import { formatINR } from '@/lib/utils/formatters';
import { cleanPhone } from '@/lib/utils/whatsapp';
import { toLocalISOString } from '@/lib/utils/date';
import CollectPaymentModal from './CollectPaymentModal';
import { WhatsAppIcon } from './MemberRow';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

interface PaymentHistoryModalProps {
  isOpen: boolean;
  member: any;
  onClose: () => void;
}

export function PaymentHistoryContent({ member, isOpen = true }: { member: any, isOpen?: boolean }) {
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
    if (isOpen) {
      loadPayments();
    }
  }, [member.id, isOpen]);

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
    } catch (e: any) {
      showToast(e.message || 'Failed to update payment', 'error');
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
    } catch (e: any) {
      showToast(e.message || 'Failed to void payment', 'error');
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

  return (
    <>
      {/* Mobile List View */}
      <div className="block lg:hidden w-full pb-safe">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center text-slate-500 py-8 flex flex-col items-center">
            <ReceiptText className="mb-2 opacity-50" size={24} />
            <span className="text-sm">No payments recorded.</span>
          </div>
        ) : (
          <div className="profile-card rounded-2xl flex flex-col w-full divide-y divide-slate-200">
            {payments.map(p => (
              <div key={p.id} className={`py-3.5 px-3 flex flex-col gap-1 ${p.is_voided ? 'opacity-60 bg-slate-50/50' : ''}`}>
                {editingId === p.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
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
                        <input type="date" value={editForm.date} max={toLocalISOString(new Date())} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => setEditingId(null)} disabled={isSubmitting} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                      <button onClick={() => handleEditSubmit(p)} disabled={isSubmitting} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"><Save size={14}/> Save</button>
                    </div>
                  </div>
                ) : voidingId === p.id ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-red-600">Void this payment?</p>
                    <p className="text-xs text-slate-500">This excludes the payment from all totals.</p>
                    <input type="text" placeholder="Reason for voiding (required)" value={voidReason} onChange={e => setVoidReason(e.target.value)} className="w-full bg-slate-50 border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" autoFocus />
                    <div className="flex gap-2 justify-end mt-2">
                      <button onClick={() => { setVoidingId(null); setVoidReason(''); }} disabled={isSubmitting} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                      <button onClick={() => handleVoidSubmit(p)} disabled={isSubmitting || !voidReason.trim()} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"><Ban size={14}/> Confirm Void</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Line 1 */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`font-semibold text-sm ${p.is_voided ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{formatINR(p.amount)}</span>
                        {p.is_voided && <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-1 rounded shrink-0">Voided</span>}
                      </div>
                      <span className="text-sm text-slate-500 shrink-0">{new Date(p.date).toLocaleDateString('en-GB')}</span>
                    </div>
                    {/* Line 2 */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500 truncate">
                        {p.payment_type === 'Membership' ? (member.plans?.plan_name || 'Membership') : p.payment_type} &middot; {p.method}
                      </span>
                      {!p.is_voided && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleWaReceipt(p)} className="relative p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors active:scale-95 before:absolute before:-inset-2.5" aria-label="WhatsApp Receipt">
                            <WhatsAppIcon size={16} />
                          </button>
                          <button onClick={() => startEdit(p)} className="relative p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors active:scale-95 before:absolute before:-inset-2.5" aria-label="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setVoidingId(p.id)} className="relative p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors active:scale-95 before:absolute before:-inset-2.5" aria-label="Void">
                            <Ban size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block pb-safe overflow-x-auto w-full">
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center text-slate-500 p-8">No payments recorded.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative w-full min-w-[700px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-white text-xs uppercase font-medium">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider capitalize">Amount</th>
                    <th className="px-6 py-4 font-semibold tracking-wider capitalize">Method</th>
                    <th className="px-6 py-4 font-semibold tracking-wider capitalize">Type</th>
                    <th className="px-6 py-4 font-semibold tracking-wider capitalize">Date</th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right capitalize">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payments.map(p => (
                    <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${p.is_voided ? 'opacity-60 bg-slate-50/50' : ''} relative group`}>
                      {editingId === p.id ? (
                        <td colSpan={6} className="px-6 py-4">
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
                                <input type="date" value={editForm.date} max={toLocalISOString(new Date())} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => setEditingId(null)} disabled={isSubmitting} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                              <button onClick={() => handleEditSubmit(p)} disabled={isSubmitting} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"><Save size={14}/> Save</button>
                            </div>
                          </div>
                        </td>
                      ) : voidingId === p.id ? (
                         <td colSpan={6} className="px-6 py-4">
                           <div className="space-y-3">
                              <p className="text-sm font-medium text-red-600">Void this payment?</p>
                              <p className="text-xs text-slate-500">This excludes the payment from all totals and recalculates the member's expiry date.</p>
                              <input type="text" placeholder="Reason for voiding (required)" value={voidReason} onChange={e => setVoidReason(e.target.value)} className="w-full bg-slate-50 border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500" autoFocus />
                              <div className="flex gap-2 justify-end mt-2">
                                <button onClick={() => { setVoidingId(null); setVoidReason(''); }} disabled={isSubmitting} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">Cancel</button>
                                <button onClick={() => handleVoidSubmit(p)} disabled={isSubmitting || !voidReason.trim()} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"><Ban size={14}/> Confirm Void</button>
                              </div>
                           </div>
                         </td>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm">
                            <span className={`font-semibold ${p.is_voided ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{formatINR(p.amount)}</span>
                            {p.is_voided && (
                              <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-1">Voided</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {p.method}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {p.payment_type === 'Membership' ? (member.plans?.plan_name || 'Membership') : p.payment_type}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {new Date(p.date).toLocaleDateString('en-GB')}
                            {p.is_edited && !p.is_voided && (
                              <div className="text-[10px] text-blue-600 mt-1" title={`Last edited: ${new Date(p.edited_at).toLocaleString()}`}>Edited</div>
                            )}
                            {p.is_voided && p.void_reason && (
                              <div className="text-[10px] text-red-600 mt-1 truncate max-w-[150px]" title={p.void_reason}>
                                Reason: {p.void_reason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            {!p.is_voided && (
                              <div className="flex items-center justify-center gap-2 transition-opacity w-full">
                                <button onClick={() => handleWaReceipt(p)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors active:scale-95" title="WhatsApp Receipt">
                                  <WhatsAppIcon size={16} />
                                </button>
                                <button onClick={() => startEdit(p)} className="p-1.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors active:scale-95" title="Edit">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => setVoidingId(p.id)} className="p-1.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-md transition-colors active:scale-95" title="Void">
                                  <Ban size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      <CollectPaymentModal 
        isOpen={showCollectModal}
        member={member} 
        onClose={() => {
          setShowCollectModal(false);
          loadPayments();
        }} 
      />
    </>
  );
}

export default function PaymentHistoryModal({ isOpen, member, onClose }: PaymentHistoryModalProps) {
  if (!member && !isOpen) return null;

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="bg-slate-50 w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
    >
      <ModalHeader 
        title={
          <div className="min-w-0 pr-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 md:text-white truncate">{member?.name} - Payment History</h2>
            <p className="text-xs text-slate-500 md:text-slate-300 mt-0.5 truncate">{member?.plans?.plan_name || 'No Plan'} • Expiry: {member?.expiry_date ? new Date(member.expiry_date).toLocaleDateString('en-GB') : 'N/A'}</p>
          </div>
        }
        onClose={onClose} 
      />
        
      <div className="flex-1 overflow-y-auto">
        {member && <PaymentHistoryContent member={member} isOpen={isOpen} />}
      </div>
    </ModalTransition>
  );
}
