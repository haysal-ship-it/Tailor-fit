import { clamp, lerp, smoothstep, smoothMin } from './common';

/**
 * Evaluates the signed distance field (SDF) for the arm, shoulder root, wrist, and hand.
 *
 * Anatomical improvements:
 * 1. Shoulder / Deltoid Root:
 *    - Arm thickness is measured cleanly for |x| >= 75px where clear of the torso.
 *    - For |x| < 75px, extrapolates inward with an anatomical deltoid profile.
 *    - Medial termination uses a smooth rounded 3D capsule dome submerged in the torso,
 *      completely eliminating the hard planar cut `max(limb, 45 - |x|)` and its chest slits.
 * 2. Wrist-to-Palm Flow:
 *    - Continuous C^1 depth transition along the forearm (u in [215, 245]).
 *    - Solid, non-planar palm block between wrist (u ≈ 238, width ~18px, depth ~14px)
 *      and knuckles (u ≈ 266, width ~28px, depth ~16px).
 * 3. Four Distinct Adjacent Fingers:
 *    - Adjacent with gentle separating grooves (pitch 7.0px, radius 3.0..3.4px).
 *    - Anatomical reach profile: Index (~284), Middle (~293), Ring (~291), Little (~284).
 *    - Metacarpal arch (knuckle rows 202..205.5) and subtle physiological downward curl.
 * 4. Opposable Thumb:
 *    - Natural reach to u ≈ 260 with anterior angle (z in [+8.5, +11.5]) and downward slope.
 *    - Natural web space clearance from index finger.
 * 5. Forearm Union:
 *    - Smooth union (k ≈ 2.0) into the forearm.
 *
 * @param x World-unscaled image X coordinate (-330 to +330)
 * @param yRow Image row (vertical axis, crown ~56 to feet ~715)
 * @param z Unscaled depth (-115 to +115, anterior is +z)
 * @param arm Measured front silhouette arm column properties { x, cy, ry }
 * @returns Signed distance to arm/hand surface in image pixel units
 */
