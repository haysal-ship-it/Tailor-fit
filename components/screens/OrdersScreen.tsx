'use client';
import {EmptyState} from '@/components/empty-states/EmptyState';
import {useMemo} from 'react';
import {Pagination,usePagination} from '@/components/ui/Pagination';
import {workspaceLayout} from '@/components/workspace/layout';
import {BackButton} from '@/components/ui/BackButton';
import {ChoiceMenu} from '@/components/ui/ChoiceMenu';
import {useStore} from '@/lib/store';
import {matchesOrderFilter,type OrderFilter} from '@/lib/workspace-analytics';
import {getOrderStatusPresentation,formatDate} from '@/lib/status';
export function OrdersScreen({filter,query,onQuery,onFilter,onEditOrder,onBack,onNewOrder}:{filter:OrderFilter;query:string;onQuery:(q:string)=>void;onFilter:(f:OrderFilter)=>void;onEditOrder:(id:string)=>void;onBack:()=>void;onNewOrder:()=>void}){
 const {orders,clients}=useStore();
 const names=useMemo(()=>new Map(clients.map(c=>[c.id,c.name])),[clients]);
 const visible=useMemo(()=>orders.filter(o=>matchesOrderFilter(o,filter)&&[names.get(o.clientId),o.garmentType,o.id].join(' ').toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[orders,names,filter,query]);
 const results=usePagination(visible,JSON.stringify([filter,query]));
 return <section className={workspaceLayout.shell}><div data-menu-boundary className="rounded-lg bg-white p-4 sm:px-6"><BackButton onClick={onBack} className="mb-4" aria-label="Back to Overview"/><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><h1 className="text-lg font-semibold">All orders</h1><button onClick={onNewOrder} className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm text-white">New order</button></div><div className="my-5 flex flex-col gap-3 sm:flex-row"><label className="flex-1"><span className="sr-only">Search orders</span><input value={query} onChange={e=>onQuery(e.target.value)} placeholder="Search clients or garments" className="min-h-11 w-full rounded-full bg-[var(--card)] px-4 text-sm"/></label><ChoiceMenu className="w-full sm:w-[220px]" placeholder="Order filter" value={filter} onChoose={value=>onFilter(value as OrderFilter)} options={[{value:'all',label:'All orders'},{value:'active',label:'Active orders'},{value:'outstanding',label:'Outstanding payments'}]}/></div>{filter==='outstanding'&&<p className="mb-4 text-xs text-[var(--text-2)]">Only orders with recorded payments and a positive remaining balance appear here. Orders without payment records are excluded.</p>}<div className="space-y-[2px] rounded-lg bg-[var(--card)] p-1">{results.items.map(o=>{const status=getOrderStatusPresentation(o.status,o.pickupDateTime);return <button key={o.id} onClick={()=>onEditOrder(o.id)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-md bg-white p-4 text-left hover:bg-[var(--chip)]"><div className="min-w-0"><strong className="block break-words text-sm font-medium">{names.get(o.clientId)||'Client unavailable'}</strong><span className="mt-1 block text-xs text-[var(--text-2)]">{o.garmentType}</span></div><div className="text-xs"><span className="block">{status.badgeLabel} →</span><span className="mt-1 block text-[var(--text-2)]">{o.pickupDateTime?'Due '+formatDate(o.pickupDateTime):'No due date'}</span></div></button>})}{!visible.length&&<EmptyState
 kind={orders.length===0?'orders':query.trim()?'search':'filter'}
 title={orders.length===0?'Ready for your first order?':query.trim()?'No matching orders':filter==='outstanding'?'No outstanding balances recorded':'No orders in this view'}
 description={orders.length===0?'Track the garment, price and pickup date in one place.':query.trim()?'Try another name or garment.':'Change the filter to see your other orders.'}
 actionLabel={orders.length===0?'New order':query.trim()?'Clear search':'Show all orders'}
 onAction={orders.length===0?onNewOrder:query.trim()?()=>onQuery(''):()=>onFilter('all')}/>}</div><Pagination {...results}/></div></section>;
}
