/**
 * extract-reference-silhouettes.cjs
 * 
 * Deterministic extraction of reference silhouette row and column spans from
 * the authoritative TailorFit mannequin transparent PNGs.
 * 
 * Pipeline documentation:
 * - Reads public/assets/mannequin-{female,male}-{front,left}.png.
 * - Applies alpha threshold >= 180 to reject transparent fringes.
 * - Extracts horizontal spans [xStart, xEnd] for each row (0..729).
 * - Filters specks of width < 4 px and ignores floor reflections below y = 715.
 * - Extracts vertical arm column bounds [minY, maxY] for front views (0..635).
 * - Outputs lib/mannequin/reference-silhouettes.json.
 */

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const ALPHA_THRESHOLD = 180;
const MIN_SPAN_WIDTH = 4;
const MAX_ROW = 715;

async function extractSpansForImage(imagePath, isFront) {
  const { data, info } = await sharp(imagePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  // 1. Extract row spans
  const rows = [];
  for (let y = 0; y < height; y++) {
    if (y > MAX_ROW) {
      rows.push([]);
      continue;
    }
    const spans = [];
    let inSpan = false;
    let startX = 0;

    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha >= ALPHA_THRESHOLD) {
        if (!inSpan) {
          inSpan = true;
          startX = x;
        }
      } else {
        if (inSpan) {
          inSpan = false;
          if (x - startX >= MIN_SPAN_WIDTH) {
            spans.push([startX, x - 1]);
          }
        }
      }
    }
    if (inSpan && width - startX >= MIN_SPAN_WIDTH) {
      spans.push([startX, width - 1]);
    }

    // Filter floor reflections between feet (central x 330-345 near bottom)
    const filteredSpans = spans.filter(([s, e]) => {
      if (y >= 703 && s >= 330 && e <= 345) return false;
      return true;
    });

    rows.push(filteredSpans);
  }

  // 2. Extract column bounds (arms) for front views strictly within the T-pose arm band (y: 150..240)
  const columns = [];
  if (isFront) {
    for (let x = 0; x < width; x++) {
      let minY = -1;
      let maxY = -1;
      for (let y = 150; y <= 240; y++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha >= ALPHA_THRESHOLD) {
          if (minY === -1) minY = y;
          maxY = y;
        }
      }
      if (minY !== -1 && maxY - minY >= 2) {
        columns.push([minY, maxY]);
      } else {
        columns.push(null);
      }
    }
  }

  return { rows, columns };
}

(async () => {
  const result = {};

  for (const gender of ['female', 'male']) {
    console.log(`Extracting silhouettes for ${gender}...`);
    const front = await extractSpansForImage(`public/assets/mannequin-${gender}-front.png`, true);
    const left = await extractSpansForImage(`public/assets/mannequin-${gender}-left.png`, false);

    result[gender] = {
      front: {
        rows: front.rows,
        columns: front.columns,
      },
      left: {
        rows: left.rows,
      },
    };
  }

  const outputPath = path.join(__dirname, '..', 'lib', 'mannequin', 'reference-silhouettes.json');
  fs.writeFileSync(outputPath, JSON.stringify(result));
  console.log(`Wrote deterministic silhouette spans to ${outputPath}`);
})();