export function evaluateArmHandSDF(
  x: number,
  yRow: number,
  z: number,
  arm: { x: number; cy: number; ry: number }
): number {
  const u = Math.abs(x);

  // ---------------------------------------------------------------------------
  // 1. Shoulder / Deltoid Root & Forearm
  // ---------------------------------------------------------------------------
  // For u < 75px, the silhouette column scan penetrates the torso/bust.
  // Extrapolate inward to an anatomical deltoid profile sloping into the clavicle.
  let cy = arm.cy;
  let ry = arm.ry;

  if (u < 75) {
    const tShoulder = smoothstep(42, 75, u);
    // Shoulder rises toward row 178 at the clavicle root (u = 42)
    cy = lerp(178.0, clamp(arm.cy, 185, 192), tShoulder);
    // Deltoid thickness gently transitions from ~21px at acromion down to ~18px at root
    ry = lerp(18.0, clamp(arm.ry, 18, 22), tShoulder);
  } else {
    // For u >= 75px, clamp excessive measurements from shoulder crease
    ry = clamp(arm.ry, 2, 22);
  }

  // Flattening depth ratio along the forearm: 0.90 at shoulder/bicep down to 0.65 at wrist
  const depthFactor = lerp(0.90, 0.65, smoothstep(215, 245, u));
  const rz = ry * depthFactor;

  // Medial end (u = 42) and distal wrist end (u = 246) use rounded capsule caps.
  // CRITICAL: No planar clipping (45 - u)! The medial dome is fully submerged in the torso.
  const capMedial = Math.max(0, 42 - u);
  const capDistal = Math.max(0, u - 246);
  const uCapOffset = capMedial + capDistal;

  const dArm =
    (Math.hypot(uCapOffset / ry, (yRow - cy) / ry, (z + 3) / rz) - 1) *
    Math.min(ry, rz);

  // If well clear of the hand region, return arm distance directly
  if (u < 220 || yRow < 175 || yRow > 235) {
    return dArm;
  }

  // ---------------------------------------------------------------------------
  // 2. Tapered Palm Block (u in [238, 266])
  // ---------------------------------------------------------------------------
  // Wrist at u ≈ 238 (width 18px, depth 14px) -> Knuckles at u ≈ 266 (width 28px, depth 16px)
  const nearestPalmU = clamp(u, 238, 266);
  const tPalm = (nearestPalmU - 238) / 28;
  const palmRow = lerp(202.0, 203.5, tPalm);
  const palmZ = lerp(-0.5, -0.5, tPalm);
  // Vertical thickness (palmar-dorsal thickness: 17px at wrist, 16px at knuckles)
  const palmRy = lerp(8.5, 8.0, tPalm);
  // Width across fingers (16px at wrist widening to 28px at knuckles)
  const palmRz = lerp(8.0, 14.0, tPalm);
  const palmRx = 6.0;

  const dPalm =
    (Math.hypot(
      (u - nearestPalmU) / palmRx,
      (yRow - palmRow) / palmRy,
      (z - palmZ) / palmRz
    ) -
      1) *
    Math.min(palmRy, palmRz);

  // ---------------------------------------------------------------------------
  // 3. Four Distinct Adjacent Fingers (u in [266, 296])
  // ---------------------------------------------------------------------------
  // Reaches: Little (~284), Ring (~291), Middle (~293), Index (~284)
  // Knuckles distribute across depth z in [-10.5, +10.5] with pitch 7.0px
  // and rows in [202, 205.5]. Rounded fingertips with radius ~3.0px.
  let dFingers = 1000;
  const fingertips = [284, 291, 293, 284];
  const knuckleRows = [205.5, 203.5, 202.0, 203.0];
  const knuckleZ = [-10.5, -3.5, 3.5, 10.5];
  const uKnuckle = 266;

  for (let f = 0; f < 4; f++) {
    const tip = fingertips[f];
    const baseZ = knuckleZ[f];
    const baseRow = knuckleRows[f];
    const nearestU = clamp(u, uKnuckle, tip);
    const fingerT = clamp((nearestU - uKnuckle) / (tip - uKnuckle), 0, 1);

    // Physiological downward curl (row increases by ~1.8px at fingertips)
    const curlRow = baseRow + 1.8 * Math.pow(fingerT, 1.4);
    // Subtle inward arch toward midline
    const curlZ = baseZ - 0.4 * Math.sign(baseZ) * fingerT;

    // Substantial 3D rounded cross section (base 3.4px down to 3.0px at tip)
    const radX = lerp(3.4, 3.0, fingerT);
    const radY = lerp(3.3, 2.9, fingerT);
    const radZ = lerp(3.4, 3.0, fingerT);

    const dFinger =
      (Math.hypot(
        (u - nearestU) / radX,
        (yRow - curlRow) / radY,
        (z - curlZ) / radZ
      ) -
        1) *
      Math.min(radY, radZ);

    // Subtle skin web blending creates gentle separating grooves without melting
    dFingers = f === 0 ? dFinger : smoothMin(dFingers, dFinger, 1.0);
  }

  // ---------------------------------------------------------------------------
  // 4. Opposable Thumb
  // ---------------------------------------------------------------------------
  // Base at row 207.5, u = 248, z = 8.5
  // Extends downward and forward to tip at u ≈ 260, row ≈ 215.5, z ≈ 11.5
  const thAx = 248.0, thAy = 207.5, thAz = 8.5;
  const thBx = 260.0, thBy = 215.5, thBz = 11.5;
  const abX = thBx - thAx; // 12.0
  const abY = thBy - thAy; // 8.0
  const abZ = thBz - thAz; // 3.0
  const abLenSq = abX * abX + abY * abY + abZ * abZ; // 217.0

  const thumbT = clamp(
    ((u - thAx) * abX + (yRow - thAy) * abY + (z - thAz) * abZ) / abLenSq,
    0,
    1
  );
  const tX = thAx + abX * thumbT;
  const tY = thAy + abY * thumbT;
  const tZ = thAz + abZ * thumbT;
  const thumbRad = lerp(4.0, 3.0, thumbT);
  const dThumb = Math.hypot(u - tX, yRow - tY, z - tZ) - thumbRad;

  // ---------------------------------------------------------------------------
  // 5. Composite Hand & Smooth Forearm Blend
  // ---------------------------------------------------------------------------
  let dHand = smoothMin(dPalm, dFingers, 2.0);
  dHand = smoothMin(dHand, dThumb, 2.2);

  // Smooth union into forearm with blend radius k ≈ 2.0
  return smoothMin(dArm, dHand, 2.0);
}
