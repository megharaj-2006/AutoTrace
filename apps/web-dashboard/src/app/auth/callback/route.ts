import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/app/projects';
  const incomingError = searchParams.get('error_description') || searchParams.get('error');

  // Support Vercel Edge / Reverse Proxy headers for canonical public origin
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const redirectOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : origin;

  if (incomingError) {
    console.error('[Supabase Auth Callback] Incoming error from OAuth provider:', incomingError);
    return NextResponse.redirect(`${redirectOrigin}/login?error=${encodeURIComponent(incomingError)}`);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        // Redirect directly to the target destination
        const destination = next.startsWith('/') ? next : `/${next}`;
        return NextResponse.redirect(`${redirectOrigin}${destination}`);
      }
      console.error('[Supabase Auth Callback] Error exchanging code for session:', error.message);
      return NextResponse.redirect(`${redirectOrigin}/login?error=${encodeURIComponent(error.message)}`);
    } catch (err: any) {
      console.error('[Supabase Auth Callback] Unhandled exception during session exchange:', err);
      return NextResponse.redirect(`${redirectOrigin}/login?error=${encodeURIComponent(err?.message || 'auth_failed')}`);
    }
  }

  return NextResponse.redirect(`${redirectOrigin}/login?error=auth_failed`);
}
