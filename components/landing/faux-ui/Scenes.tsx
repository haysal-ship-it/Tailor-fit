'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { ArrowUpRight, Check as Tick, ChevronDown, ChevronLeft, ChevronRight, Copy, Link2, Mail, Plus, Ruler, CalendarDays, Shirt, ArrowRight, Search, Layers, RotateCcw, Play, Pause, Save } from 'lucide-react';
import { Stage, Card, Row, Avatar, Field, Button, Badge, Segmented, Check, Text, Bar, Popover, Roll, Count, type Act } from './stageshow';
import './faux-ui.css';
import './motion.css';

const tokens = { '--ss-font': 'var(--font-manrope, Manrope), sans-serif', '--ss-accent': '#1d49e8', '--ss-accent-text': '#1d49e8', '--ss-accent-soft': '#edf2ff', '--ss-canvas': '#f8f8f8', '--ss-surface': '#ffffff', '--ss-text-strong': '#1d1d1d', '--ss-text': '#595959', '--ss-text-faint': '#737373', '--ss-line': '#e9e9ec', '--ss-radius-md': '8px', '--ss-radius-lg': '12px', '--ss-control': '36px', '--ss-row': '28px' } as const;
export type Gender = 'female' | 'male';
export type SceneId = 'client' | 'fitting' | 'order' | 'share' | 'measurements' | 'records' | 'schedule';
type S = { name: string; value: string; price: string; selected: number; done: boolean; open: boolean; focus: boolean; busy: boolean; side: boolean; day: number; tab: number; resetting: boolean };
const base: S = { name: 'Adriana Kunle', value: '92', price: '85,000', selected: 0, done: false, open: false, focus: false, busy: false, side: false, day: 0, tab: 0, resetting: false };
const initial: Record<SceneId,S> = {
  client: {...base,name:''}, fitting:{...base,selected:0}, order:{...base,price:''}, share:{...base},
  measurements:{...base}, records:{...base,selected:0}, schedule:{...base},
};
const poster: Record<SceneId,S> = {
  client:{...base,done:true}, fitting:{...base,selected:1,value:'72',done:true}, order:{...base,done:true},
  share:{...base,open:true,done:true}, measurements:{...base,selected:1,value:'72',done:true},
  records:{...base,done:true,selected:0}, schedule:{...base,day:24,open:true,done:true},
};

// Each story plays once, holds its payoff, and only rewinds on an explicit replay.
const scripts: Record<SceneId,(a:Act<S>)=>Promise<void>> = {
  async client(a){
    await a.wait(650); a.mark('client-name'); await a.click({at:'client-name',x:.8,y:.5});
    await a.set({focus:true}); await a.type('name','Adriana Kunle',{interval:85});
    await a.wait(450); await a.set({focus:false}); a.mark('add-client');
    await a.click({at:'add-client',x:.85,y:.55}); await a.set({busy:true});
    await a.wait(650); await a.set({done:true,busy:false}); a.mark('client-added');
    await a.move('rest',{duration:650}); await a.wait(2200);
  },
  async fitting(a){
    await a.wait(750); a.mark('select-waist'); await a.click({at:'waist-point',x:.5,y:.5});
    await a.set({selected:1,value:'',focus:true}); await a.wait(300);
    await a.click({at:'measurement-input',x:.7,y:.5}); await a.type('value','72',{interval:180});
    await a.wait(450); await a.key('enter'); await a.set({focus:false,done:true});
    a.mark('fitting-saved'); await a.move('rest',{duration:650}); await a.wait(2200);
  },
  async order(a){
    await a.wait(700); a.mark('order-price'); await a.click({at:'price-input',x:.75,y:.5});
    await a.set({focus:true}); await a.type('price','85,000',{interval:105});
    await a.wait(500); await a.set({focus:false}); await a.click({at:'due-date',x:.85,y:.5});
    await a.set({selected:1}); await a.wait(700); await a.click({at:'save-order',x:.8,y:.5});
    await a.set({busy:true}); await a.wait(550); await a.set({busy:false,done:true});
    a.mark('order-saved'); await a.move('rest',{duration:650}); await a.wait(2200);
  },
  async share(a){
    await a.wait(800); a.mark('open-share'); await a.click({at:'share-order',x:.8,y:.5});
    await a.set({open:true}); await a.wait(900);
    await a.click({at:'copy-link',x:.86,y:.5}); await a.set({done:true});
    a.mark('link-copied'); await a.move('rest',{duration:650}); await a.wait(2200);
  },
  async measurements(a){
    await a.wait(750); a.mark('rotate-model'); await a.click({at:'side-view',x:.8,y:.5});
    await a.set({side:true}); await a.wait(1050);
    await a.click({at:'front-view',x:.8,y:.5}); await a.set({side:false}); await a.wait(1000);
    a.mark('measure-waist'); await a.click({at:'waist-point',x:.5,y:.5});
    await a.set({selected:1,value:'',focus:true}); await a.wait(300);
    await a.click({at:'measurement-input',x:.7,y:.5}); await a.type('value','72',{interval:180});
    await a.wait(450); await a.key('enter'); await a.set({done:true,focus:false});
    a.mark('measurements-saved'); await a.move('rest',{duration:650}); await a.wait(2200);
  },
  async records(a){
    await a.wait(850); a.mark('previous-fitting'); await a.click({at:'previous-fitting',x:.72,y:.55});
    await a.set({selected:1,tab:1}); await a.wait(1300);
    a.mark('latest-fitting'); await a.click({at:'latest-fitting',x:.72,y:.55});
    await a.set({selected:0,tab:0,done:true}); await a.wait(800);
    a.mark('record-reviewed'); await a.move('rest',{duration:650}); await a.wait(2200);
  },
  async schedule(a){
    await a.wait(800); a.mark('pickup-date'); await a.click({at:'day-24',x:.78,y:.35});
    await a.set({day:24,open:true}); await a.wait(1500);
    a.mark('next-pickup'); await a.click({at:'day-26',x:.78,y:.35});
    await a.set({day:26}); await a.wait(1500);
    await a.click({at:'day-24',x:.78,y:.35}); await a.set({day:24,done:true});
    a.mark('pickup-selected'); await a.move('rest',{duration:650}); await a.wait(2200);
  },
};
export { scripts as demoScripts, initial as initialStates, poster as posterStates };

