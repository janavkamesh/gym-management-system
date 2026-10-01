'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, CreditCard, User, Clock, IndianRupee, MessageCircle, Wallet, ReceiptText, LayoutDashboard, Award, Banknote, IdCard, Phone, PersonStanding, Bell, Star, Dumbbell, Coins } from 'lucide-react';
import { computeStatusColor } from '@/lib/utils/status';
import { formatINR } from '@/lib/utils/formatters';
import { cleanPhone } from '@/lib/utils/whatsapp';
import { fetchMemberPayments } from '@/lib/actions/payments';
import { PaymentHistoryContent } from './PaymentHistoryModal';
import { GOOGLE_REVIEW_LINK } from '@/lib/constants';
import Badge from './ui/Badge';
import { WhatsAppIcon } from './MemberRow';
import { logActivity } from '@/lib/activity-log';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';

interface Member360ModalProps {
  isOpen: boolean;
  member: any;
  trainers?: any[];
  onClose: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
}

export default function Member360Modal({ isOpen, member, trainers, onClose, onEdit, onRemove }: Member360ModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'membership' | 'personal training' | 'payments'>('overview');
  const [payments, setPayments] = useState<any[]>([]);
  const [lifetimePaid, setLifetimePaid] = useState(0);





  useEffect(() => {
    if (!isOpen) return;
    
    fetchMemberPayments(member.id).then((data) => {
      const validPayments = (data || []).filter(p => !p.is_voided);
      const total = validPayments.reduce((sum, p) => sum + p.amount, 0);
      setPayments(validPayments);
      setLifetimePaid(total);
    });
  }, [member.id, isOpen]);

  const statusColor = computeStatusColor(member.expiry_date);
  const getStatusDisplay = () => {
    if (statusColor === 'Green') return { text: 'Active', bg: 'bg-green-600', badge: 'bg-green-100 text-green-700' };
    if (statusColor === 'Yellow') return { text: 'Expiring Soon', bg: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Expired', bg: 'bg-red-600', badge: 'bg-red-100 text-red-700' };
  };
  const status = getStatusDisplay();

  const getDaysLeft = () => {
    const diffTime = new Date(member.expiry_date).getTime() - new Date().getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days < 0) return Math.abs(days);
    return days;
  };
  const daysLeft = getDaysLeft();
  const isExpired = statusColor === 'Red';
  
  const cycleTargetAmount = member.amount || member.plans?.price || 0;
  const currentCyclePayments = payments
    .filter(p => p.payment_type === 'Membership' && p.period_end === member.expiry_date)
    .reduce((sum, p) => sum + p.amount, 0);
  const amountDue = Math.max(0, cycleTargetAmount - currentCyclePayments);

  // Review request logic (Phase 1)
  const joinDate = new Date(member.join_date);
  const now = new Date();
  const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  const isEligibleForReview = daysSinceJoin >= 30 && !member.review_requested_at;
  const isEligibleForWelcome = daysSinceJoin <= 5;

  const handleWaAction = async (action: 'welcome' | 'expiry' | 'review') => {
    let message = '';
    const phone = cleanPhone(member.phone);
    if (action === 'welcome') {
      message = `Hi ${member.name}, welcome to the gym! We're glad to have you.`;
    } else if (action === 'expiry') {
      message = `Hi ${member.name}, your membership expires on ${new Date(member.expiry_date).toLocaleDateString('en-GB')}. Please renew to continue your fitness journey!`;
    } else if (action === 'review') {
      message = `Hi ${member.name}, we hope you're enjoying your time at the gym. We'd love it if you could leave us a review: ${GOOGLE_REVIEW_LINK}`;
      // Mark review as requested
      try {
        await fetch(`/api/members/${member.id}/review`, { method: 'POST' }); // Using existing endpoint from Phase 1
      } catch (e) {
        console.error('Failed to mark review requested', e);
      }
    }
    const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(link, '_blank');
  };

  const activePtAssignment = member.pt_assignments?.find((pt: any) => pt.is_active);

  if (!member && !isOpen) return null;

  return (
    <ModalTransition 
      isOpen={isOpen} 
      onClose={onClose}
      containerClassName="bg-white w-full md:max-w-4xl rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col h-[90vh] md:h-[80vh] overflow-hidden"
      mobileFixed
    >
      <ModalHeader title="Member Profile" onClose={onClose} variant="light" />

      <div className="w-full h-px bg-slate-200 shrink-0 lg:hidden" />
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden overscroll-contain bg-white">
        <div className="profile-section-spacing pt-4 shrink-0">
          {/* Gap background and Info Card */}
        <div className="px-4 md:px-6 shrink-0 bg-white z-10">
          <div className="profile-header-card">
            <div className="w-[44px] h-[44px] lg:w-14 lg:h-14 rounded-full bg-slate-700 flex items-center justify-center text-xl lg:text-2xl font-bold text-white shrink-0 uppercase shadow-inner">
              {member.name.charAt(0)}
            </div>

            <div className="flex flex-col gap-1 flex-1 min-w-0 justify-center h-[44px] lg:h-auto lg:pr-[240px]">
              {/* Row 1 */}
              <div className="flex items-center gap-2 flex-nowrap">
                <h2 className="text-lg font-semibold text-white truncate leading-tight">{member.name}</h2>
                <div className="shrink-0 px-1 py-[2px] bg-slate-800 text-slate-300 text-[9px] font-medium rounded border border-slate-700 leading-none">
                  {member.uid || 'No UID'}
                </div>
              </div>
              
              {/* Row 2 */}
              <div className="flex items-center">
                <Badge className={`${status.badge} text-[10px] px-2 py-0.5`}>{status.text}</Badge>
              </div>
            </div>

            {/* Action Icons in Top Right */}
            <div className="flex items-start justify-end gap-2 lg:absolute lg:top-4 lg:right-5 lg:bottom-4 lg:items-stretch lg:gap-2.5">
              {isEligibleForWelcome && (
                <button onClick={() => handleWaAction('welcome')} className="group profile-action-btn text-green-400" title="Welcome Msg" aria-label="Welcome Msg">
                  <div className="profile-action-circle">
                    <div className="lg:hidden"><WhatsAppIcon size={22} /></div>
                    <div className="hidden lg:block"><WhatsAppIcon size={28} /></div>
                  </div>
                  <span className="profile-action-btn-text">Welcome</span>
                </button>
              )}
              {(statusColor === 'Yellow' || statusColor === 'Red') && (
                <button onClick={() => handleWaAction('expiry')} className="group profile-action-btn text-yellow-400" title="Expiry Reminder" aria-label="Expiry Reminder">
                  <div className="profile-action-circle">
                    <Bell size={22} className="lg:hidden" />
                    <Bell size={28} className="hidden lg:block" />
                  </div>
                  <span className="profile-action-btn-text">Reminder</span>
                </button>
              )}
              {isEligibleForReview && (
                <button onClick={() => handleWaAction('review')} className="group profile-action-btn text-blue-400" title="Request Review" aria-label="Request Review">
                  <div className="profile-action-circle">
                    <Star size={22} className="lg:hidden" />
                    <Star size={28} className="hidden lg:block" />
                  </div>
                  <span className="profile-action-btn-text">Review</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stat Chip Strip */}
        <div className={`grid grid-cols-2 ${activePtAssignment ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3 bg-white px-6 shrink-0`}>
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 text-white">
              <CreditCard size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Plan</div>
              <div className="text-sm font-semibold text-slate-900 truncate capitalize">{member.plans?.plan_name || 'None'}</div>
            </div>
          </div>
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white">
              <Clock size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Days Left</div>
              <div className={`text-sm font-semibold ${isExpired ? 'text-red-600' : 'text-slate-900'} capitalize`}>
                {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'} {isExpired ? 'Ago' : ''}
              </div>
            </div>
          </div>
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white">
              <Wallet size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Lifetime Paid</div>
              <div className="text-sm font-semibold text-slate-900">{formatINR(lifetimePaid)}</div>
            </div>
          </div>
          <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
            <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center shrink-0 text-white">
              <ReceiptText size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Amount Due</div>
              <div className={`text-sm font-semibold ${amountDue > 0 ? 'text-rose-600' : 'text-green-600'} capitalize`}>
                {amountDue > 0 ? formatINR(amountDue) : 'Paid'}
              </div>
            </div>
          </div>
          {activePtAssignment && (
            <div className="profile-card rounded-xl p-3 flex items-center gap-3 last:odd:col-span-2 md:last:odd:col-span-1">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white">
                <Coins size={16} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 font-medium mb-0.5 capitalize">Training Due</div>
                <div className={`text-sm font-semibold ${(member.ptPendingAmount || 0) > 0 ? 'text-rose-600' : 'text-green-600'} capitalize`}>
                  {(member.ptPendingAmount || 0) > 0 ? formatINR(member.ptPendingAmount) : 'Paid'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Tabs */}
        <div className="profile-tab-container sticky top-0 z-20 lg:relative lg:top-auto lg:z-auto">
          {(['overview', 'membership', ...(activePtAssignment ? ['personal training' as const] : []), 'payments'] as const).map(tab => {
            const TabIcon = tab === 'overview' ? LayoutDashboard : tab === 'membership' ? Award : tab === 'personal training' ? Dumbbell : Banknote;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`profile-tab-btn relative ${
                  activeTab === tab ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
                aria-label={tab}
                role="tab"
              >
                <TabIcon size={18} className="md:w-4 md:h-4" />
                <span className="whitespace-nowrap capitalize">{tab === 'personal training' ? 'Training' : tab}</span>
              </button>
            );
          })}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 bg-white p-6 pb-safe lg:overflow-y-auto min-h-[calc(100%-48px)] lg:min-h-0">
          {activeTab === 'overview' && (
            <div className="w-full">
              {/* Identity Section */}
              <div className="profile-row shadow-sm rounded-2xl flex flex-col relative w-full">
                <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 rounded-t-2xl">
                  <IdCard size={14} className="text-slate-500" />
                  <h3 className="font-medium text-slate-700 text-sm">Identity</h3>
                </div>
                
                <div className="p-4 flex flex-col gap-3 rounded-b-2xl">
                  <div className="profile-card shadow-none p-3 rounded-lg flex items-center gap-3">
                    <Phone size={16} className="text-slate-400" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium capitalize mb-0.5">Phone Number</div>
                      <div className="text-sm text-slate-900 font-medium">{member.phone}</div>
                    </div>
                  </div>
                  <div className="profile-card shadow-none p-3 rounded-lg flex items-center gap-3">
                    <PersonStanding size={16} className="text-slate-400" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium capitalize mb-0.5">Gender</div>
                      <div className="text-sm text-slate-900 font-medium capitalize">{member.gender || 'Not specified'}</div>
                    </div>
                  </div>
                  <div className="profile-card shadow-none p-3 rounded-lg flex items-center gap-3">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <div className="text-[11px] text-slate-500 font-medium capitalize mb-0.5">Member Since</div>
                      <div className="text-sm text-slate-900 font-medium">{new Date(member.join_date).toLocaleDateString('en-GB', { dateStyle: 'medium' })}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'membership' && (
            <>
              {/* Mobile List View */}
              <div className="block lg:hidden w-full pb-safe">
                {payments.filter((p: any) => !p.is_voided && p.payment_type === 'Membership').length === 0 ? (
                  <div className="text-center text-slate-500 py-8 flex flex-col items-center">
                    <Award className="mb-2 opacity-50" size={24} />
                    <span className="text-sm">No renewal history yet.</span>
                  </div>
                ) : (
                  <div className="profile-card rounded-2xl flex flex-col w-full divide-y divide-slate-200">
                    {payments
                      .filter((p: any) => !p.is_voided && p.payment_type === 'Membership')
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((payment: any) => {
                        let rowStatus = { bg: 'bg-green-500', badge: 'bg-green-100 text-green-700', text: 'Active' };
                        if (payment.period_end) {
                          const end = new Date(payment.period_end).getTime();
                          const now = new Date().getTime();
                          const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) {
                            rowStatus = { bg: 'bg-red-500', badge: 'bg-red-100 text-red-700', text: 'Expired' };
                          } else if (diffDays <= 7) {
                            rowStatus = { bg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', text: 'Expiring' };
                          }
                        }
                        return (
                          <div key={payment.id} className="py-3.5 px-3 flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-slate-900 truncate">{member.plans?.plan_name || 'None'}</span>
                              <Badge className={`${rowStatus.badge} shrink-0`}>{rowStatus.text}</Badge>
                            </div>
                            <div className="text-sm text-slate-700 flex items-center gap-1.5 truncate">
                              <span>{payment.period_start ? new Date(payment.period_start).toLocaleDateString('en-GB') : '-'}</span>
                              <span className="text-slate-400">→</span>
                              <span>{payment.period_end ? new Date(payment.period_end).toLocaleDateString('en-GB') : '-'}</span>
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {formatINR(payment.amount)} &middot; {payment.method}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto w-full pb-safe">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative w-full min-w-[600px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-900 text-white text-xs uppercase font-medium">
                        <tr>
                          <th className="px-6 py-4 font-semibold tracking-wider capitalize">Plan</th>
                          <th className="px-6 py-4 font-semibold tracking-wider capitalize">Start Date</th>
                          <th className="px-6 py-4 font-semibold tracking-wider capitalize">End Date</th>
                          <th className="px-6 py-4 font-semibold tracking-wider capitalize">Amount</th>
                          <th className="px-6 py-4 font-semibold tracking-wider capitalize">Payment Method</th>
                          <th className="px-6 py-4 font-semibold tracking-wider capitalize">Status</th>
                        </tr>
                      </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {payments
                      .filter((p: any) => !p.is_voided && p.payment_type === 'Membership')
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((payment: any, idx: number) => {
                        // Determine status based on period_end of this payment row compared to current date
                        let rowStatus = { bg: 'bg-green-500', badge: 'bg-green-100 text-green-700', text: 'Active' };
                        if (payment.period_end) {
                          const end = new Date(payment.period_end).getTime();
                          const now = new Date().getTime();
                          const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) {
                            rowStatus = { bg: 'bg-red-500', badge: 'bg-red-100 text-red-700', text: 'Expired' };
                          } else if (diffDays <= 7) {
                            rowStatus = { bg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', text: 'Expiring' };
                          }
                        }
                        
                        return (
                          <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                              {member.plans?.plan_name || 'None'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {payment.period_start ? new Date(payment.period_start).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {payment.period_end ? new Date(payment.period_end).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                              {formatINR(payment.amount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-500">
                              {payment.method}
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={rowStatus.badge}>{rowStatus.text}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    {payments.filter((p: any) => !p.is_voided && p.payment_type === 'Membership').length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                          No renewal history yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            </>
          )}

          {activeTab === 'personal training' && activePtAssignment && (
            <>
              {/* Mobile List View */}
              <div className="block lg:hidden w-full pb-safe">
                {payments.filter((p: any) => !p.is_voided && p.payment_type === 'PT').length === 0 ? (
                  <div className="text-center text-slate-500 py-8 flex flex-col items-center">
                    <Dumbbell className="mb-2 opacity-50" size={24} />
                    <span className="text-sm">No PT payment history yet.</span>
                  </div>
                ) : (
                  <div className="profile-card rounded-2xl flex flex-col w-full divide-y divide-slate-200">
                    {payments
                      .filter((p: any) => !p.is_voided && p.payment_type === 'PT')
                      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((payment: any, idx: number) => {
                        const ptStatusColor = payment.period_end ? computeStatusColor(payment.period_end) : 'Green';
                        const statusText = ptStatusColor === 'Green' ? 'Active' : ptStatusColor === 'Yellow' ? 'Expiring' : 'Expired';
                        const badgeClass = ptStatusColor === 'Green' ? 'bg-green-100 text-green-700' : ptStatusColor === 'Yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
                        const trainerName = trainers?.find(t => t.id === activePtAssignment.trainer_id)?.name || 'Unknown Trainer';

                        return (
                          <div key={payment.id} className="py-3.5 px-3 flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm text-slate-900 truncate">{trainerName}</span>
                              <Badge className={`${badgeClass} shrink-0`}>{statusText}</Badge>
                            </div>
                            <div className="text-sm text-slate-700 flex items-center gap-1.5 truncate">
                              <span>{activePtAssignment.duration_days} Days</span>
                              <span className="text-slate-400">&middot;</span>
                              <span>{activePtAssignment.trainer_share}%</span>
                              <span className="text-slate-400">&middot;</span>
                              <span>{payment.period_start ? new Date(payment.period_start).toLocaleDateString('en-GB') : '-'} &rarr; {payment.period_end ? new Date(payment.period_end).toLocaleDateString('en-GB') : '-'}</span>
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {formatINR(payment.amount)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto w-full pb-safe">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col relative w-full min-w-[600px] mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-white text-xs uppercase font-medium">
                      <tr>
                        <th className="px-6 py-4 font-semibold tracking-wider capitalize">Trainer</th>
                        <th className="px-6 py-4 font-semibold tracking-wider capitalize">Plan</th>
                        <th className="px-6 py-4 font-semibold tracking-wider capitalize">Commission</th>
                        <th className="px-6 py-4 font-semibold tracking-wider capitalize">Start Date</th>
                        <th className="px-6 py-4 font-semibold tracking-wider capitalize">End Date</th>
                        <th className="px-6 py-4 font-semibold tracking-wider capitalize">Amount</th>
                        <th className="px-6 py-4 font-semibold tracking-wider capitalize">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {payments
                        .filter((p: any) => !p.is_voided && p.payment_type === 'PT')
                        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((payment: any, idx: number) => {
                          const ptStatusColor = payment.period_end ? computeStatusColor(payment.period_end) : 'Green';
                          const statusText = ptStatusColor === 'Green' ? 'Active' : ptStatusColor === 'Yellow' ? 'Expiring' : 'Expired';
                          const badgeClass = ptStatusColor === 'Green' ? 'bg-green-100 text-green-700' : ptStatusColor === 'Yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

                          return (
                            <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                {trainers?.find(t => t.id === activePtAssignment.trainer_id)?.name || 'Unknown Trainer'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                {activePtAssignment.duration_days} Days
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {activePtAssignment.trainer_share}%
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {payment.period_start ? new Date(payment.period_start).toLocaleDateString('en-GB') : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">
                                {payment.period_end ? new Date(payment.period_end).toLocaleDateString('en-GB') : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                {formatINR(payment.amount)}
                              </td>
                              <td className="px-6 py-4">
                                <Badge className={badgeClass}>{statusText}</Badge>
                              </td>
                            </tr>
                          );
                        })}
                      {payments.filter((p: any) => !p.is_voided && p.payment_type === 'PT').length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                            No PT payment history yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'payments' && (
            <PaymentHistoryContent member={member} />
          )}
        </div>
      </div>
        
        {/* Mobile Footer Actions */}
        {onEdit && onRemove && (
          <div className="shrink-0 border-t border-slate-200 bg-white p-4 pb-safe flex gap-3 lg:hidden">
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="flex-1 min-h-12 px-4 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95"
            >
              Edit Member
            </button>
            <button
              onClick={() => {
                onClose();
                onRemove();
              }}
              className="flex-1 min-h-12 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors active:scale-95"
            >
              Remove Member
            </button>
          </div>
        )}
      </ModalTransition>
  );
}
