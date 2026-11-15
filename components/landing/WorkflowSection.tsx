import { SolvaReveal as Reveal } from './SolvaReveal';
import { LandingFauxUI, type SceneId } from './faux-ui/Scenes';
import styles from './landing.module.css';

const STEPS: {kind:SceneId;title:string;body:string;wide?:boolean}[] = [
  {kind:'client',title:'Add your client',body:'Enter their contact details and the garment you’re making.'},
  {kind:'fitting',title:'Record the fitting',body:'Choose a garment template, then enter measurements on the mannequin or in List view.'},
  {kind:'order',title:'Keep the order together',body:'Add style references, price and a due date. Return to the client’s record when you need them.'},
  {kind:'share',title:'Share order details with clients',body:'Share an order preview so your client can review the garment details, price and due date.',wide:true},
];

export function WorkflowSection(){return (
  <section id="how-it-works" tabIndex={-1} aria-labelledby="workflow-heading" className={`${styles.container} ${styles.section}`}>
    <Reveal className={styles.sectionIntro}>
      <div className="max-w-[480px]"><h2 id="workflow-heading" className={styles.heading}>From client details to the next fitting.</h2></div>
      <div className="max-w-[480px]"><p className={styles.body}>Capture measurements with an interactive mannequin, save client details, and keep track of what&apos;s due.</p></div>
    </Reveal>
    <div className={styles.workflow}>
      {STEPS.map((step,i)=><div key={step.kind} className={step.wide?styles.workflowWide:'min-w-0'}>
        <Reveal className={styles.workflowVisual} delay={i*60}><LandingFauxUI kind={step.kind}/></Reveal>
        <div className="flex flex-col gap-2"><h3>{step.title}</h3><p className={styles.body}>{step.body}</p></div>
      </div>)}
    </div>
  </section>
);}
