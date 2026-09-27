import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password, gymName, ownerName } = await request.json();
    
    if (!email || !password || !gymName || !ownerName) {
      return NextResponse.json({ error: 'missing_fields', message: 'Email, password, name, and gym name are required' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          gym_name: gymName,
          full_name: ownerName,
        }
      }
    });

    if (error) {
      let errorCode = 'signup_failed';
      let message = error.message;
      
      // Handle known Supabase auth error patterns
      if (error.message.toLowerCase().includes('already registered')) {
        errorCode = 'email_exists';
        message = 'This email is already registered.';
      } else if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        errorCode = 'rate_limit_exceeded';
        message = 'Too many signups from this IP. Please try again in an hour.';
      } else if (error.message.toLowerCase().includes('password')) {
        errorCode = 'weak_password';
      }

      return NextResponse.json({ error: errorCode, message }, { status: error.status || 400 });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: err.message }, { status: 500 });
  }
}
