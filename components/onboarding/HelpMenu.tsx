'use client';
import {useState} from 'react';
import {HelpCircle} from 'lucide-react';
import {ChoiceMenu} from '@/components/ui/ChoiceMenu';
import {ModalDialog} from '@/components/ui/ModalDialog';
import {requestWorkspaceNavigation} from '@/lib/workspace-confirmation';
import {useTour} from './TourProvider';
export function HelpMenu(){
 const tour=useTour(),[guide,setGuide]=useState(false);
 function start(resume:boolean){const go=()=>window.dispatchEvent(new CustomEvent('tailorfit:request-tour',{detail:{resume}}));if(requestWorkspaceNavigation(go))go();}
 return <><ChoiceMenu kind="menu" iconOnly icon={<HelpCircle size={18}/>} placeholder="Help and tours" options={[{value:'setup',label:'Set up your studio'},{value:'getting-started',label:'Getting started'},{value:'start',label:'Take the quick tour'},...(tour.status==='interrupted'?[{value:'resume',label:'Resume tour'}]:[]),{value:'guide',label:'Measurement help'},{value:'tips',label:'Show contextual tips',checked:tour.contextualTipsEnabled}]} onChoose={value=>{if(value==='setup')window.dispatchEvent(new CustomEvent('tailorfit:request-setup'));else if(value==='getting-started')window.dispatchEvent(new CustomEvent('tailorfit:request-getting-started'));else if(value==='start')start(false);else if(value==='resume')start(true);else if(value==='guide')setGuide(true);else tour.setTipsEnabled(!tour.contextualTipsEnabled);}}/>{guide&&<ModalDialog title="Studio measurement guide" onRequestClose={()=>setGuide(false)}><div className="space-y-4 p-5 text-sm leading-relaxed text-[var(--text-2)]"><p>Open a client and use Saved Measurements to record or review a fitting.</p><p>Drag the 3D mannequin to rotate it. Select a point to enter its size, or choose a garment template to add a group of points.</p><p>Check the measurement unit before recording sizes. When creating an order, review its measurements, price, references and due date before saving.</p></div></ModalDialog>}</>;
}
