export type StudioSetupStatus='not_started'|'in_progress'|'deferred'|'completed'|'legacy_existing';
export interface StudioSetupState {version:1;revision:number;status:StudioSetupStatus;lastStep:1|2;updatedAt:string;completedAt?:string;checklistDismissed:boolean;}
export interface StudioSetupUpdate {status?:'in_progress'|'deferred'|'completed';lastStep?:1|2;checklistDismissed?:boolean;}
export type StudioSetupResult={ok:true;state:StudioSetupState}|{ok:false;code:string;error:string};
export function normalizeStudioSetup(raw:unknown):StudioSetupState|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;
 const row=raw as Record<string,unknown>;
 if(row.version!==1||!Number.isSafeInteger(row.revision)||Number(row.revision)<1||!['not_started','in_progress','deferred','completed','legacy_existing'].includes(String(row.status))||![1,2].includes(Number(row.last_step))||typeof row.updated_at!=='string')return null;
 return {version:1,revision:Number(row.revision),status:row.status as StudioSetupStatus,lastStep:row.last_step===2?2:1,updatedAt:row.updated_at,completedAt:typeof row.completed_at==='string'?row.completed_at:undefined,checklistDismissed:row.checklist_dismissed===true};
}
export function shouldOfferStudioSetup(state:StudioSetupState|null){return state?.status==='not_started'||state?.status==='in_progress';}
export function setupCurrency(value?:string){const mapped=({'\u20a6':'NGN','$':'USD','\u00a3':'GBP','\u20ac':'EUR'} as Record<string,string>)[value||''];return mapped||(/^[A-Z]{3}$/.test(value||'')?value!:'NGN');}
export function studioMilestones(state:StudioSetupState|null,clients:number,orders:number){return [state?.status==='completed',clients>0,orders>0];}
