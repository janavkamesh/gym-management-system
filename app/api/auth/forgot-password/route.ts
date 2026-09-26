import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, redirectTo } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'missing_fields', message: 'Email is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // The frontend should pass its own URL, but we fallback to the origin
    const resetUrl = redirectTo || `${new URL(request.url).origin}/auth/update-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: resetUrl,
    });

    if (error) {
      let errorCode = 'reset_failed';
      let message = error.message;
      
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        errorCode = 'rate_limit_exceeded';
        message = 'Too many password reset requests. Please try again later.';
      }

      return NextResponse.json({ error: errorCode, message }, { status: error.status || 400 });
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent' });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: err.message }, { status: 500 });
  }
}
