import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve('d:/Projects/Micro Saas/GymSoftware/.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: trendPaymentsData } = await supabase.from('payments').select('amount, date').is('is_voided', false);
  
  if (!trendPaymentsData) return;

  const allDates = trendPaymentsData.map((p: any) => p.date).filter(Boolean).sort();
  console.log("Total payments:", trendPaymentsData.length);
  console.log("Earliest date:", allDates[0]);
  console.log("Latest date:", allDates[allDates.length - 1]);

  const start = new Date(allDates[0]);
  const end = new Date(allDates[allDates.length - 1]);

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

  console.log("Months array length:", months.length);
  // Log the ones with revenue > 0 and their names
  const withRev = months.filter(m => m.revenue > 0);
  console.log("Buckets with revenue:", withRev.map(m => `${m.name} ${m.year}: ${m.revenue}`));
  
  // Find duplicate names
  const nameCounts = months.reduce((acc, m) => {
    acc[m.name] = (acc[m.name] || 0) + 1;
    return acc;
  }, {} as any);
  console.log("Name counts:", nameCounts);
}

run().catch(console.error);
