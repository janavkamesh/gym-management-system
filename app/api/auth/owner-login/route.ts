import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'missing_fields', message: 'Email and password are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let errorCode = 'login_failed';
      let message = error.message;
      
      const lowerMessage = error.message.toLowerCase();
      if (lowerMessage.includes('email not confirmed')) {
        errorCode = 'unconfirmed_email';
        message = 'Please verify your email first before logging in.';
      } else if (lowerMessage.includes('invalid login credentials')) {
        errorCode = 'invalid_credentials';
        message = 'Incorrect email or password.';
      } else if (error.status === 429 || lowerMessage.includes('rate limit')) {
        errorCode = 'rate_limit_exceeded';
        message = 'Too many login attempts. Please try again later.';
      }

      return NextResponse.json({ error: errorCode, message }, { status: error.status || 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: err.message }, { status: 500 });
  }
}
