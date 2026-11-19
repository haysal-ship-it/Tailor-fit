import type {AppSettings} from '@/types';
import type {StudioSetupUpdate,StudioSetupResult} from './studio-setup';
export interface StudioSetupInput {name:string;studioName:string;unit:'cm'|'in';currency:string;}
export async function saveStudioSetup(input:StudioSetupInput,step:1|2,deps:{settings:AppSettings;saveProfile:(value:{displayName:string})=>Promise<{ok:boolean;error?:string}>;updateSettings:(value:Partial<AppSettings>)=>Promise<boolean>;saveProgress:(value:StudioSetupUpdate)=>Promise<StudioSetupResult>}){
  const name=input.name.trim(),studioName=input.studioName.trim();
  if(!name||name.length>100||studioName.length>200||!['cm','in'].includes(input.unit)||!/^[A-Z]{3}$/.test(input.currency))return {ok:false as const,error:'Review your name, studio details and defaults before continuing.'};
  let profileSaved=false;
  try{
    const result=await deps.saveProfile({displayName:name});
    if(!result.ok)return {ok:false as const,error:result.error||'Your name could not be saved. Please try again.'};
    profileSaved=true;
    const studio={email:'',phone:'',address:'',...deps.settings.studio,name:studioName};
    const saved=await deps.updateSettings({studio,...(step===2?{defaultUnit:input.unit,currency:input.currency}:{})});
    if(!saved)throw new Error('settings');
    const progress=await deps.saveProgress({status:step===2?'completed':'in_progress',lastStep:2});
    if(!progress.ok)return {ok:false as const,error:progress.error};
    return {ok:true as const};
  }catch{return {ok:false as const,error:profileSaved?'Your name was saved, but your studio details weren’t. Your choices are still here. Please try again.':'Could not save your setup. Your choices are still here. Please try again.'};}
}
