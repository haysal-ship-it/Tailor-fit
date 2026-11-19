import type {Order} from '@/types';
export type OrderFilter='all'|'active'|'outstanding';
export const orderFilters:OrderFilter[]=['all','active','outstanding'];
export const isActiveOrder=(o:Order)=>!['Completed','Picked Up'].includes(o.status);
export const knownBalance=(o:Order)=>typeof o.paidAmount==='number'&&Number.isFinite(o.paidAmount)&&Number.isFinite(o.price)?Math.max(0,o.price-o.paidAmount):null;
export const matchesOrderFilter=(o:Order,f:OrderFilter)=>f==='active'?isActiveOrder(o):f==='outstanding'?(knownBalance(o)??0)>0:f==='all';
export function outstandingBalances(orders:Order[]){
 const totals=new Map<string,number>();let unknown=0;
 for(const o of orders){const balance=knownBalance(o);if(balance===null||!o.currency?.trim()){unknown++;continue;}const key=({'₦':'NGN','$':'USD','£':'GBP','€':'EUR'} as Record<string,string>)[o.currency]||o.currency;totals.set(key,(totals.get(key)||0)+balance);}
 return {totals:Array.from(totals,([currency,amount])=>({currency,amount})),unknown};
}
export function orderTrend(orders:Order[],days:number,now=new Date()){
 const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());start.setDate(start.getDate()-days+1);
 const previousStart=new Date(start);previousStart.setDate(previousStart.getDate()-days);
 const current=Array<number>(days).fill(0),previous=Array<number>(days).fill(0);
 const index=(date:Date,base:Date)=>Math.round((Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())-Date.UTC(base.getFullYear(),base.getMonth(),base.getDate()))/86400000);
 for(const o of orders){const date=new Date(o.createdAt);if(!Number.isFinite(date.getTime()))continue;const i=index(date,start),p=index(date,previousStart);if(i>=0&&i<days)current[i]++;else if(p>=0&&p<days)previous[p]++;}
 return {current,previous,start,currentTotal:current.reduce((a,b)=>a+b,0),previousTotal:previous.reduce((a,b)=>a+b,0)};
}
export function moneyLabel(amount:number,currency:string){try{return new Intl.NumberFormat('en-NG',{style:'currency',currency,maximumFractionDigits:0}).format(amount);}catch{return currency+' '+amount.toLocaleString();}}
