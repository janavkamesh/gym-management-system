import MemberRow from './MemberRow';

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
  action?: string;
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
  action
}: MemberListProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
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
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left text-sm text-slate-900 min-w-[800px]">
            <thead className="table-header-dark border-b border-slate-200 text-slate-100">
              <tr>
                <th className="px-4 md:px-6 font-medium text-left">Name</th>
                <th className="px-4 md:px-6 font-medium text-left">Plan</th>
                <th className="px-4 md:px-6 font-medium text-left">Days left</th>
                <th className="px-4 md:px-6 font-medium text-left">Status</th>
                <th className="px-4 md:px-6 font-medium text-center">Amount Collected</th>
                <th className="px-4 md:px-6 font-medium text-center">History</th>
                <th className="px-4 md:px-6 font-medium text-center">Send Reminder</th>
                <th className="px-4 md:px-6 font-medium text-center">{isArchived ? 'Restore' : 'Edit'}</th>
                <th className="px-4 md:px-6 font-medium text-center">{isArchived ? 'Delete' : 'Remove'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.map((member) => (
                <MemberRow 
                  key={member.id} 
                  member={member} 
                  trainers={trainers}
                  isArchived={isArchived}
                  onDeleted={() => onDeleted(member.id)} 
                  onEdit={() => onEdit(member)}
                  onRestore={onRestore ? () => onRestore(member.id) : undefined}
                  isHighlighted={highlightedMemberId === member.id || targetMemberId === member.id}
                  isTarget={targetMemberId === member.id}
                  action={action}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
