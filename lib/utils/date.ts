export function isSingleMonth(fromDate: string | null | undefined, toDate: string | null | undefined): boolean {
  if (!fromDate || !toDate) return false;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  return start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
}

export function toLocalISOString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPeriodRange(period: string, customFrom?: string | null, customTo?: string | null) {
  const today = new Date();
  let start: Date | null = null;
  let end: Date | null = null;
  
  if (period === 'This Month') {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (period === 'Last 3 Months') {
    start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (period === 'Last 6 Months') {
    start = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  } else if (period === 'This Year') {
    start = new Date(today.getFullYear(), 0, 1);
    end = new Date(today.getFullYear(), 11, 31);
  } else if (period === 'Custom' && customFrom && customTo) {
    start = new Date(customFrom);
    end = new Date(customTo);
  }

  const from = start ? toLocalISOString(start) : '';
  const to = end ? toLocalISOString(end) : '';
  
  return { from, to, start, end };
}

export function getPeriodSubtitle(period: string, fromDate?: string | null, toDate?: string | null): string {
  if (period === 'Overall' || (!period && !fromDate && !toDate)) {
    return 'Overall';
  }
  
  const fmt = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      // Create a Date object from the YYYY-MM-DD string, specifying local midnight by appending T00:00:00
      // Using just YYYY-MM-DD in new Date() assumes UTC.
      const d = new Date(`${isoString}T00:00:00`);
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
    } catch {
      return '';
    }
  };

  const s = fmt(fromDate);
  const e = fmt(toDate);

  if (period === 'Custom' || !period) {
    return s && e ? `${s} to ${e}` : 'Overall';
  }
  
  return s && e ? `${period} - ${s} to ${e}` : period;
}
