import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/lib/supabase/config';
import { readTicket, signTicket, type DeletionTicket } from './deletion-ticket';

const cookieName = 'tf-delete-verification';
export function adminKey() {
  return process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
}
export async function ticket() {
  return readTicket((await cookies()).get(cookieName)?.value, adminKey() || '');
}
export async function setTicket(value: DeletionTicket | null) {
  const jar = await cookies();
  if (!value) { jar.delete(cookieName); return; }
  const secret = adminKey();
  if (!secret) throw new Error('Account deletion is temporarily unavailable.');
  jar.set(cookieName, signTicket(value, secret), {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 300,
  });
}

// This temporary PKCE client never writes into the studio's authenticated session.
export function verificationClient(storage: Record<string, string>) {
  const config = supabaseConfig()!;
  return createClient(config.url, config.key, { auth: {
    flowType: 'pkce', autoRefreshToken: false, detectSessionInUrl: false, persistSession: true,
    storageKey: 'tf-delete-pkce',
    storage: {
      getItem: key => storage[key] ?? null,
      setItem: (key, value) => { storage[key] = value; },
      removeItem: key => { delete storage[key]; },
    },
  } });
}
