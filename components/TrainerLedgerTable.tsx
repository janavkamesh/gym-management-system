import { formatINR } from '@/lib/utils/formatters';
import Badge from './ui/Badge';
import { Download, Banknote } from 'lucide-react';

interface TrainerLedgerTableProps {
  ledger: any[];
}

export default function TrainerLedgerTable({ ledger }: TrainerLedgerTableProps) {
  return (
    <>
      {/* Mobile List View */}
      <div className="block lg:hidden w-full pb-safe">
        {ledger.length === 0 ? (
          <div className="text-center text-slate-500 py-8 flex flex-col items-center">
            <Banknote className="mb-2 opacity-50" size={24} />
            <span className="text-sm">No payment history yet.</span>
          </div>
        ) : (
          <div className="profile-card rounded-2xl flex flex-col w-full divide-y divide-slate-200 mb-6">
            {ledger.map((item: any, idx: number) => {
              const typeColor = item.type === 'Salary' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';

              return (
                <div key={idx} className="py-3.5 px-3 flex flex-col gap-1">
                  {/* Line 1 */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">{formatINR(item.amount)}</span>
                    <span className="text-sm text-slate-500 shrink-0">{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}</span>
                  </div>
                  {/* Line 2 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <Badge className={typeColor}>{item.type}</Badge>
                      <span className="text-xs text-slate-500 truncate">{item.method || '-'}</span>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        title="Download Receipt"
                        className="relative p-1.5 text-slate-400 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors active:scale-95 before:absolute before:-inset-2.5"
                        onClick={() => { console.log('Download Receipt clicked'); }}
                      >
                        <Download size={16} />
                      </button>
                    </div>
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
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Amount</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Method</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Type</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize">Date</th>
              <th className="px-6 py-4 font-semibold tracking-wider capitalize text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {ledger.map((item: any, idx: number) => {
              const typeColor = item.type === 'Salary' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';

              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                    {formatINR(item.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {item.method || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={typeColor}>{item.type}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end">
                      <button
                        title="Download Receipt"
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 md:p-0 min-h-12 min-w-12 md:min-h-0 md:min-w-0 flex items-center justify-center"
                        onClick={() => { console.log('Download Receipt clicked'); }}
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                  No payment history yet.
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
