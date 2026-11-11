import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';

export async function serverSupabase() {
  const config = supabaseConfig();
  if (!config) throw new Error('Online accounts are not configured yet.');
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: updates => {
        try { updates.forEach(({ name, value, options }) => jar.set(name, value, options)); }
        catch { /* Server Components are read-only; middleware refreshes cookies. */ }
      },
    },
  });
}
