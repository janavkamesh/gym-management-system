import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirectTo') || `${new URL(request.url).origin}/auth/callback`;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    });

    if (error) {
      return NextResponse.json({ error: 'oauth_failed', message: error.message }, { status: error.status || 400 });
    }

    if (data?.url) {
      // Typically, an API route for OAuth redirects the user to the provider URL
      return NextResponse.redirect(data.url);
    }

    return NextResponse.json({ error: 'no_url', message: 'No OAuth URL returned' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'internal_error', message: err.message }, { status: 500 });
  }
}
