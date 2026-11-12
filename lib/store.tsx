'use client';
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Client, MeasurementSnapshot, Order, AppSettings, OrderStatus, HotspotDefinition, GarmentTemplate } from '@/types';
import { DEFAULT_SETTINGS, DEFAULT_HOTSPOTS, normalizeMeasurementsRecord, SAMPLE_CLIENTS, SAMPLE_SNAPSHOTS, SAMPLE_ORDERS } from './initial-data';
import { useAccount } from '@/components/auth/AccountProvider';
import { commitRecords, importWorkspace } from './data/actions';
import { readWorkspace, stageImages } from './data/repository';
import { normalizeDate, type Operation } from './data/schema';
import { exportBackup, importOperations, stableUuid } from './data/backup';
import type { BackupPayload } from './backup';

export type Intake = {
  requestId: string;
  client: Partial<Client> & {name:string};
  snapshot?: Omit<MeasurementSnapshot,'id'|'clientId'> & {id?:string};
  order: Omit<Order,'id'|'clientId'|'createdAt'> & {id?:string;version?:number};
};
interface StoreContextType {
  isHydrated: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  error: string;
  refresh: () => Promise<void>;
  importBrowserRecords: (payload: BackupPayload) => Promise<boolean>;
  saveIntake: (input: Intake) => Promise<{clientId:string;snapshotId?:string;orderId:string} | null>;
  clients: Client[];
  snapshots: MeasurementSnapshot[];
  orders: Order[];
  settings: AppSettings;
  allHotspots: HotspotDefinition[];
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  selectedSnapshotId: string | null;
  setSelectedSnapshotId: (id: string | null) => void;

  // Actions
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;

  addSnapshot: (snapshot: Omit<MeasurementSnapshot, 'id'>) => Promise<MeasurementSnapshot | null>;
  updateSnapshot: (id: string, updates: Partial<MeasurementSnapshot>) => Promise<boolean>;
  deleteSnapshot: (id: string) => Promise<boolean>;

  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<Order | null>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<boolean>;
  deleteOrder: (id: string, expectedVersion?:number) => Promise<boolean>;

