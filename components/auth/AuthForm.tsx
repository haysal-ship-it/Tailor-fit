'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { browserSupabase } from '@/lib/supabase/browser';
import { supabaseConfig } from '@/lib/supabase/config';
import { safeReturnTo } from '@/lib/auth/navigation';
import { AuthLayout } from './AuthLayout';
import { AuthInput } from './AuthInput';
import { GoogleAuthButton } from './GoogleAuthButton';
import { AuthDivider } from './AuthDivider';

export function AuthForm({mode}:{mode:'signin'|'signup'|'reset'|'update'}) {
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[next,setNext]=useState('/app?tab=overview');
  useEffect(()=>{setNext(safeReturnTo(new URLSearchParams(location.search).get('next')));if(new URLSearchParams(location.search).get('error'))setError('That sign-in link could not be completed. Please try again. Your draft remains on the original device.');},[]);
  const callback=()=>`${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy)return;setBusy(true);setError('');setNotice('');
    try {
      const client=browserSupabase();
      if(mode==='signup'){
        const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:callback()}});if(error)throw error;
        if(data.session)location.assign(next);else setNotice('Check your email to confirm your account. Your unfinished draft remains on this device; return here after confirmation.');
      }else if(mode==='signin'){
        const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;location.assign(next);
      }else if(mode==='reset'){
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}/auth/callback?recovery=1&next=${encodeURIComponent(next)}`});if(error)throw error;
        setNotice('If an account exists for this email, you’ll receive a password-reset link.');
      }else{
        const {data}=await client.auth.getUser();if(!data.user)throw new Error('This reset link has expired. Request another password-reset email.');
        const {error}=await client.auth.updateUser({password});if(error)throw error;location.assign(next);
      }
    }catch(error){setError(error instanceof Error?error.message:'Unable to continue. Please retry.');}finally{setBusy(false);}
  };
  const resend=async()=>{setBusy(true);setError('');try{const {error}=await browserSupabase().auth.resend({type:'signup',email,options:{emailRedirectTo:callback()}});if(error)throw error;setNotice('Confirmation email requested. Check your inbox and spam folder.');}catch(e){setError(e instanceof Error?e.message:'Please retry later.');}finally{setBusy(false);}};
  const title={signin:'Sign in to TailorFit',signup:'Sign up for TailorFit',reset:'Reset password',update:'Choose a new password'}[mode];
  return <AuthLayout title={title}><form onSubmit={submit} className="flex w-full flex-col gap-4">
    {(mode==='signin'||mode==='signup')&&<><GoogleAuthButton redirectTo={next}/><AuthDivider/></>}
    {!supabaseConfig()&&<p role="status" className="text-sm text-[#595959]">Online accounts are being set up. You can <Link className="underline" href={next}>keep exploring</Link>; your records have not been uploaded.</p>}
    {mode!=='update'&&<AuthInput type="email" aria-label="Email address" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/>}
    {mode!=='reset'&&<AuthInput isPassword aria-label="Password" placeholder={mode==='signin'?'Password':'Password (at least 8 characters)'} minLength={mode==='signin'?undefined:8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==='signin'?'current-password':'new-password'} required/>}
    {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="text-sm leading-relaxed text-[#2756ad]">{notice}</p>}
    {mode==='signin'&&<Link href={`/reset-password?next=${encodeURIComponent(next)}`} className="text-sm underline">Reset password</Link>}
    <button disabled={busy} className="min-h-11 rounded-full bg-[#1D49E8] px-5 text-white disabled:opacity-60" type="submit">{busy?'Please wait…':({signin:'Continue',signup:'Create account',reset:'Send reset link',update:'Save new password'}[mode])}</button>
    {mode==='signup'&&notice&&<button type="button" disabled={busy} className="min-h-11 text-sm underline" onClick={()=>void resend()}>Resend confirmation email</button>}
    <Link className="py-3 text-center text-sm underline" href={`${mode==='signin'?'/signup':'/signin'}?next=${encodeURIComponent(next)}`}>{mode==='signin'?'Create an account':'Back to sign in'}</Link>
    <Link className="py-2 text-center text-sm text-[#595959]" href={next}>Keep exploring</Link>
  </form></AuthLayout>;
}