// Only the changing values dissolve at the seam. The mannequin, panel and
// labels remain as context; state resets under the mask, never in view.
const loopScripts = Object.fromEntries((Object.keys(scripts) as SceneId[]).map(id=>[id,async(a:Act<S>)=>{
  await scripts[id](a);
  a.mark('loop-reset');
  await a.set({resetting:true});
  await a.wait(260);
  await a.snap({...initial[id],resetting:true});
  a.place({x:id==='measurements'||id==='records'||id==='schedule'?680:510,y:26});
  await a.wait(120);
  await a.set({resetting:false});
  await a.wait(220);
}])) as Record<SceneId,(a:Act<S>)=>Promise<void>>;
export { loopScripts };
const LandingContext=createContext(false);
const labels:Record<SceneId,string>={client:'Adding a client and saving their details',fitting:'Recording measurements on TailorFit’s mannequin',order:'Saving garment references, price and due date',share:'Copying an order preview link',measurements:'Changing mannequin views and saving a measurement',records:'Reviewing a client’s previous and latest fittings',schedule:'Selecting pickup dates and reviewing their orders'};
export function LandingFauxUI({kind}:{kind:SceneId}){
  const content:Record<SceneId,ReactNode>={client:<AddClient/>,fitting:<Fitting gender="female"/>,order:<Order/>,share:<Share/>,measurements:<MeasurementFeature gender="female"/>,records:<ClientFeature gender="female"/>,schedule:<OrderFeature/>};
  return <LandingContext.Provider value={true}><div className="landing-faux-ui" role="img" aria-label={labels[kind]}><div aria-hidden="true" inert>{content[kind]}</div></div></LandingContext.Provider>;
}

const MotionContext=createContext({enabled:true,epoch:0,toggle:()=>{},replay:()=>{}});
export function MotionProvider({children}:{children:ReactNode}){
  const [enabled,setEnabled]=useState(true),[epoch,setEpoch]=useState(0);
  return <MotionContext.Provider value={{enabled,epoch,toggle:()=>setEnabled(v=>!v),replay:()=>setEpoch(v=>v+1)}}>{children}</MotionContext.Provider>;
}
export function MotionControls(){const m=useContext(MotionContext);return <div className="motion-controls"><button type="button" onClick={m.toggle} aria-pressed={m.enabled}>{m.enabled?<Pause size={12}/>:<Play size={12}/>} {m.enabled?'Motion on':'Still preview'}</button><button type="button" onClick={m.replay} disabled={!m.enabled}><RotateCcw size={12}/> Replay all</button></div>;}

