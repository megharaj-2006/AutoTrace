'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AuthCallbackListener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Intercept OAuth 'code' on pages other than /auth/callback
    // (This happens if Supabase redirects to the site root or /login because the allowed URL was configured without /auth/callback)
    const code = searchParams.get('code');
    if (code && pathname !== '/auth/callback') {
      const next = searchParams.get('next') || '/app/projects';
      window.location.href = `/auth/callback?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`;
      return;
    }

    // 2. Intercept hash fragment OAuth tokens or error payloads
    if (window.location.hash) {
      try {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.substring(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);

        // Check for error in hash
        const errorDesc = params.get('error_description') || params.get('error');
        if (errorDesc) {
          console.warn('[AuthCallbackListener] OAuth error in URL hash:', errorDesc);
          // Clear hash and route to login with safe error
          window.history.replaceState(null, '', window.location.pathname);
          router.replace(`/login?error=${encodeURIComponent(errorDesc)}`);
          return;
        }

        // Check for implicit access_token
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        if (accessToken && refreshToken) {
          const supabase = createClient();
          supabase.auth
            .setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            .then(({ error }) => {
              // Clean hash from address bar
              window.history.replaceState(null, '', window.location.pathname);
              if (!error) {
                router.replace('/app/projects');
              } else {
                router.replace(`/login?error=${encodeURIComponent(error.message)}`);
              }
            })
            .catch((err) => {
              console.error('[AuthCallbackListener] Failed to set session from hash:', err);
            });
        }
      } catch (err) {
        console.error('[AuthCallbackListener] Error processing hash params:', err);
      }
    }
  }, [pathname, searchParams, router]);

  return null;
}
