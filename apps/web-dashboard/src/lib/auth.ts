import { createClient } from '@/lib/supabase/client';

export type OAuthProvider = 'google' | 'github' | 'linkedin_oidc';

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = createClient();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=/app/projects`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) return null;
  return user;
}
