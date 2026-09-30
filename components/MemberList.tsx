'use client';

import MemberRow from './MemberRow';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MemberListProps {
  members: any[];
  trainers: any[];
  searchQuery?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onEdit: (member: any) => void;
  onDeleted: (memberId: string) => void;
  highlightedMemberId?: string | null;
  isArchived?: boolean;
  onRestore?: (memberId: string) => Promise<void>;
  targetMemberId?: string;
  openMemberId?: string;
  action?: string;
  animationKey?: string;
  animationClass?: string;
  onAnimationEnd?: () => void;
}

export default function MemberList({
  members,
  trainers,
  searchQuery,
  emptyTitle = "No members found",
  emptySubtitle = "Try adjusting your search or filters.",
  onEdit,
  onDeleted,
  highlightedMemberId,
  isArchived = false,
  onRestore,
  targetMemberId,
  openMemberId,
  action,
  animationKey,
  animationClass,
  onAnimationEnd
}: MemberListProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);

  return (
    <div className="mobile-table-card">
      {members.length === 0 ? (
        <div className="p-12 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">{emptyTitle}</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "Try adjusting your search or filters to find what you're looking for."
              : emptySubtitle}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block overflow-x-auto hide-scrollbar">
            <table className="w-full text-left text-sm text-slate-900 min-w-200">
              <thead className="table-header-dark border-b border-slate-200 text-slate-100">
                <tr>
                  <th className="px-4 md:px-6 font-medium text-left">Name</th>
                  <th className="px-4 md:px-6 font-medium text-left">Plan</th>
                  <th className="px-4 md:px-6 font-medium text-left">Days left</th>
                  <th className="px-4 md:px-6 font-medium text-left">Status</th>
                  <th className="px-4 md:px-6 font-medium text-center">Amount Collected</th>
                  <th className="px-4 md:px-6 font-medium text-center">Send Reminder</th>
                  <th className="px-4 md:px-6 font-medium text-center">View</th>
                  <th className="px-4 md:px-6 font-medium text-center w-14">Menu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((member) => (
                  <MemberRow
                    key={`desktop-${member.id}`}
                    member={member}
                    trainers={trainers}
                    isArchived={isArchived}
                    onDeleted={() => onDeleted(member.id)}
                    onEdit={() => onEdit(member)}
                    onRestore={onRestore ? () => onRestore(member.id) : undefined}
                    isHighlighted={highlightedMemberId === member.id || targetMemberId === member.id}
                    isTarget={targetMemberId === member.id}
                    shouldOpenModal={openMemberId === member.id}
                    action={action}
                    isDesktop={true}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="block lg:hidden flex flex-col w-full">
            <div className="table-header-dark mobile-member-grid mobile-table-header">
              <div className="text-left whitespace-nowrap min-w-0 pr-2">Name</div>
              <div className="text-center justify-self-center whitespace-nowrap min-w-0" style={{ transform: 'translateX(var(--status-shift))' }}>Status</div>
              <div className="text-center justify-self-center whitespace-nowrap leading-none min-w-0">Reminder</div>
              <div className="text-center justify-self-center whitespace-nowrap leading-none min-w-0">Collected</div>
            </div>
            <div 
              className={`flex flex-col ${animationClass || ''}`}
              key={animationKey}
              onAnimationEnd={onAnimationEnd}
            >
              {members.map((member) => (
                <MemberRow
                  key={`mobile-${member.id}`}
                  member={member}
                  trainers={trainers}
                  isArchived={isArchived}
                  onDeleted={() => onDeleted(member.id)}
                  onEdit={() => onEdit(member)}
                  onRestore={onRestore ? () => onRestore(member.id) : undefined}
                  isHighlighted={highlightedMemberId === member.id || targetMemberId === member.id}
                  isTarget={targetMemberId === member.id}
                  shouldOpenModal={openMemberId === member.id}
                  action={action}
                  isDesktop={false}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
