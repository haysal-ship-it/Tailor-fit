import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight,ArrowUpRight,Check,ChevronDown,ChevronRight,House,Plus,Ruler,Settings2,UsersRound,Wallet,X} from 'lucide-react';
import {BackButton} from '@/components/ui/BackButton';
import {ChoiceMenu} from '@/components/ui/ChoiceMenu';
import {ModalDialog} from '@/components/ui/ModalDialog';
import {Input} from '@/components/ui/Input';
import {Textarea} from '@/components/ui/Textarea';
import {WorkspaceActions,workspacePrimaryAction,workspaceSecondaryAction} from '@/components/workspace/WorkspaceActions';
import {PickupsAndRecent} from '@/components/dashboard/PickupsAndRecent';
import {RotatableMannequin} from '@/components/mannequin/RotatableMannequin';
import {TourOverlay} from '@/components/onboarding/TourOverlay';
import {TOUR_STEPS} from '@/lib/onboarding/steps';
import {isActiveOrder,moneyLabel,orderTrend} from '@/lib/workspace-analytics';
import type {Client,Order} from '@/types';
import {freshState,PREVIEW_STORAGE_KEY,readPreview,scenarioState,setupProgress,type PreviewPage,type PreviewState} from './model';
import {PreviewStoreContext} from './PreviewStore';
import {MannequinDemo} from './MannequinDemo';
import './review.css';

