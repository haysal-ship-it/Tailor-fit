import {MANNEQUIN_LANDMARKS_3D} from '@/lib/mannequin-landmarks';

export type DemoPoint = 'waist_circumference' | 'bust_chest' | 'shoulder_width';
export type DemoView = 'front' | 'left' | 'back' | 'right';
export const DEMO_DURATION = 18000;
export const DEMO_POINTS = ([
  {key:'waist_circumference',label:'Waist',cm:72,side:'left'},
  {key:'bust_chest',label:'Bust',cm:92,side:'right'},
  {key:'shoulder_width',label:'Shoulder',cm:38,side:'right'},
] as const).map(point=>{
  const landmark=MANNEQUIN_LANDMARKS_3D.find(l=>l.key===point.key)!;
  return {...point,x:318+landmark.x3dFemale,y:landmark.y};
});
export function demoSize(cm:number,unit:'cm'|'in'){
  return `${unit==='in'?Math.round(cm/2.54*10)/10:cm} ${unit}`;
}
export interface DemoFrame {at:number;id:string;view:DemoView;point:DemoPoint|null;reveal:boolean;pointsVisible:boolean;}
const front={view:'front' as const,point:null,reveal:false,pointsVisible:true};
export const DEMO_FRAMES:DemoFrame[]=[
  {...front,at:0,id:'arrive'},
  {...front,at:1800,id:'hover-waist',point:'waist_circumference'},
  {...front,at:2200,id:'measure-waist',point:'waist_circumference',reveal:true},
  {...front,at:4200,id:'move-to-bust'},
  {...front,at:4900,id:'hover-bust',point:'bust_chest'},
  {...front,at:5300,id:'measure-bust',point:'bust_chest',reveal:true},
  {...front,at:7300,id:'move-to-shoulder'},
  {...front,at:8000,id:'hover-shoulder',point:'shoulder_width'},
  {...front,at:8400,id:'measure-shoulder',point:'shoulder_width',reveal:true},
  {...front,at:10400,id:'prepare-rotation',pointsVisible:false},
  {...front,at:11200,id:'turn-left',view:'left',pointsVisible:false},
  {...front,at:13100,id:'turn-back',view:'back',pointsVisible:false},
  {...front,at:15000,id:'turn-right',view:'right',pointsVisible:false},
  {...front,at:16300,id:'return-front',pointsVisible:false},
  {...front,at:17400,id:'rest'},
];
export const REDUCED_FRAME:DemoFrame={...front,at:0,id:'still',point:'waist_circumference',reveal:true};
export function demoFrameAt(time:number):DemoFrame{
  const elapsed=((time%DEMO_DURATION)+DEMO_DURATION)%DEMO_DURATION;
  return [...DEMO_FRAMES].reverse().find(frame=>elapsed>=frame.at)!;
}
const waist=DEMO_POINTS[0],bust=DEMO_POINTS[1],shoulder=DEMO_POINTS[2];
const position=(x:number,y:number)=>`translate(${x}px, ${y}px)`;
const ease='cubic-bezier(0.4, 0, 0.2, 1)';
// One clock drives both the compositor cursor and the renderer's view changes.
export const DEMO_CURSOR_KEYFRAMES:Keyframe[]=[
  {offset:0,transform:position(530,460),opacity:0,easing:ease},
  {offset:400/DEMO_DURATION,transform:position(530,460),opacity:1,easing:ease},
  {offset:1800/DEMO_DURATION,transform:position(waist.x+4,waist.y+4),opacity:1},
  {offset:4200/DEMO_DURATION,transform:position(waist.x+4,waist.y+4),opacity:1,easing:ease},
  {offset:4900/DEMO_DURATION,transform:position(bust.x+4,bust.y+4),opacity:1},
  {offset:7300/DEMO_DURATION,transform:position(bust.x+4,bust.y+4),opacity:1,easing:ease},
  {offset:8000/DEMO_DURATION,transform:position(shoulder.x+4,shoulder.y+4),opacity:1},
  {offset:10400/DEMO_DURATION,transform:position(shoulder.x+4,shoulder.y+4),opacity:1,easing:ease},
  {offset:11100/DEMO_DURATION,transform:position(440,370),opacity:1,easing:ease},
  {offset:12300/DEMO_DURATION,transform:position(260,370),opacity:1},
  {offset:12800/DEMO_DURATION,transform:position(260,370),opacity:1,easing:ease},
  {offset:14200/DEMO_DURATION,transform:position(120,370),opacity:1},
  {offset:14700/DEMO_DURATION,transform:position(120,370),opacity:0},
  {offset:17500/DEMO_DURATION,transform:position(530,460),opacity:0},
  {offset:1,transform:position(530,460),opacity:0},
];
