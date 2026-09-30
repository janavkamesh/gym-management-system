export default function Skeleton() {
  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto space-y-3 lg:space-y-6">
        {/* Page Header */}
        <div className="mb-4 lg:mb-0 flex justify-between items-start lg:items-center">
          <div>
            <div className="w-48 h-7 md:h-8 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="w-72 h-5 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="lg:hidden w-28 h-10 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Shared Members Panel */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 justify-between items-start lg:items-center">
          <div className="flex w-full lg:w-auto items-center gap-3">
            <div className="w-full lg:w-64 h-12 lg:h-10 bg-slate-200 rounded-lg animate-pulse" />
          </div>
          <div className="flex flex-row w-full lg:w-auto gap-2 items-center">
            <div className="flex-1 lg:w-70 h-12 lg:h-10 bg-slate-200 rounded-lg animate-pulse" />
            <div className="hidden lg:block w-28 h-10 bg-slate-200 rounded-lg animate-pulse shrink-0" />
            <div className="w-32 h-12 lg:h-10 bg-slate-200 rounded-lg animate-pulse shrink-0" />
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
          <div className="md:hidden flex flex-col w-full">
            <div className="table-header-dark mobile-member-grid mobile-table-header">
              <div className="text-left whitespace-nowrap min-w-0 pr-2">Member</div>
              <div className="text-center justify-self-center whitespace-nowrap min-w-0">Status</div>
              <div className="text-center justify-self-center whitespace-nowrap min-w-0">Expiry</div>
              <div className="text-center justify-self-center whitespace-nowrap min-w-0">Contact</div>
            </div>
            <div className="flex flex-col">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="mobile-member-grid mobile-table-row items-center animate-pulse">
                  <div className="flex flex-col min-w-0 pr-2 space-y-1">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-200 rounded w-16"></div>
                  </div>
                  <div className="text-center justify-self-center min-w-0">
                    <div className="h-5 bg-slate-200 rounded-full w-12 mx-auto"></div>
                  </div>
                  <div className="text-center justify-self-center min-w-0 space-y-1">
                    <div className="h-3 bg-slate-200 rounded w-16 mx-auto"></div>
                    <div className="h-2 bg-slate-200 rounded w-12 mx-auto"></div>
                  </div>
                  <div className="text-center justify-self-center min-w-0">
                    <div className="w-9 h-9 bg-slate-200 rounded-lg mx-auto"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