function Brand(){return <span className="ob-brand"><img src="/assets/auth/logo-icon.png" width={41} height={29} alt=""/><strong>TailorFit</strong></span>}
export function Review(){
  const [state,setState]=useState<PreviewState>(()=>{try{return readPreview(localStorage.getItem(PREVIEW_STORAGE_KEY))}catch{return freshState()}});
  const [error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [failSave,setFailSave]=useState(false),[checklistOpen,setChecklistOpen]=useState(()=>!setupProgress(state).every(Boolean)),[clientDialog,setClientDialog]=useState(false);
  const [tour,setTour]=useState<number|null>(null),[selectedOrder,setSelectedOrder]=useState('');
  const [period,setPeriod]=useState('30');
  const pending=useRef(false),saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const nameInput=useRef<HTMLInputElement>(null),heading=useRef<HTMLHeadingElement>(null),firstPage=useRef(true);
  function patch(update:Partial<PreviewState>){setState(s=>({...s,...update}));}
  function go(page:PreviewPage){setError('');setNotice('');patch({page});window.scrollTo({top:0,behavior:'instant'});}
  useEffect(()=>{try{localStorage.setItem(PREVIEW_STORAGE_KEY,JSON.stringify(state));}catch{/* The review still works in memory. */}},[state]);
  useEffect(()=>{if(firstPage.current){firstPage.current=false;return;}heading.current?.focus({preventScroll:true});},[state.page]);
  useEffect(()=>()=>{if(saveTimer.current)clearTimeout(saveTimer.current)},[]);
  useEffect(()=>{const key=()=>{document.documentElement.dataset.input='keyboard';};const pointer=()=>{document.documentElement.dataset.input='pointer';};window.addEventListener('keydown',key);window.addEventListener('pointerdown',pointer);return()=>{window.removeEventListener('keydown',key);window.removeEventListener('pointerdown',pointer);};},[]);
  useEffect(()=>{
    const change=(event:MessageEvent)=>{
      if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=='tailorfit:onboarding-review')return;
      if(saveTimer.current)clearTimeout(saveTimer.current);pending.current=false;setBusy(false);
      setState(scenarioState(event.data.scenario));setFailSave(event.data.scenario==='failure');setError('');setNotice('');setTour(null);setClientDialog(false);setChecklistOpen(event.data.scenario!=='completed');setSelectedOrder('');
      window.scrollTo({top:0,behavior:'instant'});
    };
    window.addEventListener('message',change);window.parent.postMessage({type:'tailorfit:preview-ready'},location.origin);return()=>window.removeEventListener('message',change);
  },[]);
  function skip(){if(busy)return;patch({status:'deferred',page:'overview'});setError('');setNotice('You can finish setting up your studio whenever you’re ready.');}
  function resume(){go(state.name.trim()?'defaults':'welcome');}
  function saveDefaults(e:React.FormEvent){
    e.preventDefault();if(pending.current)return;pending.current=true;setBusy(true);setError('');
    saveTimer.current=setTimeout(()=>{
      pending.current=false;setBusy(false);
      if(failSave){setFailSave(false);setError('Your name was saved, but your studio defaults weren’t. Your choices are still here. Please try again.');return;}
      patch({status:'completed',page:'overview'});setNotice('Your studio is ready. Let’s make it yours.');
    },600);
  }
  const progress=setupProgress(state),completed=progress.filter(Boolean).length;
  const firstName=state.name.trim().split(' ')[0];
  function startTour(){setTour(0);setNotice('');}
  function openOrder(id:string){setSelectedOrder(id);go('detail');}
  function createClient(input:{name:string;phone:string;email:string}){
    const client:Client={...input,id:crypto.randomUUID(),notes:'',createdAt:new Date().toISOString()};
    setState(s=>({...s,clients:[...s.clients,client]}));setClientDialog(false);setNotice(`${client.name} was added. You can create an order whenever you’re ready.`);
  }
  function createOrder(input:{name:string;garment:string;price:number;due:string;notes:string}){
    const timestamp=new Date().toISOString();
    const client:Client={id:crypto.randomUUID(),name:input.name,phone:'',email:'',notes:'',createdAt:timestamp};
    const order:Order={id:crypto.randomUUID(),clientId:client.id,garmentType:input.garment,referenceImages:[],price:input.price,currency:state.currency,notes:input.notes,status:'In Progress',pickupDateTime:input.due?input.due+'T12:00:00Z':'',createdAt:timestamp};
    setState(s=>({...s,page:'overview',clients:[...s.clients,client],orders:[...s.orders,order]}));setNotice('Order saved. Its client details are connected.');if(state.status==='completed')setChecklistOpen(false);
  }
  const trend=orderTrend(state.orders,Number(period)),max=Math.max(1,...trend.current,...trend.previous);
  const line=(values:number[])=>values.map((v,i)=>`${28+i*608/(values.length-1)},${160-v/max*125}`).join(' ');
  const order=state.orders.find(o=>o.id===selectedOrder),orderClient=state.clients.find(c=>c.id===order?.clientId);
  const isSetup=state.page==='welcome'||state.page==='defaults';
  return <PreviewStoreContext.Provider value={state}><div className="onboarding-preview">
    {isSetup?<>
      <header className="ob-setup-nav"><Brand/><span className="ob-nav-note">Your studio, brought together.</span><button className="ob-text-button" onClick={skip} disabled={busy}>Skip setup<ArrowRight size={14}/></button></header>
      <main className="ob-setup-main">
        <div className="ob-setup-frame">
          <section className="ob-setup-form" key={state.page}>
            <div className="ob-step-meta"><span>Set up your studio</span><span>Step {state.page==='welcome'?1:2} of 2</span></div>
            <div className="ob-step-track" aria-hidden="true"><span className="active"/><span className={state.page==='defaults'?'active':''}/></div>
            {state.page==='welcome'?<form onSubmit={e=>{e.preventDefault();if(!state.name.trim()){setError('Please enter the name you’d like us to use.');nameInput.current?.focus();return;}setError('');patch({page:'defaults',status:'in_progress'});}} noValidate>
              <div className="ob-intro"><h1 ref={heading} tabIndex={-1}>Make Tailorfit yours.</h1><p>A few details to make this feel like your studio.</p></div>
              <div className="ob-fields"><Input ref={nameInput} label="Your name" placeholder="What should we call you?" autoComplete="given-name" maxLength={100} value={state.name} onChange={e=>patch({name:e.target.value})} error={error||undefined} helperText="This is how we’ll greet you in your workspace."/><Input label="Studio name (optional)" placeholder="e.g. Ade Atelier" autoComplete="organization" maxLength={200} value={state.studio} onChange={e=>patch({studio:e.target.value})} helperText="Working on your own? You can leave this blank."/></div>
              <button type="submit" className={workspacePrimaryAction+' ob-continue'}>Continue<ArrowRight size={16}/></button>
              <p className="ob-settings-note">You can update these details in Settings.</p>
            </form>:<form onSubmit={saveDefaults}>
              <div className="ob-intro"><h1 ref={heading} tabIndex={-1}>How does your<br className="ob-desktop-break"/> studio work?</h1><p>A couple of defaults for new orders and measurements.</p></div>
              <fieldset disabled={busy} className="ob-fields">
                <div className="ob-choice-label"><Ruler size={17}/><div><h2>Measurement unit</h2><p>Use the unit you’re comfortable working in.</p></div></div>
                <ChoiceMenu placeholder="Measurement unit" value={state.unit} onChoose={value=>patch({unit:value as 'cm'|'in'})} options={[{value:'cm',label:'Centimetres (cm)'},{value:'in',label:'Inches (in)'}]}/>
                <div className="ob-choice-label ob-choice-second"><Wallet size={17}/><div><h2>Currency</h2><p>Used for prices on new orders.</p></div></div>
                <ChoiceMenu placeholder="Currency" value={state.currency} onChoose={currency=>patch({currency})} options={[{value:'NGN',label:'Nigerian naira (NGN)'},{value:'USD',label:'US dollar (USD)'},{value:'GBP',label:'Pound sterling (GBP)'},{value:'EUR',label:'Euro (EUR)'}]}/>
              </fieldset>
              <div className="ob-studio-summary"><span className="ob-avatar">{(state.studio||state.name||'T').slice(0,1).toUpperCase()}</span><div><strong>{state.studio||'Your studio'}</strong><span>{state.name||'Your workspace'} · {state.unit==='cm'?'Centimetres':'Inches'} · {state.currency}</span></div><span className="ob-edit-label">Your defaults</span></div>
              {error&&<p className="ob-error" role="alert">{error}</p>}
              <div className="ob-step-actions"><BackButton disabled={busy} onClick={()=>go('welcome')}/><button disabled={busy} type="submit" className={workspacePrimaryAction}>{busy?'Saving your defaults…':error?'Try again':'Open my workspace'}{!busy&&<ArrowRight size={16}/>}</button></div>
              <p className="ob-settings-note">New work uses these defaults. You can change them in Settings.</p>
            </form>}
          </section>
          <aside className="ob-companion"><div className="ob-companion-header"><span className="ob-product-label"><span/>A little more room for your craft.</span><p>Every client. Every measurement.<br/>All in one place.</p></div><div className="ob-mannequin"><MannequinDemo unit={state.unit}/></div><div className="ob-companion-footer"><Ruler size={17}/><p>Built around the details<br/><strong>that make your work yours.</strong></p></div></aside>
        </div>
        <p className="ob-setup-footnote">Made for independent tailors and growing studios.</p>
      </main>
    </>:<>
      <header className="ob-app-nav"><Brand/><nav aria-label="Main navigation">{[{page:'overview' as const,label:'Overview',icon:House},{page:'clients' as const,label:'Clients',icon:UsersRound},{page:'defaults' as const,label:'Settings',icon:Settings2}].map(item=><button key={item.page} className={state.page===item.page?'selected':''} onClick={()=>go(item.page)}><item.icon size={17}/><span>{item.label}</span></button>)}</nav><span className="ob-profile" title={state.name||'Your account'}>{(state.name||'T').slice(0,1).toUpperCase()}</span></header>
      <main className="ob-workspace">
      {notice&&<div className="ob-notice" role="status"><Check size={16}/><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={15}/></button></div>}
      {state.page==='overview'&&<section className="ob-overview-frame"><header className="ob-page-header"><div><h1 ref={heading} tabIndex={-1}>Hello{firstName?', '+firstName:''} <span aria-hidden="true">👋</span></h1><p>A clear view of your studio’s performance.</p></div><WorkspaceActions tourTargets onAddClient={()=>setClientDialog(true)} onNewOrder={()=>go('order')}/></header>
        <div className="ob-dashboard-body">
          {!state.checklistHidden&&<section className={'ob-checklist '+(completed===3?'finished':'')} aria-labelledby="checklist-title">
            <div className="ob-checklist-heading"><button className="ob-checklist-toggle" onClick={()=>setChecklistOpen(!checklistOpen)} aria-expanded={checklistOpen}><span className="ob-progress-ring" style={{'--progress':`${completed/3*100}%`} as React.CSSProperties}><span>{completed===3?<Check size={17}/>:completed}</span></span><span><strong id="checklist-title">{completed===3?'You’re ready for what’s next.':'Get your studio ready'}</strong><small>{completed===3?'Your first client and order are in place.':`${completed} of 3 complete · A few small steps to get going`}</small></span><ChevronDown size={16} className={checklistOpen?'ob-chevron-open':''}/></button><button className="ob-dismiss" onClick={()=>patch({checklistHidden:true})} aria-label="Dismiss getting started checklist"><X size={16}/></button></div>
            {checklistOpen&&<div className="ob-checklist-content"><div className="ob-task-list">{[{title:'Set your studio defaults',text:'Choose how you measure and price your work.',action:resume},{title:'Add your first client',text:'A name is all you need to start.',action:()=>setClientDialog(true)},{title:'Save your first order',text:'Bring a client, garment and due date together.',action:()=>go('order')}].map((task,i)=><div key={task.title} className={'ob-task '+(progress[i]?'done':'')}><span className="ob-task-check">{progress[i]?<Check size={13}/>:i+1}</span><div><strong>{task.title}</strong><p>{task.text}</p></div><button onClick={progress[i]?()=>i===0?resume():go(i===1?'clients':'orders'):task.action} className="ob-task-action">{progress[i]?'View':i===0&&state.status==='deferred'?'Resume':'Start'}<ChevronRight size={14}/></button></div>)}</div><div className="ob-tour-prompt"><span>Prefer a quick look around?</span><button onClick={startTour}>Show me around<ArrowRight size={14}/></button></div></div>}
          </section>}
          {state.checklistHidden&&<div className="ob-guide-shortcut"><button onClick={()=>patch({checklistHidden:false})}>Getting started</button><button onClick={startTour}>Show me around<ArrowRight size={13}/></button></div>}
          <div className="ob-dashboard-grid"><div className="ob-analytics-column"><div data-tour="overview-analytics" className="ob-metrics">{[{label:'Total orders',value:String(state.orders.length),hint:'All orders in your studio'},{label:'Active orders',value:String(state.orders.filter(isActiveOrder).length),hint:'Work currently in progress'},{label:'Outstanding balance',value:state.orders.length?'Not recorded':moneyLabel(0,state.currency),hint:state.orders.length?'Payment details haven’t been recorded':'Based on recorded payments'}].map(metric=><button key={metric.label} className="ob-metric" onClick={()=>go('orders')}><span>{metric.label}<ArrowUpRight size={15}/></span><strong>{metric.value}</strong><small>{metric.hint}</small></button>)}</div>
          <section className="ob-chart" data-tour="overview-chart"><div className="ob-chart-heading"><div><h2>Studio performance</h2><p>Orders created over time</p></div><ChoiceMenu className="ob-period-menu" placeholder="Chart period" value={period} onChoose={setPeriod} options={[{value:'7',label:'Last 7 days'},{value:'30',label:'Last 30 days'},{value:'90',label:'Last 90 days'}]}/></div><div className="ob-chart-total"><strong>{trend.currentTotal}</strong><span>orders · {trend.previousTotal} in the previous {period} days</span></div><svg viewBox="0 0 660 205" role="img" aria-label={`${trend.currentTotal} orders created during the selected period`}>{[0,1,2,3].map(i=><g key={i}><line x1="28" x2="636" y1={160-i*125/3} y2={160-i*125/3} stroke="#eee"/><text x="18" y={164-i*125/3} textAnchor="end" fill="#777" fontSize="10">{Math.ceil(max*i/3)}</text></g>)}<polyline points={line(trend.previous)} fill="none" stroke="#B8BDC9" strokeWidth="2" strokeDasharray="4 4"/><polyline points={line(trend.current)} fill="none" stroke="#1D49E8" strokeWidth="2.5"/>{[0,Number(period)-1].map(i=><text key={i} x={i?636:28} y="190" fill="#777" fontSize="10" textAnchor={i?'end':'start'}>{new Date(trend.start.getTime()+i*86400000).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</text>)}</svg><div className="ob-chart-legend"><span><i/>Current period</span><span><i/>Previous period</span></div>{!state.orders.length&&<p className="ob-empty-chart">Your studio’s story starts with its first order.</p>}</section></div><PickupsAndRecent onOpenOrder={openOrder}/></div>
        </div></section>}
      {state.page==='clients'&&<section className="ob-overview-frame"><header className="ob-page-header"><div><h1 ref={heading} tabIndex={-1}>Client Directory</h1><p>Keep your clients, measurements and orders together.</p></div><WorkspaceActions onAddClient={()=>setClientDialog(true)} onNewOrder={()=>go('order')}/></header><div className="ob-directory">{state.clients.length?state.clients.map(client=><article className="ob-client-card" key={client.id}><span className="ob-avatar">{client.name.slice(0,1)}</span><strong>{client.name}</strong><p>{client.phone||'No phone number added'}</p><span>{state.orders.filter(o=>o.clientId===client.id).length} orders</span></article>):<div className="ob-empty"><UsersRound size={28}/><h2>No clients yet</h2><p>Add their name now. Their measurements and orders can follow.</p><button onClick={()=>setClientDialog(true)} className={workspacePrimaryAction}><Plus size={16}/>Add first client</button></div>}</div></section>}
      {state.page==='order'&&<NewOrder onSave={createOrder} onBack={()=>go('overview')} unit={state.unit} currency={state.currency}/>}
      {state.page==='orders'&&<section className="ob-order-detail"><BackButton onClick={()=>go('overview')}/><div className="ob-page-header"><h1 ref={heading} tabIndex={-1}>All orders</h1><button className={workspaceSecondaryAction} onClick={()=>go('order')}><Plus size={16}/>New order</button></div>{state.orders.map(o=><button className="ob-order-row" key={o.id} onClick={()=>openOrder(o.id)}><span><strong>{state.clients.find(c=>c.id===o.clientId)?.name}</strong><small>{o.garmentType}</small></span><span>{moneyLabel(o.price,o.currency||state.currency)}<ChevronRight size={16}/></span></button>)}{!state.orders.length&&<p className="ob-empty">Your orders will appear here once you save your first one.</p>}</section>}
      {state.page==='detail'&&<section className="ob-order-detail"><BackButton onClick={()=>go('overview')}/><h1 ref={heading} tabIndex={-1}>Order details</h1>{order?<><p className="ob-detail-status">{order.status}</p><div className="ob-detail-grid"><div><h2>{order.garmentType}</h2><p>{orderClient?.name}</p><dl><dt>Price</dt><dd>{moneyLabel(order.price,order.currency||state.currency)}</dd><dt>Due date</dt><dd>{order.pickupDateTime?new Date(order.pickupDateTime).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}):'Not set'}</dd></dl>{order.notes&&<p>{order.notes}</p>}</div><div className="ob-detail-mannequin"><RotatableMannequin gender="female" showControls={false} activePointKeys={[]} measurements={{}} readOnly/></div></div></>:<p>Choose an order from Overview or All orders.</p>}</section>}
      </main>
    </>}
    {clientDialog&&<ClientDialog onClose={()=>setClientDialog(false)} onSave={createClient}/>}
    <TourOverlay step={tour===null?null:TOUR_STEPS[tour]} isOpen={tour!==null} onNext={()=>setTour(i=>i===null||i===4?null:i+1)} onPrev={()=>setTour(i=>i===null?null:Math.max(0,i-1))} onSkip={()=>setTour(null)} onClose={()=>setTour(null)} onFinish={()=>{setTour(null);setNotice('You’re all set. Start with a client or an order whenever you’re ready.')}}/>
  </div></PreviewStoreContext.Provider>;
}
function ClientDialog({onClose,onSave}:{onClose:()=>void;onSave:(input:{name:string;phone:string;email:string})=>void}){
  const [name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState(''),[error,setError]=useState('');
  return <ModalDialog title="Add a client" description="Start with their name. You can add more details later." onRequestClose={onClose}><form className="ob-dialog-form" noValidate onSubmit={e=>{e.preventDefault();if(!name.trim()){setError('Please enter your client’s name.');return;}if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setError('Please enter a valid email address.');return;}onSave({name:name.trim(),phone:phone.trim(),email:email.trim()});}}><Input data-autofocus label="Client name" value={name} onChange={e=>setName(e.target.value)} required/><Input label="Phone number (optional)" type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/><Input label="Email address (optional)" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>{error&&<p role="alert" className="ob-error">{error}</p>}<div className="ob-dialog-actions"><button type="button" onClick={onClose} className={workspaceSecondaryAction}>Cancel</button><button type="submit" className={workspacePrimaryAction}>Add client</button></div></form></ModalDialog>;
}
function NewOrder({onBack,onSave,unit,currency}:{onBack:()=>void;unit:string;currency:string;onSave:(input:{name:string;garment:string;price:number;due:string;notes:string})=>void}){
  const [name,setName]=useState(''),[garment,setGarment]=useState(''),[price,setPrice]=useState(''),[due,setDue]=useState(''),[notes,setNotes]=useState(''),[error,setError]=useState('');
  return <form className="ob-overview-frame" noValidate onSubmit={e=>{e.preventDefault();if(!name.trim()||!garment.trim()||price.trim()===''||!Number.isFinite(Number(price))||Number(price)<0){setError('Enter a client name, garment and a price of zero or more.');return;}onSave({name:name.trim(),garment:garment.trim(),price:Number(price),due,notes});}}><header className="ob-order-header"><BackButton onClick={onBack}/><h1>New Order</h1><p>Client details, garment and measurements. One connected workspace.</p></header><div className="ob-order-grid"><div className="ob-order-form"><h2>Client Order and Details</h2><Input label="Client name" value={name} onChange={e=>setName(e.target.value)} required/><Input label="Garment Type" placeholder="e.g. Aso-oke two-piece" value={garment} onChange={e=>setGarment(e.target.value)} required/><div className="ob-fields-pair"><Input label={`Price (${currency})`} inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} required/><Input label="Due date" type="date" value={due} onChange={e=>setDue(e.target.value)}/></div><Textarea label="Workroom notes" rows={3} value={notes} onChange={e=>setNotes(e.target.value)}/>{error&&<p role="alert" className="ob-error">{error}</p>}</div><div className="ob-order-mannequin"><h2>Mannequin</h2><p>Feminine Form · {unit}</p><RotatableMannequin gender="female" activePointKeys={[]} measurements={{}} showControls={false}/></div></div><footer className="ob-dialog-actions ob-order-footer"><button type="button" onClick={onBack} className={workspaceSecondaryAction}>Cancel</button><button type="submit" className={workspacePrimaryAction}><img src="/icons/order-details/floppy-disk.svg" alt="" width={16} height={16}/>Save order</button></footer></form>;
}
createRoot(document.getElementById('root')!).render(<Review/>);
