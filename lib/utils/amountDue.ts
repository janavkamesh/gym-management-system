export function computeAmountDue(
  targetAmount: number,
  planPrice: number,
  expiryDate: string | null | undefined,
  payments: any[]
): number {
  const cycleTargetAmount = targetAmount || planPrice || 0;
  
  if (!expiryDate) {
    return cycleTargetAmount;
  }

  const currentCyclePayments = (payments || [])
    .filter(p => !p.is_voided && p.payment_type === 'Membership' && p.period_end === expiryDate)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
  return Math.max(0, cycleTargetAmount - currentCyclePayments);
}
