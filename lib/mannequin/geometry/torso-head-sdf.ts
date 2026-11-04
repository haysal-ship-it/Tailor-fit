import { clamp, smoothMin, smoothMax, lerp, smoothstep } from './common';

/**
 * Pre-smoothing helper: applies Gaussian-weighted rolling window smoothing
 * over silhouette row spans (over ~11-15 rows) to eliminate integer stair-stepping
 * and marching cubes horizontal terracing / banding.
 *
 * @param y Target row coordinate
 * @param rowsData Silhouette spans data (e.g. source.left.rows or source.front.rows)
 * @param radius Half-window radius in rows (default 7 => 2*7 + 1 = 15 rows total)
 */
export function smoothRowBounds(
  y: number,
  rowsData: number[][][],
  radius: number = 7
): [number, number] {
  let weightedLo = 0;
  let weightedHi = 0;
  let totalWeight = 0;

  // Standard deviation ~ radius / 2.0 (e.g. sigma = 3.5 for radius = 7)
  const sigma = Math.max(1.0, radius / 2.0);
  const twoSigmaSq = 2.0 * sigma * sigma;

  const yCenter = Math.round(y);
  const maxIdx = rowsData.length - 1;

  for (let d = -radius; d <= radius; d++) {
    const rowIdx = clamp(yCenter + d, 0, maxIdx);
    const spans = rowsData[rowIdx];
    if (!spans || spans.length === 0) continue;

    const valid = spans.filter((s) => s[1] - s[0] > 9 && s[0] < 440 && s[1] > 200);
    if (valid.length > 0) {
      const weight = Math.exp(-(d * d) / twoSigmaSq);
      weightedLo += valid[0][0] * weight;
      weightedHi += valid[valid.length - 1][1] * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight > 0) {
    return [weightedLo / totalWeight, weightedHi / totalWeight];
  }
  return [317, 319];
}

/**
 * Precomputes a full smoothed silhouette lookup table for an entire array of rows,
 * ensuring high evaluation performance without repeated filtering during grid sampling.
 */
export function buildSmoothedSilhouetteTable(
  rowsData: number[][][],
  totalRows: number = 730,
  radius: number = 7
): Array<[number, number]> {
  const table: Array<[number, number]> = new Array(totalRows);
  for (let row = 0; row < totalRows; row++) {
    table[row] = smoothRowBounds(row, rowsData, radius);
  }
  return table;
}

/**
 * Continuous implicit signed distance field for the mannequin Torso, Head,
 * Bust, Neck, Shoulders, and Glutes.
 *
 * Coordinates:
 * - x: lateral axis (u = |x|, centered at spine x = 0)
 * - row: vertical image row (row 54 = crown, ~139 = neck, ~168 = shoulders,
 *        ~228 = bust apex, ~295 = waist, ~376 = glutes apex, ~400 = pelvic perineum)
 * - z: depth axis (positive z is anterior/front, negative z is posterior/back)
 * - r: row slice properties { cz: center z, rz: depth radius, rx: lateral radius }
 * - female: boolean flag for anatomical gender
 */
export function evaluateTorsoHeadSDF(
  x: number,
  z: number,
  row: number,
  r: { cz: number; rz: number; rx: number },
  female: boolean
): number {
  const u = Math.abs(x);
  let center = r.cz;
  let depth = r.rz;
  let width = r.rx;

  // --------------------------------------------------------------------------
  // 1. Cranium & Crown Rounding (row < 90)
  // --------------------------------------------------------------------------
  // Retains measured jaw & neck contours while rounding the skull crown.
  if (row < 90) {
    const blend = 1.0 - smoothstep(72, 90, row);
    const cap = Math.sqrt(Math.max(0.001, 1.0 - Math.pow((row - 89) / 35.0, 2)));
    width = lerp(width, (female ? 29.0 : 30.0) * cap, blend);
    depth = lerp(depth, 38.0 * cap, blend);
    center = lerp(center, 0.0, blend);
  }

  // Base elliptical torso slice
  let body = (Math.hypot(x / width, (z - center) / depth) - 1.0) * Math.min(width, depth);

  // --------------------------------------------------------------------------
  // 2. Head, Neck & Chin Transition (rows 110 to 145)
  // --------------------------------------------------------------------------
  // Replaces the harsh horizontal undercut shelf under the chin with a continuous
  // anatomical cervico-mental throat transition blended via smoothMin (k ≈ 6.0).
  if (row >= 110 && row <= 145) {
    // Chin extends down to row ~130 with forward projection in front (z > center)
    const chinRow = 130.0;
    const chinDepth = Math.max(depth, female ? 28.0 : 30.0);
    const chinWidth = Math.max(width, female ? 21.0 : 22.5);
    const headSDF = (Math.hypot(x / chinWidth, (z - center) / chinDepth) - 1.0) * Math.min(chinWidth, chinDepth);
    const boundedHead = Math.max(headSDF, row - chinRow);

    // Neck column extending upward into skull base (row 115)
    const neckRx = female ? 18.0 : 19.5;
    const neckRz = female ? 22.0 : 23.5;
    const neckCz = 0.5;
    const neckSDF = (Math.hypot(x / neckRx, (z - neckCz) / neckRz) - 1.0) * Math.min(neckRx, neckRz);
    const boundedNeck = Math.max(neckSDF, 115.0 - row);

    // Smooth anatomical throat blend (k = 6.0)
    const throatBlend = smoothMin(boundedHead, boundedNeck, 6.0);
    body = smoothMin(body, throatBlend, 5.0);
  }

  // --------------------------------------------------------------------------
  // 3. Trapezius Slope & Rounded Acromion Shoulder (rows 139 to 175)
  // --------------------------------------------------------------------------
  // Replaces boxy squared shoulders with a natural trapezius slope and
  // rounds the acromion shoulder joint.
  if (row >= 139 && row <= 175 && u > 17.0) {
    const shoulderOuter = female ? 57.0 : 64.5;
    const tTrap = clamp((u - 17.5) / (shoulderOuter - 17.5), 0.0, 1.0);
    // Smooth S-curve slope from neck base (row 141) down to acromion (row 169)
    const rowTrap = 141.5 + 27.5 * tTrap * tTrap * (3.0 - 2.0 * tTrap);

    // Points above the trapezius line are outside the body
    const dTrap = rowTrap - row;
    // Lateral boundary of the deltoid/shoulder
    const dLat = u - width;

    // Corner fillet rounding the acromion joint (radius ~8.5px)
    const roundedAcromion = smoothMax(dTrap, dLat, 8.5);
    body = smoothMax(body, roundedAcromion, 4.5);
  }

  // Crown top cutoff
  body = Math.max(body, 54.0 - row);

  // --------------------------------------------------------------------------
  // 4. Female Bust Refinement (rows 185 to 262, z > center)
  // --------------------------------------------------------------------------
  // Broad anatomical breast displacement field integrated with the ribcage.
  // Apex at row 228 matching side silhouette (z ~ +42), gentle upper slope
  // merging seamlessly into chest, lateral sweep towards armpits, soft IMF.
  if (female && row >= 185 && row <= 262 && z > center) {
    const rowApex = 228.0;

    // Vertical normalized distance: gentle upper slope (41 rows), steeper lower contour (26 rows)
    const dy = row < rowApex ? (row - rowApex) / 41.0 : (row - rowApex) / 26.0;

    // Lateral sweep towards armpits (anterior axillary line at rows 195-215)
    const sweepProgress = clamp((rowApex - row) / 28.0, 0.0, 1.0) * clamp((row - 185.0) / 25.0, 0.0, 1.0);
    const uBreast = 26.5 + 4.5 * sweepProgress;

    // Lateral normalized distance: broader upper root merging with pectoral muscle
    const rxBreast = row < rowApex ? 19.5 : 17.0;
    const dx = (u - uBreast) / rxBreast;

    // Anterior projection: base anchored inside the ribcage so posterior half is embedded
    const zBase = center + depth * 0.35;
    const rzBreast = depth * 0.77;
    const dz = (z - zBase) / rzBreast;

    let distBreast = (Math.hypot(dx, dy, dz) - 1.0) * 20.0;

    // Soft inframammary fold (IMF) tuck underneath breast (rows 248 to 262)
    if (row > 248.0) {
      const imfProgress = smoothstep(248.0, 262.0, row);
      distBreast += 5.0 * imfProgress * (1.0 - clamp(u / 36.0, 0.0, 1.0));
    }

    // Broad continuous blend with ribcage (k = 7.5) preserves central sternum firm wall
    body = smoothMin(body, distBreast, 7.5);
  }

  // --------------------------------------------------------------------------
  // 5. Glutes & Pelvic Posterior (rows 345 to 420, z < center)
  // --------------------------------------------------------------------------
  // Two distinct left and right gluteal cheek volumes with central vertical
  // cleft groove and soft lower gluteal fold, filling the profile gap in side view.
  if (row >= 342 && row <= 422 && z < center) {
    const uGlute = female ? 22.5 : 21.0;
    const rowApex = female ? 376.0 : 378.0;

    // Upper gluteal slope (sacral entry) vs lower gluteal curve
    const dy = row < rowApex ? (row - rowApex) / 33.0 : (row - rowApex) / 39.0;
    const dx = (u - uGlute) / (female ? 22.0 : 20.5);

    // Posterior projection: fills the ~6px profile gap in side view
    const zBase = center - depth * 0.30;
    const rzGlute = depth * 0.78;
    const dz = (z - zBase) / rzGlute;

    let distGlute = (Math.hypot(dx, dy, dz) - 1.0) * 24.0;

    // Intergluteal cleft deepening towards midline (u -> 0)
    if (u < 12.0) {
      const cleftFactor = 1.0 - smoothstep(0.0, 12.0, u);
      const verticalCleft = smoothstep(348.0, 365.0, row) * (1.0 - smoothstep(405.0, 420.0, row));
      distGlute += 4.5 * cleftFactor * verticalCleft;
    }

    // Soft lower gluteal fold transition into posterior upper thigh
    if (row > 398.0) {
      const foldProgress = smoothstep(398.0, 420.0, row);
      distGlute += 4.0 * foldProgress;
    }

    body = smoothMin(body, distGlute, 7.0);
  }

  // --------------------------------------------------------------------------
  // 6. Lower Pelvic Perineum / Saddle Floor (Crotch Transition)
  // --------------------------------------------------------------------------
  // Replaces the flat horizontal cut plane (row - 400) with a continuous
  // anatomical pelvic perineal saddle connecting seamlessly into the legs.
  const crotchRow = lerp(403.0, 418.0, smoothstep(0.0, 24.0, u) * (z < center ? 1.0 : 0.0));
  const anteriorPubisRow = lerp(crotchRow, 396.0, smoothstep(center, center + depth * 0.8, z) * (1.0 - smoothstep(12.0, 30.0, u)));
  body = Math.max(body, row - anteriorPubisRow);

  return body;
}
