import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9224;
const OUTPUT_DIR = path.resolve('project-memory/landing-evidence');

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
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
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
  const tempDir = path.join(os.tmpdir(), `chrome-landing-${Date.now()}`);
  console.log('Launching headless Chrome with temp profile:', tempDir);

  const chromeProcess = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${tempDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--hide-scrollbars',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let client = null;
  try {
    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
      await sleep(400);
      try {
        const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
        const list = await res.json();
        const p = list.find((item) => item.type === 'page');
        if (p && p.webSocketDebuggerUrl) {
          wsUrl = p.webSocketDebuggerUrl;
          break;
        }
      } catch {}
    }

    if (!wsUrl) throw new Error('Could not connect to Chrome debugging endpoint');
    console.log(`Connected to Chrome DevTools at ${wsUrl}`);

    client = new CDPClient(wsUrl);
    await client.connect();
    await client.send('Page.enable');
    await client.send('Runtime.enable');

    // 1. Desktop 1440x900 - Hero
    console.log('\n--- 1. Desktop 1440x900 Hero ---');
    await client.setViewport(1440, 900);
    await client.navigate('http://127.0.0.1:3001/landing');
    await sleep(2000);
    await client.captureScreenshot('01-landing-hero-desktop-1440.png');

    // 2. Desktop - How it works
    console.log('\n--- 2. How it works ---');
    await client.eval(`
      document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'instant' });
    `);
    await sleep(1000);
    await client.captureScreenshot('02-landing-how-it-works-desktop.png');

    // 3. Desktop - Features
    console.log('\n--- 3. Features ---');
    await client.eval(`
      document.querySelector('#features')?.scrollIntoView({ behavior: 'instant' });
    `);
    await sleep(1000);
    await client.captureScreenshot('03-landing-features-desktop.png');

    // 4. Desktop - FAQ
    console.log('\n--- 4. FAQ ---');
    await client.eval(`
      document.querySelector('#faq')?.scrollIntoView({ behavior: 'instant' });
    `);
    await sleep(1000);
    await client.captureScreenshot('04-landing-faq-desktop.png');

    // 5. Desktop - CTA Banner
    console.log('\n--- 5. CTA Banner ---');
    await client.eval(`
      document.querySelector('#cta-banner')?.scrollIntoView({ behavior: 'instant' });
    `);
    await sleep(1000);
    await client.captureScreenshot('05-landing-cta-banner-desktop.png');

    // 6. Desktop - Footer
    console.log('\n--- 6. Footer ---');
    await client.eval(`
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
    `);
    await sleep(1000);
    await client.captureScreenshot('06-landing-footer-desktop.png');

    // 7. Mobile 390x844 - Hero
    console.log('\n--- 7. Mobile 390x844 Hero ---');
    await client.setViewport(390, 844);
    await client.eval(`window.scrollTo({ top: 0, behavior: 'instant' });`);
    await sleep(1000);
    await client.captureScreenshot('07-landing-mobile-390.png');

    // 8. Mobile - Navigation Menu Opened
    console.log('\n--- 8. Mobile Menu ---');
    await client.eval(`
      const btn = document.querySelector('button[aria-label="Open navigation"]');
      if (btn) btn.click();
    `);
    await sleep(800);
    await client.captureScreenshot('08-landing-mobile-menu-390.png');

    console.log('\nAll landing screenshots captured successfully!');
    client.close();
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

main().catch((err) => {
  console.error('Landing capture error:', err);
  process.exit(1);
});
