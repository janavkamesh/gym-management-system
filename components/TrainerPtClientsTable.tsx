import { formatINR } from '@/lib/utils/formatters';
import Badge from './ui/Badge';
import { Dumbbell } from 'lucide-react';

interface TrainerPtClientsTableProps {
  clients: any[];
}

export default function TrainerPtClientsTable({ clients }: TrainerPtClientsTableProps) {
  return (
    <>
      {/* Mobile List View */}
      <div className="block lg:hidden w-full pb-safe">
        {clients.length === 0 ? (
          <div className="text-center text-slate-500 py-8 flex flex-col items-center">
            <Dumbbell className="mb-2 opacity-50" size={24} />
            <span className="text-sm">No PT clients assigned.</span>
          </div>
        ) : (
          <div className="profile-card rounded-2xl flex flex-col w-full divide-y divide-slate-200 mb-6">
            {clients.map((client: any, idx: number) => {
              const statusText = client.status;
              const badgeClass = statusText === 'Active' ? 'bg-green-100 text-green-700' : statusText === 'Expiring' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

              return (
                <div key={idx} className="py-3.5 px-3 flex flex-col gap-1">
                  {/* Line 1 */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">{client.memberName}</span>
                    <Badge className={`${badgeClass} shrink-0`}>{statusText}</Badge>
                  </div>
                  {/* Line 2 */}
                  <div className="text-xs text-slate-500 truncate">
                    {client.memberUid} &middot; {client.plan}
                  </div>
                  {/* Line 3 */}
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-sm text-slate-900 truncate">
                      <span className="font-semibold">{formatINR(client.shareAmount)}</span> share ({client.commissionPercent}%)
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {client.assignedDate ? new Date(client.assignedDate).toLocaleDateString('en-GB') : '-'}
                    </span>
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
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Member</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Plan</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Commission %</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Share Amount</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Assigned Date</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {clients.map((client: any, idx: number) => {
              const statusText = client.status;
              const badgeClass = statusText === 'Active' ? 'bg-green-100 text-green-700' : statusText === 'Expiring' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    {client.memberName}
                    <div className="text-xs text-slate-500 font-normal">{client.memberUid}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    {client.plan}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {client.commissionPercent}%
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    {formatINR(client.shareAmount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {client.assignedDate ? new Date(client.assignedDate).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={badgeClass}>{statusText}</Badge>
                  </td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                  No PT clients assigned.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
