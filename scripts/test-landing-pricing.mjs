import assert from 'node:assert/strict';
import { build } from 'esbuild';
const compiled = await build({entryPoints:['lib/landing-pricing.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {planPrice, LANDING_PLANS} = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
for (const [monthly,annual,saving,equivalent] of [[0,0,0,0],[5000,54000,6000,4500],[10000,108000,12000,9000]]) {
  assert.deepEqual(planPrice(monthly,'yearly'),{total:annual,saving,monthlyEquivalent:equivalent});
  assert.deepEqual(planPrice(monthly,'monthly'),{total:monthly,saving:0,monthlyEquivalent:monthly});
  assert.equal(planPrice(monthly,'yearly').total,annual); // Repeated toggles retain the base monthly price.
}
console.log('PASS: Free, Solo and Fashion House monthly/yearly totals, savings and equivalents.');

assert.deepEqual(LANDING_PLANS.map(p=>p.monthly),[0,5000,10000]);
