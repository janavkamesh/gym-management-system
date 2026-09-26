import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'missing_fields', message: 'Email is required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      let errorCode = 'resend_failed';
      let message = error.message;
      
      const lowerMessage = error.message.toLowerCase();
      if (error.status === 429 || lowerMessage.includes('rate limit')) {
        errorCode = 'rate_limit_exceeded';
        message = 'Too many requests. Please try again later.';
      } else if (lowerMessage.includes('already verified')) {
        errorCode = 'already_verified';
        message = 'This email is already verified. You can log in.';
      }

      return NextResponse.json({ error: errorCode, message }, { status: error.status || 400 });
    }

    return NextResponse.json({ success: true, message: 'Verification email resent' });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: err.message }, { status: 500 });
  }
}
