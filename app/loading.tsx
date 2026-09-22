export default function DashboardLoading() {
  return (
    <div className="flex-1 w-full bg-slate-50 min-h-screen">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
        <div className="flex justify-between items-center">
          <div className="w-40 h-10 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Metric Cards Skeleton - 2x2 on mobile, 3-box on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-[#E2E8F0] flex flex-col h-[116px]">
              <div className="w-24 h-4 bg-slate-200 rounded animate-pulse mb-3" />
              <div className="w-12 h-8 bg-slate-200 rounded animate-pulse mt-auto" />
              <div className="w-32 h-3 bg-slate-200 rounded animate-pulse mt-3" />
            </div>
          ))}
        </div>

        {/* Widgets Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          
          <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 md:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="w-32 h-5 bg-slate-200 rounded animate-pulse" />
              <div className="w-48 h-3 bg-slate-200 rounded animate-pulse mt-2" />
            </div>
            <div className="flex-1 divide-y divide-[#E2E8F0]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-slate-200 rounded-full animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="w-24 h-8 md:h-7 bg-slate-200 rounded-md animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6 md:gap-8 h-[400px]">
            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col flex-1">
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="w-40 h-5 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="flex-1 divide-y divide-[#E2E8F0]">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col flex-1">
              <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="w-40 h-5 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="flex-1 divide-y divide-[#E2E8F0]">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-slate-200 rounded animate-pulse" />
                      <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="w-24 h-8 md:h-7 bg-slate-200 rounded-md animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
