import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const email = searchParams.get('email');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';
  const safeNext = next.startsWith('/') ? next : '/dashboard';

  if (errorCode || errorDescription) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });

    if (!error) {
      const destination = type === 'recovery' ? '/auth/reset-password' : safeNext;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Some email templates/providers may land here with token (not token_hash).
  if (token && type && email) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token,
      email,
    });

    if (!error) {
      const destination = type === 'recovery' ? '/auth/reset-password' : safeNext;
      return NextResponse.redirect(`${origin}${destination}`);
    }
    // Expired or already-used code → show specific error
    return NextResponse.redirect(
      `${origin}/auth/auth-code-error?reason=expired`,
    );
  }

  // No code in the URL at all
  return NextResponse.redirect(`${origin}/auth/auth-code-error?reason=invalid`);
}
