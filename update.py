import re

with open('components/ExpensesClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { Plus, ChevronDown } from 'lucide-react';", "import { Plus, ChevronDown, Filter, RotateCcw } from 'lucide-react';\nimport BottomSheet from './ui/BottomSheet';\nimport { Dropdown } from './ui/Dropdown';\nimport { DatePicker } from './DatePicker';")

# 2. State & handleClear
clear_old = '''  const handleClear = () => {
    setSelectedCategory('All Categories');
    setPeriod('This Month');
    setFrom(initialStart);
    setTo(initialEnd);
  };'''
clear_new = '''  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const activeFilterCount = (selectedCategory !== 'All Categories' ? 1 : 0) + (period !== 'This Month' ? 1 : 0);

  const handleClear = () => {
    setSelectedCategory('All Categories');
    handlePeriodChange('This Month');
  };'''
content = content.replace(clear_old, clear_new)

# 3. Mobile Header
header_old = '''  return (
    <div className={hideHeader ? "w-full" : "px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto w-full"}>
      <PageHeader
        title="Expenses"
        subtitle="Track and manage your gym's operational expenses."
        hidden={hideHeader}
        className="mb-3 lg:mb-6"
      />'''
header_new = '''  return (
    <div className={hideHeader ? "w-full" : "px-4 pt-5 pb-4 lg:p-8 max-w-7xl mx-auto w-full"}>
      <PageHeader
        title="Expenses"
        subtitle="Track and manage your gym's operational expenses."
        hidden={hideHeader}
        className="mb-3 lg:mb-6"
      />

      {hideHeader && (
        <div className="flex lg:hidden justify-between items-center mb-6 mt-4">
          <div className="flex flex-col justify-center">
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900 tracking-tight">Expenses</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {getPeriodSubtitle(period, from, to)}
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
      )}'''
content = content.replace(header_old, header_new)

# 4. FilterCard and BottomSheet
filtercard_start = '''<FilterCard'''
filtercard_end = '''onClear={handleClear}
        />'''
filtercard_new = '''<div className={hideHeader ? "hidden lg:block" : "block"}>
        <FilterCard
          variant="card"
          showCategory={true}
          category={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryOptions={filterCategories.map(c => ({ value: c, label: c === 'All Categories' ? 'All Categories' : c }))}
          
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
          fromDate={from}
          onFromDateChange={(val) => handlePeriodChange('Custom', val, to)}
          toDate={to}
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
                  value={from}
                  onChange={(val) => handlePeriodChange('Custom', val, to)}
                  placeholder="Start date"
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700">To</label>
                <DatePicker
                  value={to}
                  onChange={(val) => handlePeriodChange('Custom', from, val)}
                  placeholder="End date"
                />
              </div>
            </div>
          )}

          <div className="space-y-3 pb-8">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <Dropdown
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={filterCategories.map(c => ({ value: c, label: c === 'All Categories' ? 'All Categories' : c }))}
              renderInline={true}
            />
          </div>
        </div>
      </BottomSheet>'''
      
import re
content = re.sub(r'<FilterCard.*?onClear=\{handleClear\}\s*/>', filtercard_new, content, flags=re.DOTALL)

# 5. Empty state
empty_old = '''        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-900 font-medium mb-1">No expenses found</p>
            <p className="text-slate-500 text-sm">
              {selectedCategory === 'All Categories' 
                ? "Click 'Add Expense' to start tracking rent, salaries, and bills." 
                : No expenses logged for category "".}
            </p>
          </div>
        ) : ('''
empty_new = '''        ) : filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-900 font-medium mb-1">
              No expenses found{period === 'Overall' ? '' : period === 'Custom' ? ' in this period' :  in }
            </p>
            <p className="text-slate-500 text-sm">
              {selectedCategory === 'All Categories' 
                ? "Click 'Add Expense' to start tracking rent, salaries, and bills." 
                : No expenses logged for category "".}
            </p>
            {hasActiveFilters && (
              <button onClick={handleClear} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                Clear Filters
              </button>
            )}
          </div>
        ) : ('''
content = content.replace(empty_old, empty_new)

with open('components/ExpensesClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
