import {createContext, useContext} from 'react';
import type {PreviewState} from './model';
export const PreviewStoreContext=createContext<PreviewState|null>(null);
// This adapter is bundled only into the isolated review. It never loads the live store.
export function useStore(){
  const state=useContext(PreviewStoreContext);
  if(!state)throw new Error('PreviewStoreContext is required');
  return {clients:state.clients,orders:state.orders,isHydrated:true,settings:{currency:state.currency,defaultUnit:state.unit}};
}
