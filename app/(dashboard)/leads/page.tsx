import { createClient } from '@/lib/supabase/server';
import LeadsClient from '@/components/LeadsClient';

export const dynamic = 'force-dynamic';

export default async function LeadsPage(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const filter = searchParams.filter as string | undefined;

  const supabase = await createClient();
  let leadsData = [];
  let initialError;

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('promised_date', { ascending: true });
      
    if (error) {
      console.log("ACTUAL SUPABASE ERROR (LEADS):", JSON.stringify(error, null, 2));
      throw error;
    }
    leadsData = data || [];
  } catch (error) {
    console.log("CATCH BLOCK ERROR (LEADS):", error);
    initialError = "Failed to load leads. Check your connection.";
  }

  return (
    <div className="flex-1 w-full bg-slate-50 min-h-dvh">
      <LeadsClient initialLeads={leadsData || []} initialError={initialError} initialFilter={filter} />
    </div>
  );
}
