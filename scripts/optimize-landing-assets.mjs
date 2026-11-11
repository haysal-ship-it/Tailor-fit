import sharp from 'sharp';
import path from 'node:path';

// Derivatives only: original artwork and mannequin pixels remain untouched.
const directory = path.resolve('public/assets/landing');
for (const [name, width, quality] of [
  ['hero-sky', 1448, 82], ['hero-app-preview', 2080, 85],
  ['noisy-gradient-1', 800, 72], ['noisy-gradient-2', 800, 72],
  ['cta-banner-bg', 1440, 78], ['footer-toile', 1586, 85],
]) {
  const result = await sharp(path.join(directory, `${name}.png`))
    .resize({ width, withoutEnlargement: true }).webp({ quality })
    .toFile(path.join(directory, `${name}.webp`));
  console.log(`${name}: ${result.size} bytes`);
}
const crop = await sharp(path.join(directory, 'hero-app-preview.png'))
  .extract({ left: 1010, top: 230, width: 1188, height: 1500 })
  .resize({ width: 960 }).webp({ quality: 88 })
  .toFile(path.join(directory, 'mannequin-preview.webp'));
console.log(`mannequin-preview: ${crop.size} bytes`);
