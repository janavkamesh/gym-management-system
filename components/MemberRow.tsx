'use client';

import { useState } from 'react';
import { computeStatusColor } from '@/lib/utils/status';
import { deleteMember } from '@/lib/actions/members';
import { useToast } from './ToastProvider';
import { MessageCircle, Trash2 } from 'lucide-react';

interface MemberRowProps {
  member: any;
  onDeleted: () => void;
}

export default function MemberRow({ member, onDeleted }: MemberRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const generateWhatsAppLink = (m: any) => {
    const message = `Hi ${m.name}, your Gym membership expires on ${new Date(m.expiry_date).toLocaleDateString()}. Renew now to keep your access active without interruption.`;
    return `https://wa.me/${m.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
  };

  const statusColor = computeStatusColor(member.expiry_date);
  
  const getStatusDisplay = () => {
    if (statusColor === 'Green') return { text: 'Active', bg: 'bg-[#16A34A]', badge: 'bg-green-100 text-green-700' };
    if (statusColor === 'Yellow') return { text: 'Expiring Soon', bg: 'bg-[#EAB308]', badge: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Expired', bg: 'bg-[#DC2626]', badge: 'bg-red-100 text-red-700' };
  };

  const status = getStatusDisplay();

  const getDaysLeft = () => {
    const diffTime = new Date(member.expiry_date).getTime() - new Date().getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `${days} days`;
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${member.name}?`)) return;
    
    setIsDeleting(true);
    try {
      await deleteMember(member.id);
      showToast('Member removed successfully', 'success');
      onDeleted();
    } catch (error) {
      showToast('Failed to remove member. Check your connection.', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 md:px-6 py-3.5 md:py-3 font-medium whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
        {member.name}
      </td>
      <td className="px-4 md:px-6 py-3.5 md:py-3 text-slate-500 whitespace-nowrap text-sm">
        {member.plans?.plan_name || '-'}
      </td>
      <td className="px-4 md:px-6 py-3.5 md:py-3 whitespace-nowrap text-sm text-slate-500">
        {getDaysLeft()}
      </td>
      <td className="px-4 md:px-6 py-3.5 md:py-3 whitespace-nowrap">
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.badge}`}>
          {status.text}
        </span>
      </td>
      <td className="px-4 md:px-6 py-3.5 md:py-3">
        <a
          href={generateWhatsAppLink(member)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center justify-center min-h-[48px] md:min-h-[36px] gap-2 px-3 text-[#16A34A] bg-green-50 hover:bg-green-100 rounded-md font-medium transition-colors active:scale-95 duration-120 touch-manipulation"
        >
          <MessageCircle size={16} />
          <span className="text-xs hidden md:inline">Send Reminder</span>
        </a>
      </td>
      <td className="px-4 md:px-6 py-3.5 md:py-3 text-right">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="inline-flex items-center justify-center min-h-[48px] min-w-[48px] md:min-h-[36px] md:min-w-[36px] p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors active:scale-95 disabled:opacity-50 touch-manipulation"
          title="Remove Member"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}
