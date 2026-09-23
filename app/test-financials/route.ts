import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getExpenses } from '@/lib/queries/financials';

export async function GET() {
  const supabase = await createClient();
  try {
    const data = await getExpenses(supabase);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || error?.code || error });
  }
}
