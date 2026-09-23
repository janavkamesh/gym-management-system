export default function Loading() {
  return (
    <div className="flex-1 w-full bg-[#F8FAFC] min-h-screen">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="w-48 h-10 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="w-64 h-5 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="hidden md:block w-32 h-10 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        <div className="bg-[#FFFFFF] rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 md:px-6 py-4"><div className="w-32 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell"><div className="w-24 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4 hidden md:table-cell"><div className="w-24 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4 text-right"><div className="w-20 h-4 bg-slate-200 rounded animate-pulse ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-4 md:px-6 py-4"><div className="w-40 h-4 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-4 md:px-6 py-4"><div className="w-28 h-4 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-4 md:px-6 py-4 hidden md:table-cell"><div className="w-20 h-4 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-4 md:px-6 py-4 hidden md:table-cell"><div className="w-24 h-4 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <div className="w-20 h-9 bg-slate-200 rounded-md animate-pulse" />
                      <div className="w-9 h-9 bg-slate-200 rounded-md animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
