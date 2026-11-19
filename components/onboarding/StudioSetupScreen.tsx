'use client';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Ruler,Wallet} from 'lucide-react';
import {useAccount} from '@/components/auth/AccountProvider';
import {useStore} from '@/lib/store';
import {useDraft} from '@/lib/drafts/use-draft';
import {useWorkspaceNavigationGuard} from '@/lib/use-workspace-navigation-guard';
import {browserSupabase} from '@/lib/supabase/browser';
import {saveProfile} from '@/lib/account/actions';
import {setupCurrency} from '@/lib/onboarding/studio-setup';
import {saveStudioSetup} from '@/lib/onboarding/save-studio-setup';
import {Input} from '@/components/ui/Input';
import {ChoiceMenu} from '@/components/ui/ChoiceMenu';
import {BackButton} from '@/components/ui/BackButton';
import {workspacePrimaryAction} from '@/components/workspace/WorkspaceActions';
import {MannequinDemo} from './MannequinDemo';
import {useStudioSetup} from './StudioSetupContext';

export function StudioSetupScreen({onClose}:{onClose:()=>void}){
  const account=useAccount(),store=useStore(),setup=useStudioSetup();
  const [name,setName]=useState(()=>String(account.user?.user_metadata?.display_name||account.user?.user_metadata?.full_name||'').slice(0,100));
  const [studioName,setStudioName]=useState(store.settings.studio?.name||'');
  const [unit,setUnit]=useState(store.settings.defaultUnit),[currency,setCurrency]=useState(()=>setupCurrency(store.settings.currency));
  const [step,setStep]=useState<1|2>(()=>setup?.state?.lastStep===2&&name?2:1);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[skipFailed,setSkipFailed]=useState(false);
  const pending=useRef(false),leaveApproved=useRef(false),initiallyCompleted=useRef(setup?.state?.status==='completed');
  const root=useRef<HTMLDivElement>(null),heading=useRef<HTMLHeadingElement>(null),nameInput=useRef<HTMLInputElement>(null);
  const data={name,studioName,unit,currency,step};
  const [original,setOriginal]=useState(()=>JSON.stringify(data));const dirty=JSON.stringify(data)!==original;
  const draft=useDraft('studio-setup',data,raw=>{
    if(typeof raw.name==='string')setName(raw.name.slice(0,100));
    if(typeof raw.studioName==='string')setStudioName(raw.studioName.slice(0,200));
    if(raw.unit==='cm'||raw.unit==='in')setUnit(raw.unit);
    if(typeof raw.currency==='string')setCurrency(setupCurrency(raw.currency));
    setStep(raw.step===2&&typeof raw.name==='string'&&raw.name.trim()?2:1);
  },dirty);
  useWorkspaceNavigationGuard(dirty||busy,'Leave studio setup? Your unfinished setup will remain available on this device.',leaveApproved);
  useEffect(()=>{heading.current?.focus({preventScroll:true});},[step]);
  useEffect(()=>{
    const warn=(e:BeforeUnloadEvent)=>{if((dirty||busy)&&!leaveApproved.current){e.preventDefault();e.returnValue='';}};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);
  },[dirty,busy]);
  async function submit(e:React.FormEvent){
    e.preventDefault();if(pending.current||!draft.loaded)return;
    if(!name.trim()){setError('Please enter the name you’d like us to use.');nameInput.current?.focus();return;}
    pending.current=true;setBusy(true);setError('');setSkipFailed(false);
    try{
      const result=await saveStudioSetup({name,studioName,unit,currency},step,{settings:store.settings,saveProfile:value=>saveProfile({...value,expectedOwner:account.user?.id}),updateSettings:store.updateSettings,saveProgress:setup?.saveProgress||(()=>Promise.resolve({ok:false as const,code:'READ_REQUIRED',error:'Reload saved setup progress before retrying.'}))});
      if(!result.ok){setError(result.error);return;}
      if(step===1){setStep(2);return;}
      await draft.discard();setOriginal(JSON.stringify(data));leaveApproved.current=true;
      onClose();
      void browserSupabase().auth.refreshSession().catch(()=>{});
    }catch{setError('Your setup could not be completed. Your choices are still here. Please try again.');}
    finally{pending.current=false;setBusy(false);}
  }
  async function skip(){
    if(pending.current||!draft.loaded)return;pending.current=true;setBusy(true);setError('');
    try{
      await draft.flush().catch(()=>{});
      const saved=await setup?.saveProgress({status:initiallyCompleted.current?'completed':'deferred',lastStep:step});
      if(!saved?.ok){setSkipFailed(true);setError('Your setup progress could not be saved. You can retry, or continue with setup unfinished.');return;}
      leaveApproved.current=true;onClose();
    }catch{setSkipFailed(true);setError('Your setup progress could not be saved. You can retry, or continue with setup unfinished.');}
    finally{pending.current=false;setBusy(false);}
  }
  const currencies=[{value:'NGN',label:'Nigerian naira (NGN)'},{value:'USD',label:'US dollar (USD)'},{value:'GBP',label:'Pound sterling (GBP)'},{value:'EUR',label:'Euro (EUR)'}];
  if(!currencies.some(c=>c.value===currency))currencies.push({value:currency,label:currency});
  return <div ref={root} className="studio-onboarding" onKeyDownCapture={()=>{if(root.current)root.current.dataset.input='keyboard';}} onPointerDownCapture={()=>{if(root.current)root.current.dataset.input='pointer';}}>
    <header className="ob-setup-nav"><span className="ob-brand"><Image src="/assets/auth/logo-icon.png" width={41} height={29} alt="" unoptimized/><strong>TailorFit</strong></span><span className="ob-nav-note">Your studio, brought together.</span><button type="button" className="ob-text-button" onClick={()=>void skip()} disabled={busy||!draft.loaded}>Skip setup<ArrowRight size={14}/></button></header>
    <main className="ob-setup-main" aria-busy={busy||!draft.loaded}>
      <div className="ob-setup-frame"><section className="ob-setup-form" key={step}>
        <div className="ob-step-meta"><span>Set up your studio</span><span>Step {step} of 2</span></div><div className="ob-step-track" aria-hidden="true"><span className="active"/><span className={step===2?'active':''}/></div>
        <form onSubmit={submit} noValidate>
          {step===1?<><div className="ob-intro"><h1 ref={heading} tabIndex={-1}>Make Tailorfit yours.</h1><p>A few details to make this feel like your studio.</p></div><fieldset disabled={busy} className="ob-fields"><Input ref={nameInput} label="Your name" placeholder="What should we call you?" autoComplete="given-name" maxLength={100} value={name} onChange={e=>setName(e.target.value)} error={error&&!name.trim()?error:undefined} helperText="This is how we’ll greet you in your workspace."/><Input label="Studio name (optional)" placeholder="e.g. Ade Atelier" autoComplete="organization" maxLength={200} value={studioName} onChange={e=>setStudioName(e.target.value)} helperText="Working on your own? You can leave this blank."/></fieldset></>:<><div className="ob-intro"><h1 ref={heading} tabIndex={-1}>How does your<br className="ob-desktop-break"/> studio work?</h1><p>A couple of defaults for new orders and measurements.</p></div><fieldset disabled={busy} className="ob-fields"><div className="ob-choice-label"><Ruler size={17}/><div><h2>Measurement unit</h2><p>Use the unit you’re comfortable working in.</p></div></div><ChoiceMenu placeholder="Measurement unit" disabled={busy} value={unit} onChoose={v=>setUnit(v as 'cm'|'in')} options={[{value:'cm',label:'Centimetres (cm)'},{value:'in',label:'Inches (in)'}]}/><div className="ob-choice-label ob-choice-second"><Wallet size={17}/><div><h2>Currency</h2><p>Used for prices on new orders.</p></div></div><ChoiceMenu placeholder="Currency" disabled={busy} value={currency} onChoose={setCurrency} options={currencies}/></fieldset><div className="ob-studio-summary"><span className="ob-avatar">{(studioName||name||'T').slice(0,1).toUpperCase()}</span><div><strong>{studioName||'Your studio'}</strong><span>{name} · {unit==='cm'?'Centimetres':'Inches'} · {currency}</span></div><span className="ob-edit-label">Your defaults</span></div></>}
          {error&&<p className="ob-error" role="alert">{error}{<button type="button" disabled={busy} className="mt-2 block min-h-11 underline" onClick={()=>void Promise.all([store.refresh(),setup?.reload()])}>Reload saved progress</button>}</p>}{skipFailed&&<button type="button" disabled={busy} className="mt-3 min-h-11 text-sm underline" onClick={()=>{leaveApproved.current=true;onClose();}}>Continue without saving setup</button>}{draft.warning&&<p className="mt-3 text-xs text-[var(--text-2)]" role="status">{draft.warning}</p>}
          {step===1?<><button disabled={busy||!draft.loaded} type="submit" className={workspacePrimaryAction+' ob-continue'}>{busy?'Saving your details…':'Continue'}{!busy&&<ArrowRight size={16}/>}</button><p className="ob-settings-note">You can update these details in Settings.</p></>:<><div className="ob-step-actions"><BackButton disabled={busy} onClick={()=>{setStep(1);setError('');}}/><button disabled={busy||!draft.loaded} type="submit" className={workspacePrimaryAction}>{busy?'Saving your defaults…':error?'Try again':'Open my workspace'}{!busy&&<ArrowRight size={16}/>}</button></div><p className="ob-settings-note">New work uses these defaults. You can change them in Settings.</p></>}
        </form>
      </section><aside className="ob-companion"><div className="ob-companion-header"><span className="ob-product-label"><span/>A little more room for your craft.</span><p>Every client. Every measurement.<br/>All in one place.</p></div><div className="ob-mannequin"><MannequinDemo unit={unit}/></div><div className="ob-companion-footer"><Ruler size={17}/><p>Built around the details<br/><strong>that make your work yours.</strong></p></div></aside></div>
      <p className="ob-setup-footnote">Made for independent tailors and growing studios.</p>
    </main>
  </div>;
}
