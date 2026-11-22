import React, {createContext, useContext} from 'react';
import {DEFAULT_SETTINGS, DEFAULT_HOTSPOTS} from '../../lib/initial-data';

const context = createContext(null);
export const FixtureProvider = context.Provider;
export const useStore = () => useContext(context);
export const useAccount = () => ({user: {id: 'fixture', email: 'studio@example.test', user_metadata: {display_name: 'Ada'}}, requireAccount: () => true});
export const useTour = () => ({contextualTipsEnabled: false, acknowledgedTipIds: []});
export const useDraft = () => ({loaded: true, getId: () => 'fixture', flush: async () => {}, discard: async () => {}});
export const listDrafts = async () => [];
export const readDraft = async () => null;
export const deleteDraft = async () => {};
export const sendInvoice = async () => ({ok: false, error: 'Email is disabled in this preview.'});

export const modes = {'demo':'Demo data','worst':'Worst case','empty':'Empty','one':'One','large':'1,284 rows'};
const names = ['Aleksandra Wiśniewska-Kowalczyk','👩🏽‍🔧 Priya','J','Đặng Thị Ngọc Hân','李小明','علي عبد الرحمن','Jo','Jo'];
const statuses = ['Ready','Picked Up','In Progress','Pending','Paused','Completed'];
const id = (group,i) => '00000000-0000-4000-8000-'+String(group * 100000 + i).padStart(12,'0');

export function fixture(mode) {
  const count = {demo:3, worst:8, empty:0, one:1, large:1284}[mode];
  const stress = mode === 'worst' || mode === 'large';
  const now = new Date().toISOString();
  const clients = Array.from({length:count}, (_,i) => ({
    id:id(1,i), name:stress ? names[i%names.length] : ['Ada Okafor','Tunde Bello','Jo'][i],
    email:stress && i===0 ? 'bartholomew.fitzgerald@northwind-industries-holdings.example.com' : i%2 ? '' : 'ada@example.test',
    phone:i%2 ? '' : '+234 800 000 0000', notes:stress ? 'Hand finish the neckline.\nConfirm sleeve allowance at the final fitting.' : '', createdAt:now
  }));
  const orders = clients.map((c,i) => ({
    id:id(2,i),clientId:c.id,measurementSnapshotId:id(3,i),garmentType:stress && i%2===0 ? 'CeremonialAgbadaWithDetachableEmbroideredOverlay' : 'Aso oke & silk',
    price:stress ? 12345678.9 : 50000,...(i%2 ? {paidAmount:0} : {}),currency:stress && i%3===2 ? 'USD' : 'NGN',
    referenceImages:stress && i===0 ? [{id:'missing',url:'/assets/stress-reference-missing.jpg',title:'Bodice fitting — final alteration.jpg'}] : [],
    status:statuses[i%statuses.length],pickupDateTime:i%3===1 ? '' : '2026-12-31T23:30:00-08:00',notes:c.notes,createdAt:now
  }));
  const snapshots=orders.map((o,i)=>({id:id(3,i),clientId:o.clientId,date:now.slice(0,10),unit:'cm',garmentType:o.garmentType,measurements:{shoulder_width:42.5},mannequinGender:'female'}));
  const byId=new Map(clients.map(c=>[c.id,c]));
  return {clients,orders,snapshots,settings:{...DEFAULT_SETTINGS,currency:'NGN'},allHotspots:DEFAULT_HOTSPOTS,isHydrated:true,
    getClientById:key=>byId.get(key),getClientSnapshots:key=>snapshots.filter(s=>s.clientId===key),getClientOrders:key=>orders.filter(o=>o.clientId===key),
    saveIntake:async()=>null,updateOrderStatus:async()=>false,deleteOrder:async()=>false,deleteClient:async()=>false,addClient:async()=>null,updateClient:async()=>false};
}
