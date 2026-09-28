export default function DashboardLoading() {
  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
        <div>
          <div className="w-32 h-7 md:h-8 bg-slate-200 rounded-lg animate-pulse mb-2" />
          <div className="w-72 h-5 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Metric Cards Skeleton - 2x2 on mobile, 4 in a row on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col justify-center h-[116px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-slate-200 rounded animate-pulse" />
                <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="w-12 h-8 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Search & Filter Row Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex w-full md:w-auto">
            <div className="flex bg-[#F1F5F9] rounded-lg p-1 w-full md:w-auto gap-2">
              <div className="w-full md:w-16 h-10 bg-slate-200 rounded-md animate-pulse" />
              <div className="w-full md:w-28 h-10 bg-slate-200 rounded-md animate-pulse" />
              <div className="w-full md:w-20 h-10 bg-slate-200 rounded-md animate-pulse" />
            </div>
          </div>

          <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
            <div className="w-full md:w-[280px] h-12 md:h-10 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-full md:w-36 h-12 md:h-10 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Member List Table Skeleton */}
        <div className="bg-[#FFFFFF] rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[700px]">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="px-4 md:px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4"><div className="w-20 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4"><div className="w-16 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4"><div className="w-28 h-4 bg-slate-200 rounded animate-pulse" /></th>
                <th className="px-4 md:px-6 py-4 text-right"><div className="w-20 h-4 bg-slate-200 rounded animate-pulse ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-4 md:px-6 py-4">
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="space-y-2">
                      <div className="w-28 h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="w-20 h-3 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4"><div className="w-16 h-4 bg-slate-200 rounded animate-pulse" /></td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-slate-200 rounded-full animate-pulse" />
                      <div className="w-16 h-4 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4"><div className="w-24 h-8 bg-slate-200 rounded-md animate-pulse" /></td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex justify-end gap-2 md:gap-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-md animate-pulse" />
                      <div className="w-24 h-10 bg-slate-200 rounded-md animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile FAB Placeholder */}
        <div className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-slate-200 rounded-full shadow-lg animate-pulse" />
      </div>
    </div>
  );
}
