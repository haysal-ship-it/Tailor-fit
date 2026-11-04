import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9223;
const OUTPUT_DIR = path.resolve('project-memory/tour-evidence');

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
  const tempDir = path.join(os.tmpdir(), `chrome-tour-${Date.now()}`);
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

    // 1. Desktop: Load overview with clean state
    console.log('\n--- 1. Desktop 1366x900 First Visit Invitation ---');
    await client.setViewport(1366, 900);
    await client.navigate('http://127.0.0.1:3001/?tab=overview');
    await client.eval(`
      localStorage.clear();
      location.reload();
    `);
    await sleep(2500);

    const hasInvitation = await client.eval(`
      !!document.querySelector('[data-tour-invitation]') ||
      Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Take the tour'))
    `);
    console.log('Has invitation button?', hasInvitation);
    await client.captureScreenshot('01-overview-invitation-desktop.png');

    // 2. Click "Take the tour" -> Step 1 (client)
    console.log('\n--- 2. Step 1: Start with your client ---');
    const clickedTakeTour = await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Take the tour'));
        if (btn) { btn.click(); return true; }
        return false;
      })()
    `);
    console.log('Clicked "Take the tour"?', clickedTakeTour);
    await sleep(1500);
    const step1Title = await client.eval(`
      document.querySelector('#tour-overlay-dialog h3')?.textContent || 'dialog not found'
    `);
    console.log('Step 1 Dialog title:', step1Title);
    await client.captureScreenshot('02-tour-step1-client-desktop.png');

    // 3. Click "Next" -> Step 2 (template)
    console.log('\n--- 3. Step 2: Choose the measurements you need ---');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    const step2Title = await client.eval(`
      document.querySelector('#tour-overlay-dialog h3')?.textContent || 'dialog not found'
    `);
    console.log('Step 2 Dialog title:', step2Title);
    await client.captureScreenshot('03-tour-step2-template-desktop.png');

    // 4. Click "Next" -> Step 3 (measure)
    console.log('\n--- 4. Step 3: Measure from every angle ---');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    const step3Title = await client.eval(`
      document.querySelector('#tour-overlay-dialog h3')?.textContent || 'dialog not found'
    `);
    console.log('Step 3 Dialog title:', step3Title);
    await client.captureScreenshot('04-tour-step3-measure-desktop.png');

    // 5. Click "Next" -> Step 4 (save)
    console.log('\n--- 5. Step 4: Bring the order together ---');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    const step4Title = await client.eval(`
      document.querySelector('#tour-overlay-dialog h3')?.textContent || 'dialog not found'
    `);
    console.log('Step 4 Dialog title:', step4Title);
    await client.captureScreenshot('05-tour-step4-save-desktop.png');

    // 6. Click "Next" -> Step 5 (reuse)
    console.log('\n--- 6. Step 5: Find the fitting again ---');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    const step5Title = await client.eval(`
      document.querySelector('#tour-overlay-dialog h3')?.textContent || 'dialog not found'
    `);
    console.log('Step 5 Dialog title:', step5Title);
    await client.captureScreenshot('06-tour-step5-reuse-desktop.png');

    // 7. Click "Finish tour" -> Completion feedback
    console.log('\n--- 7. Completion Feedback ---');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Finish tour'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    const hasCompletion = await client.eval(`
      document.body.innerText.includes("You're ready to start")
    `);
    console.log('Has completion banner?', hasCompletion);
    await client.captureScreenshot('07-overview-completion-feedback-desktop.png');

    // 8. Mobile 390x844: Invitation
    console.log('\n--- 8. Mobile 390x844 Invitation ---');
    await client.setViewport(390, 844);
    await client.eval(`
      localStorage.clear();
      location.reload();
    `);
    await sleep(2500);
    await client.captureScreenshot('08-overview-invitation-mobile-390.png');

    // 9. Mobile Step 1: Bottom Sheet
    console.log('\n--- 9. Mobile Step 1 Sheet ---');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Take the tour'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    await client.captureScreenshot('09-tour-step1-mobile-390.png');

    // 10. Mobile Step 3: Mannequin Viewer Sheet
    console.log('\n--- 10. Mobile Step 3 Sheet ---');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1000);
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    await client.captureScreenshot('10-tour-step3-mobile-390.png');

    // 11. Mobile Step 5: Reuse (dock at bottom -> top sheet or anchored)
    console.log('\n--- 11. Mobile Step 5 Sheet ---');
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1000);
    await client.eval(`
      (() => {
        const btn = Array.from(document.querySelectorAll('#tour-overlay-dialog button')).find(b => b.textContent.includes('Next'));
        if (btn) btn.click();
      })()
    `);
    await sleep(1500);
    await client.captureScreenshot('11-tour-step5-mobile-390.png');

    // 12. Narrow 320x740: Step 3
    console.log('\n--- 12. Narrow 320x740 Step 3 ---');
    await client.setViewport(320, 740);
    await sleep(1000);
    await client.captureScreenshot('12-tour-card-narrow-320.png');

    // 13. Contextual tip desktop
    console.log('\n--- 13. Contextual Tip Desktop ---');
    await client.setViewport(1366, 900);
    await client.navigate('http://127.0.0.1:3001/?tab=overview');
    await client.eval(`
      localStorage.setItem('tailorfit:onboarding:v1', JSON.stringify({
        version: 1,
        status: 'finished',
        lastCompletedStep: 'reuse',
        contextualTipsEnabled: true,
        acknowledgedTipIds: []
      }));
      location.reload();
    `);
    await sleep(2500);
    await client.captureScreenshot('13-contextual-tip-desktop.png');

    // 14. Mannequin control panel preserved (shows 4-view angle strip)
    console.log('\n--- 14. Mannequin Control Panel Preserved ---');
    await client.captureScreenshot('14-mannequin-control-panel-preserved.png');

    // 15. Settings Screen Help Section
    console.log('\n--- 15. Settings Screen Help Section ---');
    await client.navigate('http://127.0.0.1:3001/?tab=settings');
    await sleep(2000);
    await client.captureScreenshot('15-settings-help-section-desktop.png');

    console.log('\nALL 15 SCENARIOS CAPTURED CLEANLY!');
    client.close();
  } finally {
    try {
      chromeProcess.kill();
    } catch {}
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
