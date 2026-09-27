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

export function mapMemberData(member: any) {
  const planPrice = member.plans?.price || 0;
  const totalPaid = (member.payments || [])
    .filter((p: any) => !p.is_voided && p.period_end === member.expiry_date && p.payment_type === 'Membership')
    .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
  const pendingAmount = Math.max(0, planPrice - totalPaid);
  
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
