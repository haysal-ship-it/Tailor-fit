'use client';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {useStore} from '@/lib/store';
import {useAccount} from '@/components/auth/AccountProvider';
import {requestWorkspaceNavigation} from '@/lib/workspace-confirmation';
import {shouldOfferStudioSetup,type StudioSetupState,type StudioSetupUpdate,type StudioSetupResult} from '@/lib/onboarding/studio-setup';
import {getStudioOnboarding,updateStudioOnboarding} from '@/lib/onboarding/actions';
import {WorkspaceLoading} from '@/components/workspace/WorkspaceLoading';
import {workspacePrimaryAction,workspaceSecondaryAction} from '@/components/workspace/WorkspaceActions';
import {useTour} from './TourProvider';
import {StudioSetupContext} from './StudioSetupContext';
import {StudioSetupScreen} from './StudioSetupScreen';
export function StudioSetupProvider({children,loadingScreen='workspace'}:{children:ReactNode;loadingScreen?:string}){
 const store=useStore(),account=useAccount(),tour=useTour(),owner=account.user?.id;
 const [state,setState]=useState<StudioSetupState|null>(null),[phase,setPhase]=useState<'loading'|'ready'|'error'>(owner?'loading':'ready'),[error,setError]=useState('');
 const [manual,setManual]=useState(false),[started,setStarted]=useState(false),[suppressed,setSuppressed]=useState(false),[bypassed,setBypassed]=useState(false);
 const current=useRef<StudioSetupState|null>(null),generation=useRef(0),writing=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;generation.current++;};},[]);
 const reload=useCallback(async()=>{
  if(!owner)return null;const request=++generation.current;setPhase('loading');setError('');
  let result:StudioSetupResult;try{result=await getStudioOnboarding(owner);}catch{result={ok:false,code:'READ_FAILED',error:'Your setup status could not be checked. Retry, or continue without setup.'};}
  if(!alive.current||request!==generation.current)return null;
  if(result.ok){current.current=result.state;setState(result.state);setPhase('ready');return result.state;}
  setPhase('error');setError(result.error);return null;
 },[owner]);
 useEffect(()=>{if(owner)queueMicrotask(()=>void reload());},[owner,reload]);
 const eligible=!suppressed&&!bypassed&&!!owner&&phase==='ready'&&store.isHydrated&&!store.error&&shouldOfferStudioSetup(state);
 useEffect(()=>{if(eligible)queueMicrotask(()=>setStarted(true));},[eligible]);
 const open=!!owner&&(manual||started||eligible),registerBlocker=tour.registerBlocker;
 useEffect(()=>open?registerBlocker('studio-setup'):undefined,[open,registerBlocker]);
 const openSetup=useCallback(()=>{
  if(!account.requireAccount())return;
  const go=()=>{if(phase==='ready'&&store.isHydrated&&!store.error)setManual(true);else{setBypassed(false);void reload().then(found=>{if(found&&alive.current)setManual(true);});}};
  if(requestWorkspaceNavigation(go))go();
 },[account,phase,store.isHydrated,store.error,reload]);
 useEffect(()=>{window.addEventListener('tailorfit:request-setup',openSetup);return()=>window.removeEventListener('tailorfit:request-setup',openSetup);},[openSetup]);
 const saveProgress=useCallback(async(update:StudioSetupUpdate):Promise<StudioSetupResult>=>{
  if(!owner||!current.current)return {ok:false,code:'READ_REQUIRED',error:'Reload your saved setup status before retrying.'};
  if(writing.current)return {ok:false,code:'BUSY',error:'Please wait for your current setup change to finish.'};
  writing.current=true;
  try{const result=await updateStudioOnboarding(owner,{...update,expectedRevision:current.current.revision});if(result.ok&&alive.current){current.current=result.state;setState(result.state);}return result;}
  catch{return {ok:false,code:'WRITE_FAILED',error:'Your setup progress was not saved. Reconnect and retry.'};}
  finally{writing.current=false;}
 },[owner]);
 async function setChecklistHidden(hidden:boolean){
  if(!account.requireAccount())return false;
  const result=await saveProgress({checklistDismissed:hidden,...(!hidden&&state?.status==='legacy_existing'?{status:'deferred' as const}:{})});return result.ok;
 }
 const participant=!!owner&&state!==null&&state.status!=='legacy_existing';
 const close=()=>{setManual(false);setStarted(false);setSuppressed(true);};
 const retry=()=>{setBypassed(false);void Promise.all([reload(),store.refresh()]);};
 let content=children;
 if(owner&&!bypassed&&!open&&(!store.isHydrated||phase==='loading'))content=<WorkspaceLoading screen={loadingScreen} stage="records"/>;
 else if(owner&&!bypassed&&!open&&(phase==='error'||store.error))content=<main className="mx-auto mt-12 w-[calc(100%_-_24px)] max-w-md rounded-xl bg-white p-6"><h1 className="text-lg font-semibold">Let’s check your studio setup</h1><p role="alert" className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">{error||store.error}</p><div className="mt-6 flex flex-col gap-2"><button type="button" className={workspacePrimaryAction} onClick={retry}>Retry setup check</button><button type="button" className={workspaceSecondaryAction} onClick={()=>{setBypassed(true);setSuppressed(true);}}>Continue without setup</button></div></main>;
 else if(open)content=<StudioSetupScreen onClose={close}/>;
 return <StudioSetupContext.Provider value={{state,participant,openSetup,setChecklistHidden,saveProgress,reload}}>{bypassed&&phase==='error'&&<div role="status" className="mx-auto mt-3 flex max-w-[1216px] flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-xs text-[var(--text-2)]"><span>Setup status could not be checked. You can keep working and retry later.</span><button type="button" className="min-h-11 px-3 underline" onClick={retry}>Retry setup check</button></div>}{content}</StudioSetupContext.Provider>;
}
