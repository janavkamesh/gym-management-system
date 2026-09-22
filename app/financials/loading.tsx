export default function Loading() {
  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-4 md:space-y-6 pb-24 md:pb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="w-48 h-10 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="w-64 h-4 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Row 1: 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 flex flex-col justify-between h-[104px]">
              <div className="flex justify-between items-center mb-2">
                <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
              </div>
              <div className="w-24 h-8 bg-slate-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Row 2: 3 Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 h-[344px] flex flex-col">
              <div className="w-48 h-5 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="flex-1 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Row 3: Expenses List */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div className="w-32 h-6 bg-slate-200 rounded animate-pulse" />
            <div className="w-32 h-9 bg-slate-200 rounded-lg animate-pulse hidden md:block" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <th key={i} className="px-4 md:px-6 py-3">
                      <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-4 md:px-6 py-3.5 md:py-3">
                        <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
