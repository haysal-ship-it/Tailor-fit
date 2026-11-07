import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9226;
const OUT = path.resolve('project-memory/landing-evidence');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${path.join(os.tmpdir(), 'chr-feat-' + Date.now())}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

try {
  let wsUrl;
  for (let i = 0; i < 30 && !wsUrl; i++) {
    await sleep(400);
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((p) => p.type === 'page')?.webSocketDebuggerUrl; } catch {}
  }
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1; const pend = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); } };
  const send = (method, params = {}) => new Promise((r) => { const i = id++; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.value;
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64')); console.log('saved', name); };

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://127.0.0.1:3001/landing' });
  await sleep(6000);

  const readBars = `JSON.stringify([...document.querySelectorAll('#features button .origin-left')].map(b => getComputedStyle(b).transform))`;
  const readSticky = `Math.round(document.querySelector('#features h2').getBoundingClientRect().top)`;
  const cardTop = (i) => `(() => { const c = document.querySelectorAll('#features .lg\\\\:col-span-7 > div')[${i}]; const r = c.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; })()`;

  const cards = [await ev(cardTop(0)), await ev(cardTop(1)), await ev(cardTop(2))];
  console.log('cards', JSON.stringify(cards));
  const frames = [
    ['08-features-measurements-mid.png', cards[0].top + cards[0].h * 0.5 - 450],
    ['09-features-clients-start.png', cards[1].top + 10 - 450],
    ['10-features-clients-mid.png', cards[1].top + cards[1].h * 0.5 - 450],
    ['11-features-orders-mid.png', cards[2].top + cards[2].h * 0.6 - 450],
  ];
  for (const [name, y] of frames) {
    await ev(`window.scrollTo(0, ${Math.round(y)})`);
    await sleep(900);
    console.log(name, 'bars', await ev(readBars), 'h2Top', await ev(readSticky));
    await shot(name);
  }

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await ev(`document.querySelector('#features').scrollIntoView()`);
  await sleep(1200);
  await shot('12-features-mobile-390.png');
  ws.close();
} finally { chrome.kill(); }