function Scene({id,feature=false,children}:{id:SceneId;feature?:boolean;children:(s:S)=>ReactNode}){
  const m=useContext(MotionContext),landing=useContext(LandingContext),[run,setRun]=useState(0);
  return <div className="scene-shell"><Stage<S> key={`${m.enabled}-${m.epoch}-${run}`} width={feature?720:540} height={feature?420:360}
    compact={{below:feature?600:470,width:358,height:id==='schedule'?505:feature?390:340}}
    initial={m.enabled?initial[id]:poster[id]} poster={poster[id]} script={m.enabled?(landing?loopScripts[id]:scripts[id]):undefined}
    play={landing?'loop':'once'} runOffscreen={landing} cursor={m.enabled?{at:{x:feature?680:510,y:26},idle:1500,ripple:true}:undefined} tokens={tokens}
    fidelity="realistic" greys="cool" accent="#1d49e8" className={`tf-scene scene-${id}`}>
    {s=><><span className="cursor-rest" data-target="rest"/><div className="loop-content" data-resetting={s.resetting||undefined}>{children(s)}</div></>}
  </Stage>{!landing&&<div className="scene-playback"><span>{m.enabled?'CURSOR DEMO / PLAYS ONCE':'STILL / FINAL STATE'}</span><button type="button" onClick={()=>setRun(n=>n+1)} disabled={!m.enabled} aria-label={`Replay ${id} demonstration`}><RotateCcw size={11}/> Replay</button></div>}</div>;
}
const asset=(p:string)=>typeof window==='undefined'?p:(window as unknown as {__TAILORFIT_ASSETS__?:Record<string,string>}).__TAILORFIT_ASSETS__?.[p]||p;
function Head({title,children}:{title:string;children?:ReactNode}){return <div className="ui-head"><span>{title}</span>{children||<span className="quiet"><Layers size={15}/></span>}</div>;}
function Person({small=false}:{small?:boolean}){return <div className="person"><Avatar name="Adriana Kunle" tone="accent" size={small?30:40}/><div><strong>Adriana Kunle</strong><span>{small?'Gown / Dress':'Client since October 2026'}</span></div></div>;}
const points=[['Bust','92'],['Waist','72'],['Hip','98'],['Shoulder','38']];
function Measurements({s,count=3}:{s:S;count?:number}){return <div className="measurement-list">{points.slice(0,count).map(([name,n],i)=><Row key={name} selected={i===s.selected} pad={10} title={<Text>{name}</Text>} className="measurement-row"><span className={i===s.selected?'value active':'value'}><Count value={Number(i===1&&s.done?72:n)}/><small>cm</small></span></Row>)}<div className="measurement-entry"><Field label={s.selected===1?'Waist measurement':'Bust measurement'} value={s.selected===1?s.value:'92'} focused={s.focus} box={{'data-target':'measurement-input'}} trailing={<span className="quiet">cm</span>}/></div></div>;}
function Mannequin({gender,s,small=false}:{gender:Gender;s:S;small?:boolean}){return <div className={'model '+(small?'model-small':'')} data-active={s.selected} data-side={s.side||undefined}>
  <img className="model-front" src={asset(`/assets/mannequin-${gender}-front.png`)} alt={`TailorFit's actual ${gender} 3D mannequin`}/>
  <img className="model-side" src={asset(`/assets/mannequin-${gender}-left.png`)} alt=""/>
  {!small&&<><span className="body-point bust-point" data-target="bust-point"/><span className="body-point waist-point" data-target="waist-point" data-cursor="pointer"/><span className="model-guide"/></>}
  </div>;}
function Result({show,children,className=''}:{show:boolean;children:ReactNode;className?:string}){return <div className={`result-reveal ${className}`} data-visible={show||undefined} aria-hidden={!show}>{children}</div>;}

