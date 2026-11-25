'use client';
import {useEffect, useRef, useState, type FormEvent} from 'react';
import type {User} from '@supabase/supabase-js';
import {accountDeletionAvailable, beginDeletionVerification, deleteOwnAccount} from '@/lib/account/actions';
import {browserSupabase} from '@/lib/supabase/browser';
import {clearDrafts} from '@/lib/drafts/storage';
import {clearUploadCache} from '@/lib/data/images';
import {ModalDialog} from '@/components/ui/ModalDialog';
import {Input} from '@/components/ui/Input';

const button = 'inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-medium disabled:opacity-50';
const neutral = button + ' border-[var(--outline)] bg-white hover:bg-[var(--card)]';
type Availability = Awaited<ReturnType<typeof accountDeletionAvailable>> | 'checking';

export function DeleteAccountPanel({user, busy:settingsBusy}: {user:User;busy:boolean}) {
  const [availability,setAvailability] = useState<Availability>('checking');
  const [attempt,retry] = useState(0);
  const [open,setOpen] = useState(false);
  const [verified,setVerified] = useState(false);
  const [password,setPassword] = useState('');
  const [confirmation,setConfirmation] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  const pending = useRef(false);
  const google = !!user.identities?.some(identity => identity.provider === 'google');
  const email = !google || !!user.identities?.some(identity => identity.provider === 'email');
  useEffect(() => {
    let active = true;
    setAvailability('checking');
    accountDeletionAvailable().then(result => {if(active)setAvailability(result);})
      .catch(() => {if(active)setAvailability('unavailable');});
    return () => {active=false;};
  }, [attempt,user.id]);
  useEffect(() => {
    const url = new URL(location.href);
    const result = url.searchParams.get('deletion');
    if (!result) return;
    url.searchParams.delete('deletion');
    history.replaceState(history.state,'',url);
    setOpen(true);
    setVerified(result === 'review');
    if(result !== 'review')setError('Google verification did not finish. Choose the Google account linked to this studio and try again.');
  }, []);
  function close() {
    setOpen(false); setPassword(''); setConfirmation(''); setError(''); setVerified(false);
  }
  async function verify() {
    if(pending.current)return;
    pending.current=true;setBusy(true);setError('');
    try { location.assign(await beginDeletionVerification()); }
    catch { setError('Could not start Google verification. Please try again.'); pending.current=false;setBusy(false); }
  }
  async function remove(event:FormEvent) {
    event.preventDefault();
    if(pending.current)return;
    pending.current=true;setBusy(true);setError('');
    try {
      const result = await deleteOwnAccount({confirmation, expectedOwner:user.id, password:verified ? undefined : password || undefined});
      if(!result.ok)throw new Error(result.error);
    } catch(cause) {
      setError(cause instanceof Error ? cause.message : 'Could not confirm deletion. Check your connection and retry.');
      pending.current=false;setBusy(false);return;
    }
    try {
      await Promise.allSettled([clearDrafts(user.id), browserSupabase().auth.signOut({scope:'local'})]);
      clearUploadCache();
    } finally { location.replace('/account-deleted'); }
  }
  const ready = availability === 'ready';
  const availabilityMessage = availability === 'checking' ? 'Checking availability…'
    : availability === 'unconfigured' ? 'Account deletion is temporarily unavailable.'
    : availability === 'signed-out' ? 'Sign in again to delete your account.'
    : 'We couldn’t check whether deletion is available.';
  const availabilityNotice = !ready && <div className="space-y-2">
    <p role="status" className="text-sm text-[var(--text-2)]">{availabilityMessage}</p>
    {availability !== 'checking' && <button type="button" className={neutral} onClick={()=>retry(n=>n+1)}>Try again</button>}
  </div>;
  return <section className="space-y-4 rounded-lg bg-white p-4 sm:px-6">
    <h2 className="text-base font-semibold">Delete account</h2>
    <p className="text-xs leading-relaxed text-[var(--text-2)]">Permanently delete your account, clients, fittings, orders and stored photos. Export a backup first if you want to keep a copy.</p>
    {user.app_metadata?.deletion_started_at && <p role="status">Deletion was started. Confirm again to finish removing the remaining records.</p>}
    {availabilityNotice}
    <button type="button" disabled={settingsBusy || !ready} className={neutral+' text-red-700'} onClick={()=>setOpen(true)}>Delete my account</button>
    {open && <ModalDialog title="Permanently delete account" onRequestClose={close} busy={busy}>
      <form className="space-y-4 p-4" onSubmit={remove}>
        <p className="text-sm">This permanently removes the studio records and photos for <strong>{user.email}</strong>.</p>
        <fieldset disabled={busy} className="space-y-4">
          {google && <div className="space-y-2">
            {verified && <p role="status" className="text-sm">Google verification complete.</p>}
            <button type="button" disabled={!ready} className={neutral} onClick={verify}>{verified?'Verify again with Google':'Verify with Google'}</button>
          </div>}
          {email && !verified && <Input label={google?'Or use your current password':'Current password'} type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/>}
          <Input label="Type DELETE to confirm" value={confirmation} autoComplete="off" onChange={e=>setConfirmation(e.target.value)} pattern="DELETE" required/>
          {availabilityNotice}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="dialog-actions flex justify-end gap-2">
            <button type="button" className={neutral} onClick={close}>Keep account</button>
            <button type="submit" disabled={!ready || confirmation!=='DELETE' || (!password && !verified)} className={button+' border-red-700 bg-red-700 text-white hover:bg-red-800'}>{busy?'Working…':'Delete permanently'}</button>
          </div>
        </fieldset>
      </form>
    </ModalDialog>}
  </section>;
}