  updateSettings: (updates: Partial<AppSettings>) => Promise<boolean>;
  addCustomField: (field: HotspotDefinition) => Promise<boolean>;
  deleteCustomField: (key: string) => Promise<boolean>;
  addTemplate: (template: GarmentTemplate) => Promise<boolean>;
  updateTemplate: (id: string, updates: Partial<GarmentTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;

  resetToDemoData: () => Promise<boolean>;
  clearAllData: () => Promise<boolean>;
  exportDataJson: () => Promise<boolean>;
  restoreBackupData: (payload: import('./backup').BackupPayload) => Promise<boolean>;

  // Nav helpers
  openClientProfile: (clientId: string) => void;
  openNewMeasurementForClient: (clientId?: string) => void;
  openNewOrderForClient: (clientId?: string) => void;
  openEditOrder: (orderId: string) => void;

  // Query helpers
  getClientById: (id: string) => Client | undefined;
  getClientOrders: (clientId: string) => Order[];
  getClientSnapshots: (clientId: string) => MeasurementSnapshot[];
  getSnapshotById: (id: string) => MeasurementSnapshot | undefined;
  getOrdersDueToday: () => Order[];
  getOrdersOverdue: () => Order[];
  getOrdersDueThisWeek: () => Order[];
  getOrdersReady: () => Order[];
}

const StoreContext = createContext<StoreContextType | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const account = useAccount();
  const owner = account.user?.id;
  const [isHydrated,setIsHydrated] = useState(!owner);
  const [clients,setClients] = useState<Client[]>(() => owner ? [] : SAMPLE_CLIENTS);
  const [snapshots,setSnapshots] = useState<MeasurementSnapshot[]>(() => owner ? [] : SAMPLE_SNAPSHOTS);
  const [orders,setOrders] = useState<Order[]>(() => owner ? [] : SAMPLE_ORDERS);
  const [settings,setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saveStatus,setSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [error,setError] = useState('');
  const [activeScreen,setActiveScreen] = useState('overview');
  const [selectedClientId,setSelectedClientId] = useState<string|null>(null);
  const [selectedOrderId,setSelectedOrderId] = useState<string|null>(null);
  const [selectedSnapshotId,setSelectedSnapshotId] = useState<string|null>(null);
  const alive = useRef(true);
  const busy = useRef(false);
  const refreshGeneration = useRef(0);
  const pending = useRef(new Map<string,string>());
  useEffect(() => { alive.current=true; return () => { alive.current=false; }; },[]);
  const refresh = useCallback(async () => {
    if (!owner) { setIsHydrated(true); return; }
    const generation=++refreshGeneration.current;
    try {
      const data=await readWorkspace();
      if (!alive.current || generation!==refreshGeneration.current) return;
      setClients(data.clients);setSnapshots(data.snapshots);setOrders(data.orders);setSettings(data.settings);
    } catch(e) { if(alive.current)setError(e instanceof Error?e.message:'Could not load your workspace. Reconnect and retry.'); }
    finally { if(alive.current)setIsHydrated(true); }
  },[owner]);
  useEffect(() => {
    void refresh();
    const resume=()=>{if(document.visibilityState==='visible'&&!busy.current)void refresh();};
    window.addEventListener('online',resume);document.addEventListener('visibilitychange',resume);
    const interval=setInterval(resume,12*60*1000);
    return()=>{window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume);clearInterval(interval);};
  },[refresh]);
  const allHotspots=React.useMemo(()=>Array.from(new Map([...DEFAULT_HOTSPOTS,...settings.customFields].map(h=>[h.key,h])).values()),[settings.customFields]);
  const fail=(e:unknown)=>{if(alive.current){setError(e instanceof Error?e.message:'Not saved — reconnect and retry.');setSaveStatus('error');}return false;};
  const execute=async(ops:Operation[],requestId?:string,replace=false,importing=false)=>{
    if(!account.requireAccount()||!owner)return false;
    if(busy.current)return false;
    if(!navigator.onLine)return fail(new Error('Not saved — reconnect and retry. Your draft remains on this device.'));
    busy.current=true;setSaveStatus('saving');setError('');
    const signature=JSON.stringify(ops);
    const request=requestId||pending.current.get(signature)||crypto.randomUUID();
    pending.current.set(signature,request);
    try{
      const staged=await stageImages(ops,owner);
      const expected=[...clients,...snapshots,...orders,settings].reduce((n,r)=>n+(r.version||0),0);
      const result=importing?await importWorkspace(request,staged,replace,expected,owner):await commitRecords(request,staged,owner);
      if(!result.ok){if(result.error.code==='AUTH_REQUIRED')account.openAuth();throw new Error(result.error.message);}
      pending.current.delete(signature);
      if(!alive.current)return false;
      setSaveStatus('saved');await refresh();return true;
    }catch(e){return fail(e);}finally{busy.current=false;}
  };
  const put=async<T extends {id:string;version?:number}>(kind:Operation['kind'],record:T,expected:number)=>{
    const ok=await execute([{kind,action:'put',id:record.id,expected,data:record as Record<string,unknown>}]);
    return ok?{...record,version:expected+1}:null;
  };
  const remove=(kind:Operation['kind'],record?:{id:string;version?:number})=>record?execute([{kind,action:'delete',id:record.id,expected:record.version||1}]):Promise.resolve(false);
  const addClient=async(data:Omit<Client,'id'|'createdAt'>)=>{
    const id=crypto.randomUUID?crypto.randomUUID():`c-${Date.now()}`;
    const newClient:Client={...data,id,createdAt:new Date().toISOString()};
    if(!owner){setClients(prev=>[newClient,...prev]);return newClient;}
    const res=await put('clients',{...data,id:await stableUuid(`${owner}:client:${JSON.stringify(data)}`),createdAt:new Date().toISOString()},0);
    return res as Client|null;
  };
  const updateClient=async(id:string,updates:Partial<Client>)=>{
    if(!owner){setClients(prev=>prev.map(c=>c.id===id?{...c,...updates}:c));return true;}
    const c=clients.find(c=>c.id===id);return !!c&&!!await put('clients',{...c,...updates,id},c.version||1);
  };
  const deleteClient=async(id:string)=>{
    if(!owner){setClients(prev=>prev.filter(c=>c.id!==id));return true;}
    return remove('clients',clients.find(c=>c.id===id));
  };
  const addSnapshot=async(data:Omit<MeasurementSnapshot,'id'>)=>{
    const id=crypto.randomUUID?crypto.randomUUID():`ms-${Date.now()}`;
    const snap:MeasurementSnapshot={...data,date:normalizeDate(data.date),measurements:normalizeMeasurementsRecord(data.measurements),id};
    if(!owner){setSnapshots(prev=>[snap,...prev]);return snap;}
    const res=await put('measurement_snapshots',{...snap,id:await stableUuid(`${owner}:snapshot:${JSON.stringify(data)}`)},0);
    return res as MeasurementSnapshot|null;
  };
  const updateSnapshot=async(id:string,updates:Partial<MeasurementSnapshot>)=>{
    if(!owner){setSnapshots(prev=>prev.map(s=>s.id===id?{...s,...updates,date:normalizeDate(updates.date||s.date)}:s));return true;}
    const s=snapshots.find(s=>s.id===id);return !!s&&!!await put('measurement_snapshots',{...s,...updates,id,date:normalizeDate(updates.date||s.date)},s.version||1);
  };
  const deleteSnapshot=async(id:string)=>{
    if(!owner){setSnapshots(prev=>prev.filter(s=>s.id!==id));return true;}
    return remove('measurement_snapshots',snapshots.find(s=>s.id===id));
  };
  const addOrder=async(data:Omit<Order,'id'|'createdAt'>)=>{
    const id=crypto.randomUUID?crypto.randomUUID():`ord-${Date.now()}`;
    const ord:Order={...data,id,createdAt:new Date().toISOString()};
    if(!owner){setOrders(prev=>[ord,...prev]);return ord;}
    const res=await put('orders',{...data,id:await stableUuid(`${owner}:order:${JSON.stringify(data)}`),createdAt:new Date().toISOString()},0);
    return res as Order|null;
  };
  const updateOrder=async(id:string,updates:Partial<Order>)=>{
    if(!owner){setOrders(prev=>prev.map(o=>o.id===id?{...o,...updates}:o));return true;}
    const o=orders.find(o=>o.id===id);return !!o&&!!await put('orders',{...o,...updates,id},o.version||1);
  };
  const updateOrderStatus=(id:string,status:OrderStatus)=>updateOrder(id,{status});
  const deleteOrder=(id:string,expectedVersion?:number)=>{
    if(!owner){setOrders(prev=>prev.filter(o=>o.id!==id));return Promise.resolve(true);}
    const order=orders.find(o=>o.id===id);return remove('orders',order?{...order,version:expectedVersion??order.version}:undefined);
  };
  const updateSettings=async(updates:Partial<AppSettings>)=>!!owner?!!await put('studio_settings',{...settings,...updates,id:owner},settings.version||0):(setSettings(prev=>({...prev,...updates})),true);
  const addCustomField=(field:HotspotDefinition)=>updateSettings({customFields:[...settings.customFields.filter(f=>f.key!==field.key),field]});
  const deleteCustomField=(key:string)=>updateSettings({customFields:settings.customFields.filter(f=>f.key!==key)});
  const addTemplate=(template:GarmentTemplate)=>updateSettings({templates:[...settings.templates.filter(t=>t.id!==template.id),template]});
  const updateTemplate=(id:string,updates:Partial<GarmentTemplate>)=>updateSettings({templates:settings.templates.map(t=>t.id===id?{...t,...updates}:t)});
  const deleteTemplate=(id:string)=>updateSettings({templates:settings.templates.filter(t=>t.id!==id)});
  const resetToDemoData=async()=>{setClients(SAMPLE_CLIENTS);setSnapshots(SAMPLE_SNAPSHOTS);setOrders(SAMPLE_ORDERS);return true;};
  const payload=():BackupPayload=>({version:'3.0',clients,snapshots,orders,settings});
  const exportDataJson=async()=>{if(!account.requireAccount())return false;try{await exportBackup(payload());return true;}catch(e){return fail(e);}};
  const importData=async(data:BackupPayload,replace:boolean)=>{
    if(!account.requireAccount()||!owner)return false;
    try{
      if(replace)await exportBackup(payload(),'tailorfit-before-restore');
      const run=await stableUuid(`${owner}:${replace?'replace':'append'}:${JSON.stringify(data)}`);
      const ops=await importOperations(data,owner,run,replace||!settings.version);
      return await execute(ops,run,replace,true);
    }catch(e){return fail(e);}
  };
  const restoreBackupData=(data:BackupPayload)=>importData(data,true);
  const importBrowserRecords=(data:BackupPayload)=>importData(data,false);
  const clearAllData=async()=>{if(!account.requireAccount()||!window.confirm('Permanently delete all online clients, fittings and orders? A recovery backup will download first.'))return false;return importData({clients:[],snapshots:[],orders:[],settings},true);};
  const saveIntake=async(input:Intake)=>{
    if(!account.requireAccount()||!owner)return null;
    const clientId=input.client.id||await stableUuid(`${input.requestId}:client`);
    const existingClient=clients.find(c=>c.id===clientId);
    const client={phone:'',email:'',notes:'',...existingClient,...input.client,id:clientId};
    const ops:Operation[]=existingClient&&JSON.stringify({...existingClient,...input.client})===JSON.stringify(existingClient)?[]:[{kind:'clients',action:'put',id:clientId,expected:input.client.version??existingClient?.version??0,data:client}];
    let snapshotId=input.order.measurementSnapshotId;
    if(input.snapshot){
      snapshotId=input.snapshot.id||await stableUuid(`${input.requestId}:snapshot`);
      const s=snapshots.find(s=>s.id===snapshotId);
      ops.push({kind:'measurement_snapshots',action:'put',id:snapshotId,expected:input.snapshot.version??s?.version??0,data:{...input.snapshot,id:snapshotId,clientId,date:normalizeDate(input.snapshot.date)}});
    }
    const orderId=input.order.id||await stableUuid(`${input.requestId}:order`);
    const order=orders.find(o=>o.id===orderId);
    ops.push({kind:'orders',action:'put',id:orderId,expected:input.order.version??order?.version??0,data:{...input.order,id:orderId,clientId,measurementSnapshotId:snapshotId}});
    return await execute(ops,input.requestId)?{clientId,snapshotId,orderId}:null;
  };
  // Nav helpers
  const openClientProfile = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveScreen('clients');
  };

  const openNewMeasurementForClient = (clientId?: string) => {
    if (clientId) setSelectedClientId(clientId);
    setSelectedSnapshotId(null);
    setActiveScreen('new-measurement');
  };

  const openNewOrderForClient = (clientId?: string) => {
    if (!account.requireAccount()) return;
    if (clientId) setSelectedClientId(clientId);
    setSelectedOrderId(null);
    setActiveScreen('clients');
  };

  const openEditOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setActiveScreen('orders');
  };

  // Query helpers stabilized with useCallback to prevent infinite effect triggers
  const getClientById = React.useCallback(
    (id: string) => clients.find((c) => c.id === id),
    [clients]
  );

  const getClientOrders = React.useCallback(
    (clientId: string) =>
      orders
        .filter((o) => o.clientId === clientId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const getClientSnapshots = React.useCallback(
    (clientId: string) => snapshots.filter((s) => s.clientId === clientId),
    [snapshots]
  );

  const getSnapshotById = React.useCallback(
    (id: string) => snapshots.find((s) => s.id === id),
    [snapshots]
  );

  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  const getOrdersDueToday = () => {
    const today = getTodayStr();
    return orders.filter((o) => {
      if (o.status === 'Picked Up') return false;
      const pickupDate = o.pickupDateTime ? o.pickupDateTime.slice(0, 10) : '';
      return pickupDate === today;
    });
  };

  const getOrdersOverdue = () => {
    const today = getTodayStr();
    return orders.filter((o) => {
      if (o.status === 'Picked Up') return false;
      const pickupDate = o.pickupDateTime ? o.pickupDateTime.slice(0, 10) : '';
      return pickupDate && pickupDate < today;
    });
  };

  const getOrdersDueThisWeek = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    return orders.filter((o) => {
      if (o.status === 'Picked Up') return false;
      if (!o.pickupDateTime) return false;
      const p = new Date(o.pickupDateTime);
      return p >= startOfWeek && p <= endOfWeek;
    });
  };

  const getOrdersReady = () => {
    return orders.filter((o) => o.status === 'Ready');
  };

  return (
    <StoreContext.Provider
      value={{
        isHydrated, saveStatus, error, refresh, importBrowserRecords, saveIntake,
        clients,
        snapshots,
        orders,
        settings,
        allHotspots,
        activeScreen,
        setActiveScreen,
        selectedClientId,
        setSelectedClientId,
        selectedOrderId,
        setSelectedOrderId,
        selectedSnapshotId,
        setSelectedSnapshotId,

        addClient,
        updateClient,
        deleteClient,

        addSnapshot,
        updateSnapshot,
        deleteSnapshot,

        addOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,

        updateSettings,
        addCustomField,
        deleteCustomField,
        addTemplate,
        updateTemplate,
        deleteTemplate,

        resetToDemoData,
        clearAllData,
        exportDataJson,
        restoreBackupData,

        openClientProfile,
        openNewMeasurementForClient,
        openNewOrderForClient,
        openEditOrder,

        getClientById,
        getClientOrders,
        getClientSnapshots,
        getSnapshotById,
        getOrdersDueToday,
        getOrdersOverdue,
        getOrdersDueThisWeek,
        getOrdersReady,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
