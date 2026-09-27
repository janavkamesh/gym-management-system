import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'unauthorized', message: 'Not logged in' }, { status: 401 });
    }

    // Check if setup is already complete (idempotent)
    const appMeta = user.app_metadata || {};
    if (appMeta.tenant_setup_complete) {
      return NextResponse.json({ success: true, message: 'Setup already complete' });
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const adminClient = createAdminClient();

    // 1. Update user app_metadata with trial info
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...appMeta,
        tenant_setup_complete: true,
        subscription_status: 'trial',
        trial_end_date: trialEndDate.toISOString(),
      }
    });

    if (updateError) {
      console.error('Failed to update app_metadata:', updateError);
      return NextResponse.json({ error: 'setup_failed', message: 'Could not update tenant metadata' }, { status: 500 });
    }

    // 2. Insert default plans for this new gym
    const { error: planError } = await supabase.from('plans').insert([
      { plan_name: '1 Month', price: 1500, duration_days: 30, user_id: user.id },
      { plan_name: '3 Months', price: 4000, duration_days: 90, user_id: user.id },
      { plan_name: '6 Months', price: 7500, duration_days: 180, user_id: user.id },
      { plan_name: '1 Year', price: 14000, duration_days: 365, user_id: user.id }
    ]);

    if (planError) {
      console.error('Failed to create default plan:', planError);
      // We don't fail the whole request if just the plan fails, but we should log it
    }

    // Refresh the session so the new app_metadata is available to the client
    await supabase.auth.refreshSession();

    return NextResponse.json({ success: true, message: 'Tenant setup complete' });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: err.message }, { status: 500 });
  }
}
