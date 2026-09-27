const trendPaymentsData = [
  { date: '2024-09-10', amount: 1000 },
  { date: '2024-10-15', amount: 2000 },
  { date: '2025-09-20', amount: 5000 },
  { date: '2025-10-25', amount: 3000 },
];

const start = new Date('2024-09-01T00:00:00Z');
const end = new Date('2025-10-31T00:00:00Z');

const months: { month: string, year: number, revenue: number, name: string }[] = [];
let curr = new Date(start.getFullYear(), start.getMonth(), 1);
const endLimit = new Date(end.getFullYear(), end.getMonth(), 1);

while (curr <= endLimit) {
  months.push({
    month: curr.toLocaleString('default', { month: 'short' }),
    year: curr.getFullYear(),
    revenue: 0,
    name: curr.toLocaleString('default', { month: 'short' })
  });
  curr.setMonth(curr.getMonth() + 1);
}

trendPaymentsData.forEach((p: any) => {
  const pDate = new Date(p.date);
  const bucket = months.find(m => m.year === pDate.getFullYear() && pDate.toLocaleString('default', { month: 'short' }) === m.month);
  if (bucket) {
    bucket.revenue += Number(p.amount);
  }
});

console.log("Months array:");
console.log(months);
