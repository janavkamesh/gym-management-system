import { computeStatusColor } from './utils/status';

export function getMobileStatusDisplay(expiryDate: string | Date | null | undefined) {
  if (!expiryDate) return { text: 'Unknown', bg: 'bg-slate-100', badge: 'bg-slate-100 text-slate-700' };
  
  const statusColor = computeStatusColor(expiryDate);
  const diffTime = new Date(expiryDate).getTime() - new Date().getTime();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (statusColor === 'Green') {
    return { text: 'Active', bg: 'bg-green-600', badge: 'bg-green-100 text-green-700' };
  }
  if (statusColor === 'Yellow') {
    if (days === 0) return { text: 'Due today', bg: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
    return { text: `${days}d left`, bg: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
  }
  
  // Red
  if (days === 0) return { text: 'Expired today', bg: 'bg-red-600', badge: 'bg-red-100 text-red-700' };
  return { text: `Expired · ${Math.abs(days)}d`, bg: 'bg-red-600', badge: 'bg-red-100 text-red-700' };
}
