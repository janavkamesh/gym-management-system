import re

with open('components/ActivityLogsClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { Filter, X, Search } from 'lucide-react';", "import { Filter, X, Search, RotateCcw, ArrowLeft } from 'lucide-react';\nimport { BottomSheet } from './ui/BottomSheet';\nimport { getPeriodRange, getPeriodSubtitle } from '@/lib/utils/date';")

# 2. State
state_old = '''  const [category, setCategory] = useState<ActivityCategory | 'All'>('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');'''
state_new = '''  const [category, setCategory] = useState<ActivityCategory | 'All'>('All');
  const [period, setPeriod] = useState('This Month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const { from: computedFrom, to: computedTo } = getPeriodRange(period, from, to);
  
  const handlePeriodChange = (p: string, f?: string, t?: string) => {
    setPeriod(p);
    setFrom(f || '');
    setTo(t || '');
  };'''
content = content.replace(state_old, state_new)

# Replace 'from' and 'to' references in dateError, hasActiveFilters, and fetchLogs to use computedFrom and computedTo
content = content.replace('const dateError = !!(from && to && from > to);', 'const dateError = !!(computedFrom && computedTo && computedFrom > computedTo);')
content = content.replace("const hasActiveFilters = !!(search || category !== 'All' || from || to);", "const activeFilterCount = (search ? 1 : 0) + (category !== 'All' ? 1 : 0) + (period !== 'This Month' ? 1 : 0);\n  const hasActiveFilters = activeFilterCount > 0;")
content = content.replace("const fromDate = from ? getISTStartOfDay(from) : undefined;", "const fromDate = computedFrom ? getISTStartOfDay(computedFrom) : undefined;")
content = content.replace("const toDate = to ? getISTEndOfDay(to) : undefined;", "const toDate = computedTo ? getISTEndOfDay(computedTo) : undefined;")

# 3. handleClear
clear_old = '''  const handleClear = () => {
    setSearch('');
    setCategory('All');
    setFrom('');
    setTo('');
  };'''
clear_new = '''  const handleClear = () => {
    setSearch('');
    setCategory('All');
    handlePeriodChange('This Month');
  };'''
content = content.replace(clear_old, clear_new)

# 4. Header & FilterCard -> Mobile Header & Desktop FilterCard
header_old = '''  return (
    <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto space-y-3 lg:space-y-6">
      {/* 1. Heading and subtext */}
      <PageHeader
        title="Activity Logs"
        subtitle="A permanent record of everything done in your gym."
      />'''
header_new = '''  return (
    <div className="px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto space-y-3 lg:space-y-6">
      <div className="hidden lg:block">
        <PageHeader
          title="Activity Logs"
          subtitle="A permanent record of everything done in your gym."
        />
      </div>

      <div className="flex lg:hidden justify-between items-center mb-6 mt-4">
        <div className="flex flex-col justify-center">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Activity Logs</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {getPeriodSubtitle(period, computedFrom, computedTo)}
          </p>
        </div>
        
        <button 
          onClick={() => setIsSheetOpen(true)}
          className="flex items-center gap-1.5 min-h-12 px-4 rounded-lg bg-white border border-slate-200 shadow-sm font-medium text-slate-700 active:scale-95 transition-all touch-manipulation"
        >
          <div className="relative">
            <Filter size={18} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-navy text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          Filters
        </button>
      </div>
      
      <div className="lg:hidden relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search activity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-10 pr-4 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
        />
      </div>'''
content = content.replace(header_old, header_new)

# 5. FilterCard & BottomSheet
fc_old = '''      {/* 2. Filter card */}
      <FilterCard
        showSearch={true}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search activity..."

        showCategory={true}
        category={category}
        onCategoryChange={(val) => setCategory(val as ActivityCategory | 'All')}
        categoryOptions={[
          { value: 'All', label: 'All Categories' },
          { value: 'Members', label: 'Members' },
          { value: 'Payments', label: 'Payments' },
          { value: 'Leads', label: 'Leads' },
          { value: 'Trainers', label: 'Trainers' },
          { value: 'Expenses', label: 'Expenses' },
          { value: 'WhatsApp', label: 'WhatsApp' },
          { value: 'Others', label: 'Others' }
        ]}

        showDatePickers={true}
        fromDate={from}
        onFromDateChange={setFrom}
        toDate={to}
        onToDateChange={setTo}
        dateError={dateError}

        hasActiveFilters={hasActiveFilters}
        onClear={handleClear}
      />'''
fc_new = '''      <div className="hidden lg:block">
        <FilterCard
          variant="card"
          showSearch={true}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search activity..."

          showCategory={true}
          category={category}
          onCategoryChange={(val) => setCategory(val as ActivityCategory | 'All')}
          categoryOptions={[
            { value: 'All', label: 'All Categories' },
            { value: 'Members', label: 'Members' },
            { value: 'Payments', label: 'Payments' },
            { value: 'Leads', label: 'Leads' },
            { value: 'Trainers', label: 'Trainers' },
            { value: 'Expenses', label: 'Expenses' },
            { value: 'WhatsApp', label: 'WhatsApp' },
            { value: 'Others', label: 'Others' }
          ]}

          showPeriod={true}
          period={period}
          onPeriodChange={(newPeriod) => {
            const { from: newF, to: newT } = getPeriodRange(newPeriod, from, to);
            handlePeriodChange(newPeriod, newF, newT);
          }}
          periodOptions={[
            { value: 'Overall', label: 'Overall' },
            { value: 'This Month', label: 'This Month' },
            { value: 'Last 3 Months', label: 'Last 3 Months' },
            { value: 'Last 6 Months', label: 'Last 6 Months' },
            { value: 'This Year', label: 'This Year' }
          ]}

          showDatePickers={true}
          fromDate={computedFrom}
          onFromDateChange={(val) => handlePeriodChange('Custom', val, to)}
          toDate={computedTo}
          onToDateChange={(val) => handlePeriodChange('Custom', from, val)}
          dateError={dateError}

          hasActiveFilters={hasActiveFilters}
          onClear={handleClear}
        />
      </div>

      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title="Filters"
        headerAction={
          hasActiveFilters ? (
            <button 
              onClick={handleClear}
              className="flex items-center gap-1.5 min-h-8 px-3 text-sm rounded-full bg-white border border-slate-200 shadow-sm font-semibold text-slate-900 active:scale-95 transition-all duration-120 touch-manipulation"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          ) : null
        }
      >
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Time Period</label>
            <Dropdown
              value={period}
              onChange={(newPeriod) => {
                const { from: newF, to: newT } = getPeriodRange(newPeriod, from, to);
                handlePeriodChange(newPeriod, newF, newT);
              }}
              options={[
                { value: 'Overall', label: 'Overall' },
                { value: 'This Month', label: 'This Month' },
                { value: 'Last 3 Months', label: 'Last 3 Months' },
                { value: 'Last 6 Months', label: 'Last 6 Months' },
                { value: 'This Year', label: 'This Year' }
              ]}
              renderInline={true}
            />
          </div>
          
          {(period !== 'Overall') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">From</label>
                <DatePicker
                  value={computedFrom}
                  onChange={(val) => handlePeriodChange('Custom', val, to)}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">To</label>
                <DatePicker
                  value={computedTo}
                  onChange={(val) => handlePeriodChange('Custom', from, val)}
                  placeholder="End date"
                />
              </div>
            </div>
          )}

          <div className="space-y-3 pb-8">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <Dropdown
              value={category}
              onChange={(val) => setCategory(val as ActivityCategory | 'All')}
              options={[
                { value: 'All', label: 'All Categories' },
                { value: 'Members', label: 'Members' },
                { value: 'Payments', label: 'Payments' },
                { value: 'Leads', label: 'Leads' },
                { value: 'Trainers', label: 'Trainers' },
                { value: 'Expenses', label: 'Expenses' },
                { value: 'WhatsApp', label: 'WhatsApp' },
                { value: 'Others', label: 'Others' }
              ]}
              renderInline={true}
            />
          </div>
        </div>
      </BottomSheet>'''
content = content.replace(fc_old, fc_new)

# 6. Empty state text
empty_old = '''                  <td colSpan={5} className="px-4 md:px-6 py-12 text-center text-slate-500 w-full">
                    <p className="font-medium text-slate-900 mb-1">{hasActiveFilters ? "No matching activity" : "No activity yet"}</p>
                    <p className="text-sm">{hasActiveFilters ? "Try changing or clearing your filters." : "Actions like adding members and logging payments will appear here."}</p>
                    {hasActiveFilters && (
                      <button onClick={handleClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                        Clear Filters
                      </button>
                    )}
                  </td>'''
empty_new = '''                  <td colSpan={5} className="px-4 md:px-6 py-12 text-center text-slate-500 w-full">
                    <p className="font-medium text-slate-900 mb-1">
                      No activity found{period === 'Overall' ? '' : period === 'Custom' ? ' in this period' :  in }
                    </p>
                    <p className="text-sm">
                      {(search || category !== 'All') ? "Try clearing your filters." : "Actions like adding members and logging payments will appear here."}
                    </p>
                    {hasActiveFilters && (
                      <button onClick={handleClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                        Clear Filters
                      </button>
                    )}
                  </td>'''
content = content.replace(empty_old, empty_new)

with open('components/ActivityLogsClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