export function AddClient(){return <Scene id="client">{s=><><Card className="client-form hero-surface" pad="large" gap={16}><Head title="Basic Information"><Badge tone={s.done?'success':'neutral'}><Roll>{s.done?'Client saved':'New client'}</Roll></Badge></Head><Person/><div className="field-pair"><Field label="Client name" value={s.name} placeholder="Enter client name" focused={s.focus} box={{'data-target':'client-name'}}/><Field label="Garment type" value="Gown / Dress" trailing={<ChevronDown size={13}/>}/></div><Field label="Email address" value="adriana@example.com" leading={<Mail size={14}/>}/><div className="form-footer"><span className="quiet">Ready for the first fitting</span><Button data-target="add-client" variant="primary" size="large" icon={s.done?<Tick size={14}/>:<Plus size={14}/>}>{s.done?'Client added':s.busy?'Saving client':'Add client'}</Button></div></Card><Result show={s.done} className="client-saved"><Card pad="small" gap={0} lift><span className="inline"><Check on={s.done} size={18}/><strong>Ready for the first fitting</strong></span></Card></Result></>}</Scene>;}
export function Fitting({gender}:{gender:Gender}){return <Scene id="fitting">{s=><Card className="fitting-panel hero-surface" flush><Head title="Record measurements"><Badge tone="accent">Gown / Dress</Badge></Head><div className="fitting-columns"><Mannequin gender={gender} s={s}/><div className="fitting-values"><div className="eyebrow">BODY MEASUREMENTS</div><Measurements s={s}/><div className="saved-inline"><Check on={s.done} size={12}/><Roll>{s.done?'Measurement saved':'Select a measurement point'}</Roll></div></div></div></Card>}</Scene>;}
function Reference(){return <div className="reference"><div className="fabric-swatch"><Shirt size={32} strokeWidth={1}/></div><div><strong>Style reference</strong><span>Evening gown · 1 image</span></div></div>;}
export function Order(){return <Scene id="order">{s=><Card className="order-panel hero-surface" pad="large" gap={17}><Head title="Order details"><Button data-target="save-order" variant={s.done?'secondary':'primary'} size="small" icon={s.done?<Tick size={12}/>:<Save size={12}/>}>{s.done?'Saved':s.busy?'Saving':'Save order'}</Button></Head><Person small/><Reference/><div className="field-pair"><Field label="Agreed price" value={s.price} placeholder="Enter amount" focused={s.focus} box={{'data-target':'price-input'}} leading={<span>₦</span>}/><Field label="Due date" value="24 Nov 2026" box={{'data-target':'due-date'}} status={s.selected===1?'valid':undefined} trailing={<CalendarDays size={14}/>}/></div><div className="order-note"><span className="eyebrow">STYLE NOTES</span><p>Full-length gown with a fitted waist.</p></div><div className="saved-inline"><Check on={s.done} size={12}/><Roll>{s.done?'Saved to Adriana’s record':'Keep every order detail together'}</Roll></div></Card>}</Scene>;}
export function Share(){return <Scene id="share">{s=><><Card className="share-document hero-surface" pad="large" gap={17}><Head title="Order preview"><Button data-target="share-order" size="small" icon={<ArrowUpRight size={12}/>}>Share</Button></Head><Person small/><div className="document-rule"/><div className="summary"><span>Evening gown</span><strong>₦85,000</strong></div><div className="summary quiet"><span>Due date</span><span>24 Nov 2026</span></div><div className="document-rule"/><Reference/></Card><Popover show={s.open} origin="bottom left" className="share-popover"><Card lift pad="large" gap={12}><span className="inline"><Link2 size={16}/><strong>Share order preview</strong></span><div className="link-value">Order #TF-024</div><Button data-target="copy-link" variant="primary" size="large" icon={s.done?<Tick size={14}/>:<Copy size={14}/>}>{s.done?'Preview link copied':'Copy preview link'}</Button></Card></Popover></>}</Scene>;}
export function MeasurementFeature({gender}:{gender:Gender}){return <Scene id="measurements" feature>{s=><><Card className="measurement-workspace hero-surface" flush><Head title="Measurements"><Segmented items={['Front','Left side']} targets={['front-view','side-view']} value={s.side?1:0}/></Head><div className="workspace-top"><Person small/><Badge tone="neutral">cm</Badge></div><div className="measure-feature-columns"><Mannequin gender={gender} s={s}/><div className="feature-value-panel"><span className="eyebrow">GOWN / DRESS</span><Measurements s={s} count={3}/></div></div></Card><Result show={s.done} className="measurement-payoff"><Card lift pad="small" gap={0}><span className="inline"><Check on={s.done} size={17}/><strong>Measurements saved</strong></span></Card></Result></>}</Scene>;}
export function ClientFeature({gender}:{gender:Gender}){return <Scene id="records" feature>{s=><><Card className="records-workspace hero-surface" flush><Head title="Client profile"><Button size="small" icon={<Plus size={12}/>}>New order</Button></Head><div className="record-content"><Person/><div className="contact-line"><Mail size={13}/> adriana@example.com</div><div className="record-tabs"><Segmented items={['Measurements','Orders']} value={0}/></div><div className="fitting-heading"><strong>Saved fittings</strong><span className="quiet">2 records</span></div><Row data-target="latest-fitting" data-cursor="pointer" title={<Text>Evening gown</Text>} subtitle="12 Nov 2026" selected={s.selected===0} lead={<Ruler size={17}/>} meta={<Badge tone="accent">Latest</Badge>}/><Row data-target="previous-fitting" data-cursor="pointer" title={<Text>Two-piece set</Text>} subtitle="18 Oct 2026" selected={s.selected===1} lead={<Ruler size={17}/>} meta={<ArrowUpRight size={14}/>}/><div className="record-bottom"><span>Order history</span><span>3 orders <ArrowRight size={13}/></span></div></div></Card><Card className="fitting-snapshot" lift pad="large" gap={12}><div className="snapshot-heading"><strong><Roll>{s.selected===0?'Latest fitting':'Previous fitting'}</Roll></strong><Badge tone="neutral">cm</Badge></div><Mannequin gender={gender} s={s} small/><div className="snapshot-values"><span>Bust <Count value={s.selected===0?92:90}/></span><span>Waist <Count value={s.selected===0?72:70}/></span><span>Hip <Count value={s.selected===0?98:96}/></span></div></Card></>}</Scene>;}

const orders=[{name:'Adriana Kunle',garment:'Evening gown',day:24,status:'In Progress',tone:'warning' as const},{name:'Tunde Adeyemi',garment:'Agbada set',day:26,status:'Pending',tone:'neutral' as const},{name:'Zainab Bello',garment:'Two-piece set',day:28,status:'Completed',tone:'success' as const}];
// Adapted from OverviewScreen's month calendar: Monday-first, 4px cells,
// white rectangular dates, small status dots, and a pickup peek underneath.
function Calendar({s}:{s:S}){const picked=orders.find(o=>o.day===s.day)||orders[0];return <Card className="pickup-calendar" pad="large" gap={12} lift><div className="pickup-month"><strong>November 2026</strong><span><ChevronLeft size={13}/><ChevronRight size={13}/></span></div><div className="pickup-grid weekday">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><span key={d}>{d}</span>)}</div><div className="pickup-grid dates">{Array.from({length:42},(_,i)=>{const n=i-5,order=orders.find(o=>o.day===n),valid=n>=1&&n<=30;return <span key={i} data-target={valid?`day-${n}`:undefined} data-cursor={order?'pointer':undefined} className={`pickup-cell${valid?'':' blank'}${s.day===n?' active':''}`}><span>{valid?n:''}</span>{order&&<span className={`pickup-dot status-${order.tone}`}/>}</span>;})}</div><div className="pickup-peek" data-open={s.open||undefined}><div className="peek-date"><Roll>{`${s.day||24} Nov · Pickup`}</Roll><Badge tone={picked.tone}>{picked.status}</Badge></div><div className="peek-client"><Avatar name={picked.name} size={23}/><span><Roll>{picked.name}</Roll><small><Roll>{picked.garment}</Roll></small></span><ArrowUpRight size={13}/></div></div></Card>;}
export function OrderFeature(){return <Scene id="schedule" feature>{s=><><Card className="orders-workspace hero-surface" flush><Head title="Orders & pickups"><Button size="small" icon={<Plus size={12}/>}>New order</Button></Head><div className="orders-content"><div className="orders-toolbar"><span>All orders <b>3</b></span><Search size={16}/></div>{orders.map(o=><Row key={o.name} selected={s.day===o.day} className="schedule-row" lead={<Avatar name={o.name} size={28}/>} title={<Text>{o.name}</Text>} subtitle={o.garment} meta={<Badge tone={o.tone}>{o.status}</Badge>}><span className="order-date">{o.day} Nov</span></Row>)}<div className="order-list-footer"><CalendarDays size={14}/><span><Roll>{s.open?`${s.day} November · Pickup selected`:'Select a date to see its pickups'}</Roll></span></div></div></Card><Calendar s={s}/></>}</Scene>;}
