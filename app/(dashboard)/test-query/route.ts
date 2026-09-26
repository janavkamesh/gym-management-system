import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  const trainersRes = await supabase.from('trainers').select('*');
  const expensesRes = await supabase.from('expenses').select('*');

  return NextResponse.json({
    trainers: trainersRes,
    expenses: expensesRes
  });
}
