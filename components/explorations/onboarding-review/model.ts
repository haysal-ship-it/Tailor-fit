import type {Client, Order} from '@/types';

export type PreviewPage = 'welcome' | 'defaults' | 'overview' | 'clients' | 'order' | 'orders' | 'detail';
export interface PreviewState {
  version: 1;
  page: PreviewPage;
  name: string;
  studio: string;
  unit: 'cm' | 'in';
  currency: string;
  status: 'new' | 'in_progress' | 'deferred' | 'completed';
  clients: Client[];
  orders: Order[];
  checklistHidden: boolean;
}
export const PREVIEW_STORAGE_KEY = 'tailorfit:onboarding-design-preview:v1';
export const freshState = (): PreviewState => ({version:1,page:'welcome',name:'',studio:'',unit:'cm',currency:'NGN',status:'new',clients:[],orders:[],checklistHidden:false});
export function readPreview(raw: string | null): PreviewState {
  try {
    const p = JSON.parse(raw || 'null');
    if (!p || p.version !== 1 || !['welcome','defaults','overview','clients','order','orders','detail'].includes(p.page)) return freshState();
    return {...freshState(), ...p, name:typeof p.name==='string'?p.name:'', studio:typeof p.studio==='string'?p.studio:'', unit:p.unit==='in'?'in':'cm', currency:['NGN','USD','GBP','EUR'].includes(p.currency)?p.currency:'NGN', clients:Array.isArray(p.clients)?p.clients:[], orders:Array.isArray(p.orders)?p.orders:[]};
  } catch { return freshState(); }
}
export function setupProgress(state: PreviewState) {
  return [state.status==='completed',state.clients.length>0,state.orders.length>0];
}
export function scenarioState(scenario:string): PreviewState {
  const state=freshState();
  if(scenario==='fresh')return state;
  if(scenario==='skipped')return {...state,page:'overview',status:'deferred'};
  if(scenario==='defaults'||scenario==='failure'||scenario==='resume')return {...state,page:'defaults',name:'Sal',studio:'Ade Atelier',status:'in_progress'};
  if(scenario==='dashboard')return {...state,page:'overview',name:'Sal',studio:'Ade Atelier',status:'completed'};
  if(scenario==='completed') {
    const today=new Date().toISOString();
    const client:Client={id:'preview-client',name:'Ada Okafor',phone:'',email:'',notes:'',createdAt:today};
    const order:Order={id:'preview-order',clientId:client.id,garmentType:'Aso-oke two-piece',referenceImages:[],price:85000,currency:'NGN',notes:'',status:'In Progress',pickupDateTime:today,createdAt:today};
    return {...state,page:'overview',name:'Sal',studio:'Ade Atelier',status:'completed',clients:[client],orders:[order]};
  }
  return state;
}
