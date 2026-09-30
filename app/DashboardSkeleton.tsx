export default function DashboardSkeleton() {
  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto space-y-3 lg:space-y-6">
        {/* Page Header */}
        <div className="mb-4 lg:mb-0">
          <div className="w-48 h-7 md:h-8 bg-slate-200 rounded-lg animate-pulse mb-2" />
          <div className="w-72 h-5 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Top Cards (4x) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-[116px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
                <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="w-16 h-8 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Shared Members Panel */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 justify-between items-start lg:items-center">
          <div className="flex w-full lg:w-auto items-center gap-3">
            <div className="w-full lg:w-64 h-10 bg-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="flex flex-row w-full lg:w-auto gap-2 items-center">
            <div className="flex-1 lg:w-70 h-11 lg:h-10 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-32 h-11 lg:h-10 bg-slate-200 rounded-lg animate-pulse shrink-0" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-4">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={i} className="px-6 py-4"><div className="w-20 h-4 bg-slate-200 rounded animate-pulse" /></th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-6 py-4"><div className="w-24 h-4 bg-slate-200 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Table Skeleton */}
          <div className="md:hidden">
            <ul className="divide-y divide-slate-200">
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200 mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="flex gap-2">
                        <div className="h-5 bg-slate-200 rounded-full w-16" />
                        <div className="h-4 bg-slate-200 rounded w-24" />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
