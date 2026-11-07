import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9225;
const OUTPUT_DIR = path.resolve('project-memory/auth-evidence');

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
    await sleep(2000);
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
  const tempDir = path.join(os.tmpdir(), `chrome-auth-${Date.now()}`);
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

    // 1. Sign In Page - Desktop 1440x900
    console.log('\n--- 1. Sign In Desktop ---');
    await client.setViewport(1440, 900);
    await client.navigate('http://127.0.0.1:3001/signin');
    await sleep(1500);
    await client.captureScreenshot('auth-01-signin-desktop-1440.png');

    // 2. Sign Up Page - Desktop 1440x900
    console.log('\n--- 2. Sign Up Desktop ---');
    await client.navigate('http://127.0.0.1:3001/signup');
    await sleep(1500);
    await client.captureScreenshot('auth-02-signup-desktop-1440.png');

    // 3. Reset Password Page - Desktop 1440x900
    console.log('\n--- 3. Reset Password Desktop ---');
    await client.navigate('http://127.0.0.1:3001/reset-password');
    await sleep(1500);
    await client.captureScreenshot('auth-03-reset-password-desktop-1440.png');

    // 4. Interactive Test: Reset Password Feedback
    console.log('\n--- 4. Reset Password Feedback State ---');
    await client.eval(`
      const input = document.querySelector('input[type="email"]');
      if (input) {
        input.value = "tailor@example.com";
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    `);
    await sleep(800);
    await client.captureScreenshot('auth-04-reset-password-feedback.png');

    // 5. Sign In Mobile - 390x844
    console.log('\n--- 5. Sign In Mobile 390 ---');
    await client.setViewport(390, 844);
    await client.navigate('http://127.0.0.1:3001/signin');
    await sleep(1500);
    await client.captureScreenshot('auth-05-signin-mobile-390.png');

    // 6. Interactive Test: Password reveal toggle on Sign In
    console.log('\n--- 6. Sign In Password Reveal Toggle ---');
    await client.eval(`
      const pwd = document.querySelector('input[placeholder="Password"]');
      if (pwd) {
        pwd.value = "BespokeTailor2026!";
        pwd.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const eyeBtn = document.querySelector('button[aria-label*="password"]');
      if (eyeBtn) eyeBtn.click();
    `);
    await sleep(500);
    await client.captureScreenshot('auth-06-password-toggle-interactive.png');

    console.log('\nAll auth screenshots captured successfully!');
    client.close();
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

main().catch((err) => {
  console.error('Auth capture error:', err);
  process.exit(1);
});
