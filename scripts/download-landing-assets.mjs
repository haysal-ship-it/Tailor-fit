import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const prefix = 'https://www.figma.com/api/mcp/asset/1d6b6206-9096-40d8-b2cf-96375ed35cf7';
const assets = {
  'hero-sky.png': `${prefix}/a16e2.png`,
  'hero-app-preview.png': `${prefix}/aeb99.png`,
  'logo-white.png': `${prefix}/62cea.png`,
  'noisy-gradient-1.png': `${prefix}/2e3c7.png`,
  'noisy-gradient-2.png': `${prefix}/b71cd.png`,
  'features-preview.png': `${prefix}/21c3b.png`,
  'footer-toile.png': `${prefix}/3f0e8.png`,
  'logo-black.png': `${prefix}/8ee16.png`,
  'cta-banner-bg.png': `${prefix}/3a06f.png`,
  'cloud-arrow-up.svg': `${prefix}/39116.svg`,
};

const targetDir = path.resolve('public/assets/landing');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function download(filename, url) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(targetDir, filename);
    const file = fs.createWriteStream(filePath);
    
    function fetchUrl(targetUrl) {
      https.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${targetUrl}: HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => resolve());
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        reject(err);
      });
    }

    fetchUrl(url);
  });
}

async function run() {
  for (const [name, url] of Object.entries(assets)) {
    console.log(`Downloading ${name}...`);
    await download(name, url);
    const size = fs.statSync(path.join(targetDir, name)).size;
    console.log(`✓ Saved ${name} (${size} bytes)`);
  }
  console.log('\nAll landing assets downloaded successfully to public/assets/landing!');
}

run().catch((err) => {
  console.error('Download error:', err);
  process.exit(1);
});
