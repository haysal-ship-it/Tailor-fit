import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9236;
const OUTPUT_DIR = path.resolve('project-memory/landing-refinement-evidence/after');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
    this.events = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.method) this.events.push(msg);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async navigate(url) {
    await this.send('Page.navigate', { url });
    await sleep(2500);
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    return res.result?.value;
  }

  async captureScreenshot(filename) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    const filePath = path.join(OUTPUT_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    console.log(`✓ Saved screenshot: ${filename} (${buffer.length} bytes)`);
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    await sleep(400);
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }
  }
}


async function main() {
  const url = process.env.LANDING_URL || 'http://127.0.0.1:3002/landing';
  const browser = spawn(process.env.CHROME_PATH || CHROME_PATH, [
    '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${fs.mkdtempSync(path.join(os.tmpdir(), 'tailorfit-verify-'))}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  let client;
  const results = [];
  const check = (name, value) => { results.push({ name, passed: !!value }); console.log(`${value ? 'PASS' : 'FAIL'} ${name}`); };
  try {
    for(let i=0; i<40; i++) {
      try {
        const pages = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`)).json();
        client = new CDPClient(pages.find(p=>p.type==='page').webSocketDebuggerUrl);
        await client.connect(); break;
      } catch { await sleep(250); }
    }
    if(!client) throw new Error('Browser did not start');
    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Network.enable');
    await client.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__landingCLS=0; new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__landingCLS+=e.value})).observe({type:"layout-shift",buffered:true});' });
    await client.setViewport(1440,900);
    await client.navigate(url);
    for(let i=0;i<120;i++) {
      if(await client.eval('!!document.querySelector("#hero-heading") && getComputedStyle(document.querySelector("header")).position === "fixed"')) break;
      await sleep(500);
    }
    await client.eval('document.fonts.ready.then(()=>true)');
    check('Landing main landmark and one h1', await client.eval('document.querySelectorAll("main").length===1 && document.querySelectorAll("h1").length===1'));
    check('Instrument Serif loaded', await client.eval('[...document.fonts].some(f=>f.family.includes("Instrument") && f.status==="loaded")'));
    check('Initial layout shift below 0.1', await client.eval('window.__landingCLS < 0.1'));
    check('No WebGL canvases', await client.eval('document.querySelectorAll("canvas").length===0'));
    for(const [width,height] of [[320,900],[390,844],[768,900],[1024,900],[1440,900],[844,390]]) {
      await client.setViewport(width,height);
      await client.eval('window.scrollTo(0,0)');
      await sleep(400);
      check(`No overflow ${width}x${height}`, await client.eval('document.documentElement.scrollWidth <= innerWidth'));
      check(`Hero clears navigation ${width}`, await client.eval('document.querySelector("#hero-heading").getBoundingClientRect().top > document.querySelector("header").getBoundingClientRect().bottom'));
      check(`Hero preview below CTA ${width}`, await client.eval('document.querySelector("picture").getBoundingClientRect().top > document.querySelector("main section a").getBoundingClientRect().bottom'));
      if(width < 768) check(`Mobile navigation stays one row ${width}`, await client.eval('document.querySelector("header").getBoundingClientRect().height <= 70'));
      await client.captureScreenshot(`hero-${width}x${height}.png`);
      if(width===390 || width===1440) {
        for(const id of ['how-it-works','features','feature-clients','feature-orders','faq','cta-banner']) {
          await client.eval(`document.getElementById('${id}').scrollIntoView({behavior:'instant'})`);
          await sleep(400);
          await client.captureScreenshot(`${id}-${width}.png`);
        }
        await client.eval('document.querySelector("footer").scrollIntoView({behavior:"instant"})');
        await client.captureScreenshot(`footer-${width}.png`);
      }
    }
    await client.setViewport(390,844);
    await client.eval('window.scrollTo(0,0); document.querySelector("button[aria-controls=landing-mobile-menu]").click()');
    await sleep(230);
    check('Mobile menu opens', await client.eval('document.querySelector("button[aria-controls=landing-mobile-menu]").getAttribute("aria-expanded")==="true" && !!document.querySelector("#landing-mobile-menu")'));
    await client.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await sleep(180);
    check('Escape closes menu and restores focus', await client.eval('!document.querySelector("#landing-mobile-menu") && document.activeElement.getAttribute("aria-controls")==="landing-mobile-menu"'));
    await client.eval('document.querySelector("button[aria-controls=landing-mobile-menu]").click()');
    await sleep(220);
    await client.eval('document.querySelectorAll("#landing-mobile-menu > a")[1].click()');
    await sleep(1000);
    console.log('Anchor position', await client.eval('({active:document.activeElement.id,top:document.querySelector("#features").getBoundingClientRect().top,header:document.querySelector("header").getBoundingClientRect().bottom,hash:location.hash})'));
    check('Anchor navigation focuses visible section', await client.eval('document.activeElement.id==="features" && document.querySelector("#features").getBoundingClientRect().top >= document.querySelector("header").getBoundingClientRect().bottom'));
    await client.eval('document.querySelector("#faq").scrollIntoView(); for(let i=0;i<7;i++)document.getElementById("faq-trigger-1").click()');
    await sleep(260);
    check('Rapid FAQ toggling settles with accessible panel', await client.eval('document.getElementById("faq-trigger-1").getAttribute("aria-expanded")==="true" && !document.getElementById("faq-answer-1").inert && document.getElementById("faq-answer-1").getBoundingClientRect().height>0'));
    await client.setViewport(1440,900);
    await client.send('Emulation.setTouchEmulationEnabled',{enabled:false});
    await client.navigate(url);
    await client.eval('document.getElementById("feature-measurements").scrollIntoView({behavior:"instant"})');
    await sleep(200);
    check('Decorative motion starts on desktop in view', await client.eval('document.getAnimations().some(a=>a.effect?.target?.className?.includes("backdrop") && a.playState==="running")'));
    await client.eval('window.scrollTo({top:0,behavior:"instant"})');
    await sleep(200);
    check('Decorative motion pauses offscreen', await client.eval('document.getAnimations().filter(a=>a.effect?.target?.className?.includes("backdrop")).every(a=>a.playState!=="running")'));
    await client.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
    await client.setViewport(390,844);
    await client.navigate(url);
    check('Touch emulation uses a coarse pointer', await client.eval('matchMedia("(pointer: coarse)").matches'));
    await client.eval('document.getElementById("feature-measurements").scrollIntoView({behavior:"instant"})');
    await sleep(100);
    check('Decorative backgrounds are static for touch', await client.eval('document.getAnimations().filter(a=>a.effect?.target?.className?.includes("backdrop")).every(a=>a.playState!=="running")'));
    await client.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await client.navigate(url);
    await client.eval('document.fonts.ready.then(()=>true); document.querySelector("#features").scrollIntoView()');
    await sleep(300);
    check('Reduced motion has no active animation', await client.eval('document.getAnimations().filter(a=>a.playState==="running").length===0'));
    check('Reduced-motion FAQ transition is disabled', await client.eval('getComputedStyle(document.getElementById("faq-answer-0")).transitionDuration==="0s"'));
    await client.setViewport(720,450); // Effective CSS viewport for a 1440px screen at 200% zoom.
    check('200% zoom equivalent reflows', await client.eval('document.documentElement.scrollWidth <= innerWidth'));
    check('Images loaded without errors', await client.eval('[...document.images].filter(i=>i.complete && i.loading!=="lazy").every(i=>i.naturalWidth>0)'));
    const failedAssets = client.events.filter(e=>e.method==='Network.responseReceived' && e.params.response.status>=400 && /\/(assets|_next)\//.test(e.params.response.url));
    check('No missing image, font or script resources', failedAssets.length===0);
    check('No browser runtime exceptions', !client.events.some(e=>e.method==='Runtime.exceptionThrown'));
    fs.writeFileSync(path.join(OUTPUT_DIR,'checks.json'),JSON.stringify(results,null,2));
    if(results.some(r=>!r.passed)) process.exitCode=1;
  } finally { client?.close(); browser.kill(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
