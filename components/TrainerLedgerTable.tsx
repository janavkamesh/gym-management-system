import { formatINR } from '@/lib/utils/formatters';
import Badge from './ui/Badge';
import { Download } from 'lucide-react';

interface TrainerLedgerTableProps {
  ledger: any[];
}

export default function TrainerLedgerTable({ ledger }: TrainerLedgerTableProps) {
  return (
    <div className="overflow-x-auto w-full pb-safe">
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
              const typeColor = item.type === 'Salary' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';

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
  );
}
