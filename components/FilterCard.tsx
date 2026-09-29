import { Filter, X, Search } from 'lucide-react';
import { Dropdown } from './ui/Dropdown';
import { DatePicker } from './DatePicker';

export type DateChipOption = 'This Month' | 'Last 3 Months' | 'This Year' | 'Custom';

interface FilterCardProps {
  // Search
  showSearch?: boolean;
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Category
  showCategory?: boolean;
  category?: string;
  onCategoryChange?: (val: string) => void;
  categoryOptions?: { value: string; label: string }[];

  // Period
  showPeriod?: boolean;
  period?: string;
  onPeriodChange?: (val: string) => void;
  periodOptions?: { value: string; label: string }[];

  // Direction (Transactions only)
  showDirection?: boolean;
  direction?: string;
  onDirectionChange?: (val: string) => void;
  directionOptions?: { value: string; label: string }[];

  // Date Range Pickers (From/To)
  showDatePickers?: boolean; // If false, never shows them. If true, depends on chips.
  fromDate?: string;
  onFromDateChange?: (val: string) => void;
  toDate?: string;
  onToDateChange?: (val: string) => void;
  dateError?: boolean;

  // Date Range Preset Chips
  showDateChips?: boolean;
  activeDateChip?: DateChipOption;
  onDateChipChange?: (val: DateChipOption) => void;

  hasActiveFilters: boolean;
  onClear: () => void;
  variant?: 'card' | 'inline';
}

export function FilterCard({
  showSearch = false,
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search...',

  showCategory = false,
  category = 'All',
  onCategoryChange,
  categoryOptions = [],

  showPeriod = false,
  period = 'This Month',
  onPeriodChange,
  periodOptions = [],

  showDirection = false,
  direction = 'all',
  onDirectionChange,
  directionOptions = [],

  showDatePickers = true,
  fromDate = '',
  onFromDateChange,
  toDate = '',
  onToDateChange,
  dateError = false,

  showDateChips = false,
  activeDateChip = 'This Month',
  onDateChipChange,

  hasActiveFilters,
  onClear,
  variant = 'card'
}: FilterCardProps) {
  
  // Calculate grid columns dynamically based on visible elements
  // Assuming 1 for search, 1 for direction, 1 for category, 2 for date pickers
  const isCustomOrNoChips = !showDateChips || activeDateChip === 'Custom';
  const showDates = showDatePickers && isCustomOrNoChips;
  
  let cols = 0;
  if (showSearch) cols += 1;
  if (showDirection) cols += 1;
  if (showCategory) cols += 1;
  if (showPeriod) cols += 1;
  if (showDates) cols += 2;

  const gridColsClass = cols >= 6 ? 'md:grid-cols-6' :
                        cols === 5 ? 'md:grid-cols-5' : 
                        cols === 4 ? 'md:grid-cols-4' : 
                        cols === 3 ? 'md:grid-cols-3' : 
                        cols === 2 ? 'md:grid-cols-2' : 
                        'md:grid-cols-1';

  return (
    <div className={variant === 'card' ? "bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-4" : "p-4 space-y-4"}>
      {variant !== 'inline' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <Filter size={18} />
            <h2 className="font-medium">Filters</h2>
          </div>
          <button
            onClick={onClear}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors min-h-12 px-2 touch-manipulation ${hasActiveFilters ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 cursor-not-allowed'}`}
          >
            <X size={16} />
            Clear
          </button>
        </div>
      )}
      
      {showDateChips && (
        <div className="flex flex-wrap gap-2">
          {(['This Month', 'Last 3 Months', 'This Year', 'Custom'] as DateChipOption[]).map((chip) => (
            <button
              key={chip}
              onClick={() => onDateChipChange?.(chip)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                activeDateChip === chip 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {cols > 0 && variant === 'inline' ? (
        <div className="flex flex-col gap-4 w-full">
          {showSearch && (
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full min-h-12 pl-9 pr-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow touch-manipulation"
              />
            </div>
          )}
          
          {showDirection && (
            <div className="w-full [&>div>button]:min-h-12">
              <Dropdown value={direction} onChange={(val) => onDirectionChange?.(val)} options={directionOptions} renderInline={variant === 'inline'} />
            </div>
          )}
          
          {showCategory && (
            <div className="w-full [&>div>button]:min-h-12">
              <Dropdown value={category} onChange={(val) => onCategoryChange?.(val)} options={categoryOptions} renderInline={variant === 'inline'} />
            </div>
          )}

          {showPeriod && (
            <div className="w-full [&>div>button]:min-h-12">
              <Dropdown value={period} onChange={(val) => onPeriodChange?.(val)} options={periodOptions} renderInline={variant === 'inline'} />
            </div>
          )}
          
          {showDates && (
            <div className="flex w-full gap-3">
              <div className="flex-1 min-w-0 [&>button]:min-h-12">
                <DatePicker value={fromDate} onChange={(val) => onFromDateChange?.(val)} placeholder="From" />
              </div>
              
              <div className="flex-1 min-w-0 [&>button]:min-h-12">
                <DatePicker value={toDate} onChange={(val) => onToDateChange?.(val)} placeholder="To" />
              </div>
            </div>
          )}
        </div>
      ) : cols > 0 && (
        <div className={`grid grid-cols-1 ${gridColsClass} gap-4`}>
          {showSearch && (
            <div className={`relative ${variant === 'inline' ? 'flex-1 min-w-50' : 'md:col-span-1'}`}>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full min-h-12 md:min-h-10 pl-9 pr-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow touch-manipulation"
              />
            </div>
          )}

          {showDirection && (
            <div className={variant === 'inline' ? 'flex-1 min-w-35' : ''}>
              <Dropdown
                value={direction}
                onChange={(val) => onDirectionChange?.(val)}
                options={directionOptions}
              />
            </div>
          )}
          
          {showCategory && (
            <div className={variant === 'inline' ? 'flex-1 min-w-35' : ''}>
              <Dropdown
                value={category}
                onChange={(val) => onCategoryChange?.(val)}
                options={categoryOptions}
              />
            </div>
          )}

          {showPeriod && (
            <div className={variant === 'inline' ? 'flex-1 min-w-35' : ''}>
              <Dropdown
                value={period}
                onChange={(val) => onPeriodChange?.(val)}
                options={periodOptions}
              />
            </div>
          )}
          
          {showDates && (
            <>
              <div className={variant === 'inline' ? 'flex-1 min-w-35' : ''}>
                <DatePicker
                  value={fromDate}
                  onChange={(val) => onFromDateChange?.(val)}
                  placeholder="From date"
                />
              </div>
              
              <div className={variant === 'inline' ? 'flex-1 min-w-35' : ''}>
                <DatePicker
                  value={toDate}
                  onChange={(val) => onToDateChange?.(val)}
                  placeholder="To date"
                />
              </div>
            </>
          )}
        </div>
      )}
      
      {showDates && dateError && (
        <p className="text-xs font-medium text-red-500 mt-1">From date must be before To date</p>
      )}
    </div>
  );
}
