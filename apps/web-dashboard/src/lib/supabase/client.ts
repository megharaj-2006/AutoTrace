import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bngrgfsnwubycfgrbhdv.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_Dk7AKQBAHmXKm_Xb0yEDdw_P_p-dcAX';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
