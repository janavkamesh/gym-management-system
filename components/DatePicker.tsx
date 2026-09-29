'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import 'react-day-picker/style.css';

const DATE_FORMAT = 'yyyy-MM-dd';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomDropdown(props: any) {
  const { options, value, onChange, "aria-label": ariaLabel } = props;
  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<HTMLUListElement>(null);

  React.useEffect(() => {
    if (open) {
      // Delay slightly to allow Popover content to mount in the DOM
      const timer = setTimeout(() => {
        if (listRef.current) {
          const selectedEl = listRef.current.querySelector('[data-selected="true"]');
          if (selectedEl) {
            selectedEl.scrollIntoView({ block: 'center', behavior: 'instant' });
          }
        }
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleSelect = (val: number) => {
    if (onChange) {
      onChange({ target: { value: val.toString() } });
    }
    setOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedOption = options?.find((o: any) => o.value === value);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className="px-4 py-1.5 rounded-full text-sm font-medium text-blue-700 bg-blue-600/10 hover:bg-blue-600/20 data-[state=open]:bg-blue-600/20 transition-colors flex items-center justify-center gap-1.5 min-h-8 md:min-h-0 active:scale-95 duration-120 touch-manipulation"
        >
          {selectedOption?.label || value}
          <ChevronDown size={14} className="opacity-70" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[9999] bg-white rounded-lg shadow-md border border-slate-200 p-1 w-32 max-h-60 overflow-y-auto origin-top animate-in fade-in slide-in-from-top-1 duration-150 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100 data-[state=closed]:ease-in"
          align="center"
          sideOffset={4}
        >
          <ul ref={listRef} className="flex flex-col">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {options?.map((option: any) => (
              <li key={option.value}>
                <button
                  type="button"
                  data-selected={option.value === value}
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    option.value === value
                      ? 'bg-blue-600 text-white font-medium'
                      : option.disabled
                      ? 'opacity-50 cursor-not-allowed text-slate-400'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  disabled,
  placeholder = 'Pick a date',
}: {
  value?: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Safely parse string to Date
  const parseDate = (dateStr?: string) => {
    if (!dateStr) return undefined;
    const parsed = parse(dateStr, DATE_FORMAT, new Date());
    return isValid(parsed) ? parsed : undefined;
  };

  const selectedDate = parseDate(value);
  const [localSelected, setLocalSelected] = React.useState<Date | undefined>(selectedDate);

  // Keep local state in sync when external value changes or modal opens
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSelected(parseDate(value));
  }, [value, isOpen]);

  const fromDate = parseDate(min);
  const toDate = parseDate(max);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setLocalSelected(date); // Immediate visual feedback
      // Wait 120ms before closing to allow user to see the selection animation
      setTimeout(() => {
        onChange(format(date, DATE_FORMAT));
        setIsOpen(false);
      }, 120);
    }
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg min-h-12 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white flex items-center justify-between transition-colors ${
            disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          <span className={selectedDate ? 'text-slate-900' : 'text-slate-400'}>
            {selectedDate ? format(selectedDate, 'MMM d, yyyy') : placeholder}
          </span>
          <CalendarIcon size={18} className="text-slate-800 shrink-0" />
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content 
          className="z-[9999] bg-white rounded-xl shadow-md border border-slate-200 p-3 origin-top animate-in fade-in slide-in-from-top-1 duration-150 ease-out data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:slide-out-to-top-1 data-[state=closed]:duration-100 data-[state=closed]:ease-in"
          align="start"
          sideOffset={8}
        >
          <style>{`
            .rdp-root {
              --rdp-accent-color: #2563eb;
              --rdp-background-color: #eff6ff;
              --rdp-accent-background-color: #eff6ff;
              /* Desktop compact sizing (approx 30% reduction from 40px) */
              --rdp-day-height: 28px;
              --rdp-day-width: 28px;
              font-size: 0.875rem;
              margin: 0;
            }
            .rdp-day_button {
              transition: all 0.12s ease-in-out;
            }
            /* Hover state for unselected cells */
            .rdp-day_button:not(.rdp-day_selected):not([disabled]):hover {
              background-color: #f1f5f9;
            }
            /* Click/Touch tactile feedback */
            .rdp-day_button:not([disabled]):active {
              transform: scale(0.95);
            }
            .rdp-day_selected {
              color: white !important;
              background-color: var(--rdp-accent-color) !important;
              font-weight: 500;
              transform: scale(0.85);
            }
            .rdp-day_selected:hover {
              background-color: #1d4ed8 !important;
            }
            .rdp-day_selected:active {
              transform: scale(0.8);
            }
            /* Mobile/Tablet thumb-friendly sizing (>= 48px) */
            @media (max-width: 768px) {
              .rdp-root {
                --rdp-day-height: 48px;
                --rdp-day-width: 48px;
                font-size: 1rem;
              }
            }
            
            /* Year Navigation Styling adjustments for v10 */
            .rdp-dropdowns {
              gap: 8px;
            }
            .rdp-dropdown {
              padding: 4px 8px;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              background: white;
              color: #0f172a;
              font-size: 0.875rem;
              font-weight: 500;
              cursor: pointer;
            }
            .rdp-dropdown:hover {
              border-color: #cbd5e1;
              background: #f8fafc;
            }
          `}</style>
          <DayPicker
            mode="single"
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={new Date(2050, 11)}
            selected={localSelected}
            onSelect={handleSelect}
            disabled={(date) => {
              if (fromDate && date < fromDate) return true;
              if (toDate && date > toDate) return true;
              return false;
            }}
            showOutsideDays
            components={{
              Dropdown: CustomDropdown
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
