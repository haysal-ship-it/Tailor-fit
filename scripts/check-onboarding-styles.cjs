const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),postcss=require('postcss');
const css=fs.readFileSync('components/onboarding/studio-setup.css','utf8');
const root=postcss.parse(css);let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
function value(selector,property,width,tree=root){let result;tree.walkRules(rule=>{if(!rule.selectors.includes(selector))return;let parent=rule.parent;while(parent&&parent.type!=='root'){if(parent.type==='atrule'&&parent.name==='media'){const max=parent.params.match(/max-width:\s*(\d+)px/);if(!max||width>Number(max[1]))return;}parent=parent.parent;}rule.walkDecls(property,decl=>{result=decl.value;});});return result;}
test('Main setup contains styling for every setup-specific class',()=>{const screen=fs.readFileSync('components/onboarding/StudioSetupScreen.tsx','utf8'),classes=new Set(screen.match(/\bob-[a-z0-9-]+\b/g));for(const name of classes)assert.ok(css.includes('.'+name),name+' is missing its stylesheet rule');});
test('Desktop setup uses the approved bounded two-column frame',()=>{assert.equal(value('.ob-setup-frame','display',1440),'grid');assert.equal(value('.ob-setup-frame','grid-template-columns',1440),'1fr 1fr');assert.equal(value('.ob-setup-main','max-width',1440),'1040px');assert.equal(value('.ob-setup-form','padding',1440),'36px 40px');});
test('Setup header keeps the brand, note and skip action aligned',()=>{assert.equal(value('.ob-setup-nav','display',1440),'flex');assert.equal(value('.ob-setup-nav','justify-content',1440),'space-between');assert.equal(value('.ob-setup-nav','background',1440),undefined);});
test('Setup typography and full-width primary action are included',()=>{assert.equal(value('.ob-intro>h1','font-size',1440),'28px');assert.equal(value('.ob-continue','width',1440),'100%');assert.equal(value('.ob-fields','display',1440),'flex');});
test('Phone widths use one column and hide the companion panel',()=>{for(const width of [320,390,767]){assert.equal(value('.ob-setup-frame','grid-template-columns',width),'1fr');assert.equal(value('.ob-companion','display',width),'none');assert.equal(value('.ob-step-actions>button','width',width),'100%');}assert.equal(value('.studio-onboarding','padding-left',320),'12px');});
test('Tablet and desktop keep the mannequin companion contained',()=>{for(const width of [768,1024,1440]){assert.equal(value('.ob-companion','display',width),'flex');assert.equal(value('.ob-companion','overflow',width),'hidden');assert.equal(value('.ob-mannequin>div','max-width',width),'375px');}});
const dist=process.argv.find(arg=>arg.startsWith('--dist='))?.slice(7);
if (dist) test('Workspace route ships the responsive setup layout and demo overlay', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, 'app-build-manifest.json'), 'utf8'));
  const assets = [...manifest.pages['/layout'], ...manifest.pages['/app/page']];
  const cssFiles = [...new Set(assets.filter(asset => asset.endsWith('.css')))];
  const built = postcss.parse(cssFiles.map(file => fs.readFileSync(path.join(dist, file), 'utf8')).join('\n'));
  assert.equal(value('.ob-setup-frame', 'display', 1440, built), 'grid');
  assert.equal(value('.ob-setup-frame', 'grid-template-columns', 1440, built), '1fr 1fr');
  assert.equal(value('.ob-setup-nav', 'display', 1440, built), 'flex');
  assert.equal(value('.ob-intro>h1', 'font-size', 1440, built), '28px');
  assert.equal(value('.ob-setup-frame', 'grid-template-columns', 390, built), '1fr');
  assert.equal(value('.ob-companion', 'display', 390, built), 'none');
  assert.ok(built.nodes.some(rule => rule.selectors?.includes('.ob-demo-overlay')), 'Missing demo overlay');
});
console.log(checks+' onboarding stylesheet checks passed. These do not replace interactive browser verification.');
