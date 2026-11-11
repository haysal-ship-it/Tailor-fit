import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { serverSupabase } from '@/lib/supabase/server';
import { safeReturnTo } from '@/lib/auth/navigation';

export async function GET(request:NextRequest) {
  const params=request.nextUrl.searchParams;const next=safeReturnTo(params.get('next'));
  try {
    const client=await serverSupabase();let success=false;
    if(params.get('code'))success=!(await client.auth.exchangeCodeForSession(params.get('code')!)).error;
    else if(params.get('token_hash')&&['signup','email','recovery'].includes(params.get('type')||''))success=!(await client.auth.verifyOtp({token_hash:params.get('token_hash')!,type:params.get('type') as EmailOtpType})).error;
    if(success){const target=params.get('recovery')==='1'||params.get('type')==='recovery'?`/update-password?next=${encodeURIComponent(next)}`:next;return NextResponse.redirect(new URL(target,request.url));}
  }catch{}
  return NextResponse.redirect(new URL(`/signin?error=callback&next=${encodeURIComponent(next)}`,request.url));
}
