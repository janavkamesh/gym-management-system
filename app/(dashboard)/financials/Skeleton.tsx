export default function Skeleton() {
  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto">
        
        {/* Mobile Tab Toggle Skeleton */}
        <div className="md:hidden flex justify-center max-lg:mb-header lg:mb-6">
          <div className="w-full max-w-[300px] h-10 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Page Header / Action Row */}
        <div className="max-lg:mb-section lg:mb-6 flex justify-between items-start lg:items-center">
          <div>
            <div className="w-48 h-7 md:h-8 bg-slate-200 rounded-lg animate-pulse mb-2" />
            <div className="w-72 h-5 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="lg:hidden w-28 h-10 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Desktop Filter Row */}
        <div className="hidden lg:block mb-8">
          <div className="w-full h-16 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Row 1: 4 Metric Cards (Financials 2x2) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-lg:mb-section lg:mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col justify-between h-[116px]">
              <div className="flex justify-between items-center mb-2">
                <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
                <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse" />
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

        {/* Row 3: 3 Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-lg:mb-section lg:mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 h-[344px] flex flex-col">
              <div className="w-48 h-5 bg-slate-200 rounded animate-pulse mb-4" />
              <div className="flex-1 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
