'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { computeStatusColor } from '@/lib/utils/status';
import { deleteMember } from '@/lib/actions/members';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { logActivity } from '@/lib/activity-log';
import { useToast } from './ToastProvider';
import { MessageCircle, Trash2, Edit2, X, Plus, History, Check, MoreVertical, Eye } from 'lucide-react';
import Tooltip from './Tooltip';
import CollectPaymentModal from './CollectPaymentModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import Member360Modal from './Member360Modal';
import { ModalTransition } from './ui/ModalTransition';
import { ModalHeader } from './ui/ModalHeader';
import Badge from './ui/Badge';
import { getMobileStatusDisplay } from '@/lib/memberStatus';
import RestoreButton from './RestoreButton';

interface MemberRowProps {
  member: any;
  onDeleted?: () => void;
  onEdit?: () => void;
  isArchived?: boolean;
  onRestore?: (id: string) => Promise<void>;
  isHighlighted?: boolean;
  trainers?: any[];
  isTarget?: boolean;
  shouldOpenModal?: boolean;
  action?: string;
  isDesktop?: boolean;
}

export const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

export default function MemberRow({ member, onDeleted, onEdit, isArchived, onRestore, isHighlighted, trainers, isTarget, shouldOpenModal, action, isDesktop = true }: MemberRowProps) {
  const rowRef = useRef<HTMLElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { showToast } = useToast();
  const lastWaClick = useRef<number>(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleWaClick = () => {
    const now = Date.now();
    if (now - lastWaClick.current > 3000) {
      lastWaClick.current = now;
      logActivity({
        category: 'WhatsApp',
        action: 'WhatsApp opened',
        description: `Opened WhatsApp chat for ${member.name}`,
        entityType: 'member',
        entityId: member.id,
        entityName: member.name
      }).catch(console.error);
    }
  };

  useEffect(() => {
    if (isTarget && rowRef.current) {
      setTimeout(() => {
        rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
    if (shouldOpenModal) {
      setShowProfileModal(true);
    }
  }, [isTarget, shouldOpenModal]);

  const statusColor = computeStatusColor(member.expiry_date);

  const getStatusDisplay = () => {
    if (statusColor === 'Green') return { text: 'Active', bg: 'bg-green-600', badge: 'bg-green-100 text-green-700' };
    if (statusColor === 'Yellow') return { text: 'Expiring Soon', bg: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Expired', bg: 'bg-red-600', badge: 'bg-red-100 text-red-700' };
  };

  const status = getStatusDisplay();
  const hasActivePt = member.pt_assignments?.some((pt: any) => pt.is_active);

  const getDaysLeft = () => {
    const diffTime = new Date(member.expiry_date).getTime() - new Date().getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days ago`;
    return `${days} days`;
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);

    setIsDeleting(true);
    try {
      await deleteMember(member.id);
      showToast('Member removed successfully', 'success');
      if (onDeleted) onDeleted();
    } catch (error) {
      showToast('Failed to remove member. Check your connection.', 'error');
      setIsDeleting(false);
    }
  };

  const handleRestore = async () => {
    if (!onRestore) return;
    setIsRestoring(true);
    try {
      await onRestore(member.id);
      showToast('Member restored successfully', 'success');
    } catch (error) {
      showToast('Failed to restore member. Check your connection.', 'error');
      setIsRestoring(false);
    }
  };

  const Modals = (
    <>
      <CollectPaymentModal isOpen={showCollectModal} member={member} onClose={() => setShowCollectModal(false)} />
      
      {isDesktop ? (
        <tr>
          <td colSpan={9} className="p-0 border-0 h-0">
            <PaymentHistoryModal isOpen={showHistoryModal} member={member} onClose={() => setShowHistoryModal(false)} />
          </td>
        </tr>
      ) : (
        <PaymentHistoryModal isOpen={showHistoryModal} member={member} onClose={() => setShowHistoryModal(false)} />
      )}

      <ModalTransition 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        containerClassName="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <ModalHeader title="Remove Member" onClose={() => setShowDeleteModal(false)} />
        <div className="p-6">
          <p className="text-slate-500 mb-6">
            Are you sure you want to remove <span className="font-semibold text-slate-900">{member.name}</span>?
          </p>
          <div className="flex gap-3 pb-safe">
            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors active:scale-95">Cancel</button>
            <button onClick={handleDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors active:scale-95 flex justify-center items-center disabled:opacity-50">{isDeleting ? 'Removing...' : 'Remove'}</button>
          </div>
        </div>
      </ModalTransition>

      <Member360Modal 
        isOpen={showProfileModal} 
        member={member} 
        trainers={trainers} 
        onClose={() => setShowProfileModal(false)} 
        onEdit={onEdit} 
        onRemove={() => setShowDeleteModal(true)} 
      />
    </>
  );

  if (!isDesktop) {
    const mobileStatus = getMobileStatusDisplay(member.expiry_date);
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
          className={isArchived ? `grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-3 border-b border-slate-100 bg-white ${isHighlighted ? 'bg-blue-50/80 outline outline-2 outline-blue-400' : ''}` : `mobile-member-grid mobile-table-row active:bg-slate-50 cursor-pointer ${isHighlighted ? 'bg-blue-50/80 outline outline-2 outline-blue-400' : ''}`}
        >
          <div className="flex flex-col min-w-0 pr-2">
            <span className={`mobile-table-name ${isArchived ? 'text-slate-500' : ''}`}>{member.name}</span>
            <span className={`mobile-table-sub ${isArchived ? 'text-slate-500' : ''}`}>{member.uid || '-'}</span>
          </div>

          <div className="text-center justify-self-center min-w-0 flex items-center justify-center" style={{ transform: 'translateX(var(--status-shift))' }}>
            <Badge className={`${mobileStatus.badge} text-[11px] font-medium whitespace-nowrap px-2 py-1`}>
              {mobileStatus.text}
            </Badge>
          </div>

          {isArchived ? (
            <div className="text-right justify-self-end">
              <RestoreButton onClick={(e) => { e.stopPropagation(); handleRestore(); }} isRestoring={isRestoring} />
            </div>
          ) : (
            <>
              <div className="text-center justify-self-center flex items-center justify-center min-w-0">
                {member.phone ? (
                  <a
                    href={generateWhatsAppLink(member)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); handleWaClick(); }}
                    aria-label="Send WhatsApp reminder"
                    className="relative after:absolute after:-inset-[2px] after:content-[''] mobile-table-btn text-green-600 bg-green-50"
                  >
                    <WhatsAppIcon size={18} />
                  </a>
                ) : (
                  <div
                    aria-disabled="true"
                    aria-label="No phone number"
                    className="mobile-table-btn text-slate-400 bg-slate-100"
                  >
                    <WhatsAppIcon size={18} />
                  </div>
                )}
              </div>

              <div className="text-center justify-self-center flex items-center justify-center min-w-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCollectModal(true); }}
                  aria-label="Collect payment"
                  className="relative after:absolute after:-inset-[2px] after:content-[''] mobile-table-btn text-slate-600 bg-slate-100"
                >
                  <Check size={18} strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
        </div>
        {Modals}
      </>
    );
  }

  return (
    <>
      <tr
        ref={rowRef as any}
        onClick={() => { if (!isArchived) setShowProfileModal(true); }}
        className={`transition-colors duration-300 hover:bg-slate-50 ${!isArchived ? 'cursor-pointer' : ''} ${isHighlighted ? 'bg-blue-50/80 outline outline-2 outline-blue-400' : ''}`}
      >
        <td className={`relative px-4 md:px-6 py-3.5 md:py-3 font-medium text-left whitespace-nowrap max-w-50 overflow-hidden text-ellipsis ${isArchived ? 'text-slate-500' : ''}`}>
          {hasActivePt && (
            <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-600" />
          )}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 uppercase ${isArchived ? 'bg-slate-400' : 'bg-slate-700'}`}>
              {member.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <span className={isArchived ? 'text-slate-500' : 'text-slate-900'}>{member.name}</span>
              <span className={`text-xs font-normal ${isArchived ? 'text-slate-500' : 'text-slate-400'}`}>{member.uid || '-'}</span>
            </div>
          </div>
        </td>
        <td className={`px-4 md:px-6 py-3.5 md:py-3 text-left whitespace-nowrap text-sm ${isArchived ? 'text-slate-500' : 'text-slate-500'}`}>
          {member.plans?.plan_name || '-'}
        </td>
        <td className={`px-4 md:px-6 py-3.5 md:py-3 whitespace-nowrap text-left text-sm ${isArchived ? 'text-slate-500' : 'text-slate-500'}`}>
          {getDaysLeft()}
        </td>
        <td className="px-4 md:px-6 py-3.5 md:py-3 whitespace-nowrap text-left">
          <div className="flex flex-col items-start gap-1.5">
            <Badge className={status.badge}>
              {status.text}
            </Badge>
            {member.ptStatusColor && (
              <Badge className={
                member.ptStatusColor === 'Green' ? 'bg-green-100 text-green-700' :
                  member.ptStatusColor === 'Yellow' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
              }>
                PT: {member.ptStatusColor === 'Green' ? 'Active' : member.ptStatusColor === 'Yellow' ? 'Expiring' : 'Expired'}
              </Badge>
            )}
          </div>
        </td>
        {isArchived ? (
          <td className="px-4 md:px-6 py-3.5 md:py-3 text-center">
            <RestoreButton onClick={(e) => { e.stopPropagation(); handleRestore(); }} isRestoring={isRestoring} />
          </td>
        ) : (
          <>
            <td className="px-4 md:px-6 py-3.5 md:py-3 text-center">
              <Tooltip content="Amount Collected">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCollectModal(true); }}
                  className="inline-flex mx-auto items-center justify-center min-h-12 min-w-12 md:min-h-9 md:min-w-9 p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-md font-medium transition-colors active:scale-95 duration-120 touch-manipulation"
                >
                  <Check size={18} strokeWidth={2.5} />
                </button>
              </Tooltip>
            </td>
            <td className="px-4 md:px-6 py-3.5 md:py-3 text-center">
              <Tooltip content="Message on WhatsApp">
                <a
                  href={generateWhatsAppLink(member)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => { e.stopPropagation(); handleWaClick(); }}
                  className="inline-flex mx-auto items-center justify-center min-h-12 min-w-12 md:min-h-9 md:min-w-9 p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-md font-medium transition-colors active:scale-95 duration-120 touch-manipulation"
                >
                  <WhatsAppIcon size={18} />
                </a>
              </Tooltip>
            </td>
            <td className="px-4 md:px-6 py-3.5 md:py-3 text-center">
              <Tooltip content="View Profile">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowProfileModal(true); }}
                  className="inline-flex mx-auto items-center justify-center min-h-12 min-w-12 md:min-h-9 md:min-w-9 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md font-medium transition-colors active:scale-95 duration-120 touch-manipulation"
                >
                  <Eye size={18} />
                </button>
              </Tooltip>
            </td>
            <td className="px-4 md:px-6 py-3.5 md:py-3 text-center relative">
              <div className="relative inline-block text-left">
                <button
                  ref={buttonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuPos({
                      top: rect.bottom + window.scrollY + 4,
                      left: rect.right + window.scrollX - 192
                    });
                    setShowMenu(!showMenu);
                  }}
                  className={`inline-flex mx-auto items-center justify-center min-h-12 min-w-12 md:min-h-9 md:min-w-9 p-2 rounded-md font-medium transition-colors active:scale-95 duration-120 touch-manipulation ${isTarget && action === 'cleanup' ? 'ring-4 ring-red-500/70 shadow-lg shadow-red-500/50 bg-red-100 text-red-600 animate-pulse' : 'text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900'}`}
                >
                  <MoreVertical size={18} />
                </button>
                {showMenu && createPortal(
                  <div
                    ref={menuRef}
                    className="absolute w-48 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-[9999] animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: menuPos.top, left: menuPos.left }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowHistoryModal(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <History size={16} /> Payment History
                    </button>
                    {onEdit && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit2 size={16} /> Edit Member
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteModal(true); }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 border-t border-slate-100 ${isTarget && action === 'cleanup' ? 'bg-red-50 text-red-600 font-medium' : 'text-red-600 hover:bg-red-50'}`}
                    >
                      <Trash2 size={16} /> Remove Member
                    </button>
                  </div>,
                  document.body
                )}
              </div>
            </td>
          </>
        )}
      </tr>
      {Modals}
    </>
  );
}
