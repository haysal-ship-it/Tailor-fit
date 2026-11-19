export type TourStepId = 'analytics' | 'chart' | 'calendar' | 'add-client' | 'new-order';
export type TourTargetKey = `overview-${TourStepId}`;
export interface TourStepDefinition { id:TourStepId;targetKey:TourTargetKey;stepNumber:number;totalSteps:number;title:string;body:string;preferredPlacement?:'bottom'|'top'|'left'|'right'; }
export const TOTAL_TOUR_STEPS=5;
export const TOUR_STEPS:TourStepDefinition[]=[
{id:'analytics',targetKey:'overview-analytics',stepNumber:1,totalSteps:5,title:'Your studio at a glance',body:'See total orders, active orders and recorded outstanding balances. Select a card to view its related orders.',preferredPlacement:'bottom'},
{id:'chart',targetKey:'overview-chart',stepNumber:2,totalSteps:5,title:'Track your studio activity',body:'Change the period to see orders created over time and compare with the previous period.',preferredPlacement:'right'},
{id:'calendar',targetKey:'overview-calendar',stepNumber:3,totalSteps:5,title:'Keep track of pickups',body:'Browse pickup dates and select a marked day to see its scheduled orders.',preferredPlacement:'left'},
{id:'add-client',targetKey:'overview-add-client',stepNumber:4,totalSteps:5,title:'Add a client',body:'Save contact details first. Add their measurements and orders from the client profile when ready.',preferredPlacement:'bottom'},
{id:'new-order',targetKey:'overview-new-order',stepNumber:5,totalSteps:5,title:'Create a new order',body:'Open the order workspace to enter garment details, references, measurements, price and due date.',preferredPlacement:'bottom'}
];
export function getTourStep(id:TourStepId):TourStepDefinition{return TOUR_STEPS.find(s=>s.id===id)||TOUR_STEPS[0]}
export function getNextStepId(id:TourStepId):TourStepId|null{const i=TOUR_STEPS.findIndex(s=>s.id===id);return i>=0?TOUR_STEPS[i+1]?.id||null:null}
export function getPrevStepId(id:TourStepId):TourStepId|null{const i=TOUR_STEPS.findIndex(s=>s.id===id);return i>0?TOUR_STEPS[i-1].id:null}
