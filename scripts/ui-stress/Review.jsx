import React,{useMemo,useState} from 'react';
import {FixtureProvider,fixture,modes} from './fixtures';
import {OverviewScreen} from '../../components/screens/OverviewScreen';
import {OrdersScreen} from '../../components/screens/OrdersScreen';
import {ClientsScreen} from '../../components/screens/ClientsScreen';
import {OrderWorkspace} from '../../components/orders/OrderWorkspace';
import {ClientDetailsDialog} from '../../components/clients/ClientDetailsDialog';

export const screens=['Overview','Clients','Orders','New Order','Order details','Client dialog'];
export function Surface({mode,screen,go=()=>{}}) {
  const data=useMemo(()=>fixture(mode),[mode]);
  const [selected,setSelected]=useState(null),[query,setQuery]=useState(''),[filter,setFilter]=useState('all'),[dialog,setDialog]=useState(false);
  const [order,setOrder]=useState(data.orders[0]?.id);
  const [orders,setOrders]=useState(data.orders);
  const store={...data,orders,selectedClientId:selected,setSelectedClientId:setSelected,
    saveIntake:async({order,client})=>{
      if(!orders.some(saved=>saved.id===order.id)) return null;
      setOrders(prev=>prev.map(saved=>saved.id===order.id?{...saved,...order}:saved));
      return {orderId:order.id,clientId:client.id};
    },
    updateOrderStatus:async(id,status)=>{
      setOrders(prev=>prev.map(o=>o.id===id?{...o,status}:o));
      return true;
    }};
  const client=data.clients[0];
  const fitting=data.snapshots[0];
  const record=id=>{setOrder(id);go('Order details',id);};
  return <FixtureProvider value={store}>
    {screen==='Overview'&&<OverviewScreen onOpenOrder={record} onAddClient={()=>go('Client dialog')} onNewOrder={()=>go('New Order')} onOpenOrders={()=>go('Orders')} onOpenClients={()=>go('Clients')}/>}
    {screen==='Clients'&&<ClientsScreen onEditOrder={record} onNewOrder={()=>go('New Order')}/>}
    {screen==='Orders'&&<OrdersScreen {...{filter,query}} onQuery={setQuery} onFilter={setFilter} onEditOrder={record} onBack={()=>go('Overview')} onNewOrder={()=>go('New Order')}/>}
    {screen==='New Order'&&<OrderWorkspace clientId={client?.id} reuseSnapshotId={fitting?.id} onBack={()=>go('Orders')}/>}
    {screen==='Order details'&&(order ? <OrderWorkspace orderId={typeof location==='undefined'?order:new URLSearchParams(location.search).get('id')||order} onBack={()=>go('Orders')}/> : <p>No fixture order to open.</p>)}
    {screen==='Client dialog'&&<><button onClick={()=>setDialog(true)}>{client?'Edit client':'Add client'}</button>{dialog&&<ClientDetailsDialog target={client?{kind:'edit',client}:{kind:'create'}} onClose={()=>setDialog(false)} onSaved={()=>setDialog(false)} onCreate={async()=>null} onUpdate={async()=>false}/>}</>}
  </FixtureProvider>;
}

export function Review() {
  const params=new URLSearchParams(location.search);
  const [mode,setMode]=useState(Object.hasOwn(modes,params.get('data'))?params.get('data'):'worst');
  const [screen,setScreen]=useState(screens.includes(params.get('screen'))?params.get('screen'):'New Order');
  function change(nextMode,nextScreen,id) {
    const url=new URL(location.href);
    url.searchParams.set('data',nextMode);url.searchParams.set('screen',nextScreen);
    if(id)url.searchParams.set('id',id);else url.searchParams.delete('id');
    history.replaceState({},'',url);
    setMode(nextMode);setScreen(nextScreen);
  }
  return <><main style={{paddingBottom:'9rem'}}><Surface key={mode+screen} {...{mode,screen}} go={(s,id)=>change(mode,s,id)}/></main>
    <nav aria-label="Stress test controls" className="stress-controls"><select aria-label="Screen" value={screen} onChange={e=>change(mode,e.target.value)}>{screens.map(s=><option key={s}>{s}</option>)}</select>
    {Object.entries(modes).map(([key,label])=><button key={key} aria-pressed={mode===key} onClick={()=>change(key,screen)}>{label}</button>)}</nav></>;
}
