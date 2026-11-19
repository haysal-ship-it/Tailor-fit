const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
let storedState=null;
const cache=new Map();
function load(file){
  file=path.resolve(file);if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const req=id=>{
    if(id.endsWith('.css'))return {};
    if(id==='react-dom/client')return {createRoot:()=>({render:()=>{}})};
    if(id==='@/lib/store')return load('components/explorations/onboarding-review/PreviewStore.tsx');
    if(id==='@/components/onboarding/TourProvider')return load('components/explorations/onboarding-review/PreviewTour.ts');
    if(id.startsWith('@/')||id.startsWith('.')){
      const base=id.startsWith('@/')?path.join(process.cwd(),id.slice(2)):path.resolve(path.dirname(file),id);
      const found=['','.ts','.tsx','.js'].map(ext=>base+ext).find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
      if(found){if(path.resolve(found)===path.resolve('components/onboarding/TourProvider.tsx'))return load('components/explorations/onboarding-review/PreviewTour.ts');return load(found);}
    }
    return require(id);
  };
  vm.runInNewContext(code,{exports,module:{exports},require:req,React,console,URL,Intl,Date,Map,Set,Buffer,process,TextEncoder,setTimeout,clearTimeout,localStorage:{getItem:()=>JSON.stringify(storedState)},document:{getElementById:()=>({})}},{filename:file});
  return exports;
}
const {freshState,readPreview,scenarioState,setupProgress}=load('components/explorations/onboarding-review/model.ts');
const {Review}=load('components/explorations/onboarding-review/Review.tsx');
function render(state){storedState=state;return renderToStaticMarkup(React.createElement(Review));}
const fresh=render(freshState());assert.ok(fresh.includes('Make Tailorfit yours.'));assert.ok(fresh.includes('Your name'));assert.ok(fresh.includes('Studio name (optional)'));assert.ok(fresh.includes('Skip setup'));assert.ok(fresh.includes('mannequin-female-front.png'));console.log('PASS Fresh setup renders the form and real mannequin artwork');
const defaults=render(scenarioState('defaults'));for(const text of ['Measurement unit','Centimetres (cm)','Nigerian naira (NGN)','Ade Atelier','Open my workspace'])assert.ok(defaults.includes(text),text);console.log('PASS Defaults renders approved menus, existing profile inputs and continuation');
const skipped=render(scenarioState('skipped'));assert.ok(skipped.includes('Resume'));assert.ok(skipped.includes('0 of 3'));console.log('PASS Skipped setup remains incomplete and can be resumed');
const dashboard=render(scenarioState('dashboard'));for(const target of ['overview-analytics','overview-chart','overview-calendar','overview-add-client','overview-new-order'])assert.ok(dashboard.includes('data-tour="'+target+'"'),target);assert.ok(dashboard.includes('overview-recent-orders'));assert.ok(dashboard.includes('1 of 3'));assert.ok(dashboard.includes('Show me around'));console.log('PASS First Overview preserves calendar/recent markup and all five tour targets');
const completed=scenarioState('completed'),completeMarkup=render(completed);assert.deepEqual(Array.from(setupProgress(completed)),[true,true,true]);assert.ok(completeMarkup.includes('You’re ready for what'));assert.ok(completeMarkup.includes('aria-expanded="false"'));assert.ok(completeMarkup.includes('Ada Okafor'));assert.ok(completeMarkup.includes('Aso-oke two-piece'));console.log('PASS A saved order completes its client/order milestones and collapses the checklist');
for(const raw of [null,'invalid','{"version":99}'])assert.equal(readPreview(raw).page,'welcome');
const resumed=readPreview(JSON.stringify({...scenarioState('resume'),unit:'in',currency:'USD'}));assert.equal(resumed.page,'defaults');assert.equal(resumed.unit,'in');assert.equal(resumed.currency,'USD');assert.equal(resumed.studio,'Ade Atelier');console.log('PASS Refresh restores entered setup values; malformed state resets safely');
const orderMarkup=render({...freshState(),page:'order'});assert.ok(orderMarkup.includes('New Order'));assert.ok(orderMarkup.includes('floppy-disk.svg'));assert.ok(!orderMarkup.includes('Ada Okafor'));console.log('PASS Preview New Order starts fresh with Save and Cancel');
const source=fs.readFileSync('components/explorations/onboarding-review/Review.tsx','utf8');assert.ok(source.includes('event.origin!==location.origin'));assert.ok(source.includes('event.source!==window.parent'));assert.ok(source.includes("if(pending.current)return"));assert.ok(source.includes("if(failSave)"));console.log('PASS Scenario messages stay origin-scoped and simulated saves guard duplicate submissions');
const {DEMO_DURATION,DEMO_POINTS,DEMO_FRAMES,demoFrameAt,demoSize}=load('components/explorations/onboarding-review/mannequin-demo.ts');
assert.equal(DEMO_DURATION,18000);
assert.equal(demoFrameAt(2200).point,'waist_circumference');assert.equal(demoFrameAt(2200).reveal,true);
assert.equal(demoFrameAt(5300).point,'bust_chest');assert.equal(demoFrameAt(8400).point,'shoulder_width');
assert.equal(demoFrameAt(DEMO_DURATION+2200).id,demoFrameAt(2200).id);
assert.equal(demoFrameAt(DEMO_DURATION).id,demoFrameAt(0).id);
console.log('PASS Measurement sequence repeats at the loop boundary without losing the first step');
assert.deepEqual(Array.from(DEMO_FRAMES.filter(f=>f.id.startsWith('turn-')).map(f=>f.view)),['left','back','right']);
for(const time of [11200,13100,15000]){assert.equal(demoFrameAt(time).pointsVisible,false);assert.equal(demoFrameAt(time).reveal,false);}
assert.equal(demoFrameAt(16300).view,'front');assert.equal(demoFrameAt(17400).pointsVisible,true);
const landmarks=load('lib/mannequin-landmarks.ts').MANNEQUIN_LANDMARKS_3D;
for(const p of DEMO_POINTS){const landmark=landmarks.find(l=>l.key===p.key);assert.equal(p.x,318+landmark.x3dFemale);assert.equal(p.y,landmark.y);}
console.log('PASS Rotation hides front callouts and demo markers match the production landmark positions');
assert.equal(demoSize(72,'cm'),'72 cm');assert.equal(demoSize(72,'in'),'28.3 in');assert.equal(demoSize(38,'in'),'15 in');
assert.ok(fresh.includes('Example measurements'));assert.ok(fresh.includes('72 cm'));
console.log('PASS Example measurements follow the selected unit and the static reduced-motion poster is meaningful');
console.log('11 preview checks passed. These are server-render and logic checks, not browser visual verification.');
