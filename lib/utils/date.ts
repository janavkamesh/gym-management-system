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
