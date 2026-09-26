import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json({ error: 'missing_fields', message: 'New password is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // The user must already be authenticated via the password reset link (PKCE flow)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'unauthorized', message: 'Not authorized to reset password' }, { status: 401 });
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      return NextResponse.json({ error: 'update_failed', message: error.message }, { status: error.status || 400 });
    }

    // Forcefully log out all other active sessions for this user globally
    const adminClient = createAdminClient();
    await adminClient.auth.admin.signOut(user.id, 'global');

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: err.message }, { status: 500 });
  }
}
