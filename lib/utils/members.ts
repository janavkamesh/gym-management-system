import { getIndiaDateString } from './date';

export function getPtStatusText(ptEndDate: string | null): 'Active' | 'Expiring' | 'Expired' | null {
  if (!ptEndDate) return null;
  const expiry = new Date(ptEndDate);
  const today = new Date();
  expiry.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  else if (diffDays <= 3) return 'Expiring';
  else return 'Active';
}

export function getPtStatusColor(ptEndDate: string | null): 'Red' | 'Yellow' | 'Green' | null {
  if (!ptEndDate) return null;
  const expiry = new Date(ptEndDate);
  const today = new Date();
  expiry.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Red';
  else if (diffDays <= 3) return 'Yellow';
  else return 'Green';
}

export function isReviewButtonVisible(joinDate: string): boolean {
  if (!joinDate) return false;
  const join = new Date(joinDate + 'T00:00:00+05:30');
  const today = new Date(getIndiaDateString() + 'T00:00:00+05:30');
  const daysSinceJoin = Math.floor((today.getTime() - join.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceJoin >= 30 && daysSinceJoin <= 37;
}

export function isReminderButtonVisible(expiryDate: string): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate + 'T00:00:00+05:30');
  const today = new Date(getIndiaDateString() + 'T00:00:00+05:30');
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return daysLeft <= 3; // Expiring (0 to 3 days) or Expired (< 0)
}

export function isWelcomeButtonVisible(joinDate: string): boolean {
  if (!joinDate) return false;
  const join = new Date(joinDate + 'T00:00:00+05:30');
  const today = new Date(getIndiaDateString() + 'T00:00:00+05:30');
  const daysSinceJoin = Math.floor((today.getTime() - join.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceJoin >= 0 && daysSinceJoin <= 7;
}

import { computeAmountDue } from './amountDue';

export function mapMemberData(member: any) {
  const planPrice = member.plans?.price || 0;
  const pendingAmount = computeAmountDue(member.amount, planPrice, member.expiry_date, member.payments || []);
  
  // PT computations
  const activePt = (member.pt_assignments || []).find((pt: any) => pt.is_active);
  let ptPendingAmount = 0;
  let ptStatusColor = null;
  if (activePt) {
    const ptFee = activePt.fee_amount || 0;
    const ptEndDate = activePt.end_date || activePt.next_pt_due_date;
    const ptTotalPaid = (member.payments || [])
      .filter((p: any) => !p.is_voided && p.period_end === ptEndDate && p.payment_type === 'PT')
      .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
    ptPendingAmount = Math.max(0, ptFee - ptTotalPaid);
    
    ptStatusColor = getPtStatusColor(ptEndDate);
  }

  return {
    ...member,
    pendingAmount,
    ptPendingAmount,
    ptStatusColor
  };
}
