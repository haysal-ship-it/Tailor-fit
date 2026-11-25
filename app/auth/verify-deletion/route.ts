import { NextResponse, type NextRequest } from 'next/server';
import { serverSupabase } from '@/lib/supabase/server';
import { setTicket, ticket, verificationClient } from '@/lib/account/deletion-server';

export async function GET(request: NextRequest) {
  const destination = new URL('/app?tab=settings&deletion=retry', request.url);
  try {
    const intent = await ticket();
    await setTicket(null);
    const code = request.nextUrl.searchParams.get('code');
    if (intent?.stage === 'started' && code) {
      const db = await serverSupabase();
      const { data: { user } } = await db.auth.getUser();
      if (user?.id === intent.owner) {
        const verifier = verificationClient(intent.verifier);
        const { data, error } = await verifier.auth.exchangeCodeForSession(code);
        if (data.session) await verifier.auth.signOut({ scope: 'local' });
        if (!error && data.user?.id === intent.owner) {
          await setTicket({ stage: 'verified', owner: intent.owner });
          destination.searchParams.set('deletion', 'review');
        }
      }
    }
  } catch { /* Return to the safe retry state. */ }
  return NextResponse.redirect(destination, { headers: { 'Cache-Control': 'no-store' } });
}
