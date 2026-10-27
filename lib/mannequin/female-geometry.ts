import * as THREE from 'three';

/**
 * Smooth mathematical helpers for anatomical surface generation.
 */
function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function smootherstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function gaussian(x: number, mean: number, sigma: number): number {
  const d = (x - mean) / sigma;
  return Math.exp(-0.5 * d * d);
}

function windowBand(x: number, start: number, end: number, feather: number): number {
  return smootherstep(start - feather, start + feather, x) * (1 - smootherstep(end - feather, end + feather, x));
}

/**
 * Piecewise cubic Catmull-Rom / Hermite 1D profile evaluator for smooth anatomical curves.
 */
function evalProfile(y: number, keyframes: Array<[number, number]>): number {
  if (y <= keyframes[0][0]) return keyframes[0][1];
  if (y >= keyframes[keyframes.length - 1][0]) return keyframes[keyframes.length - 1][1];

  let idx = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (y >= keyframes[i][0] && y <= keyframes[i + 1][0]) {
      idx = i;
      break;
    }
  }

  const [y1, v1] = keyframes[idx];
  const [y2, v2] = keyframes[idx + 1];
  const [y0, v0] = idx > 0 ? keyframes[idx - 1] : [y1 - (y2 - y1), v1];
  const [y3, v3] = idx + 2 < keyframes.length ? keyframes[idx + 2] : [y2 + (y2 - y1), v2];

  const dt = y2 - y1;
  if (dt <= 1e-6) return v1;
  const u = (y - y1) / dt;

  const m1 = 0.5 * ((v2 - v1) / dt + (v1 - v0) / Math.max(1e-6, y1 - y0)) * dt;
  const m2 = 0.5 * ((v3 - v2) / Math.max(1e-6, y3 - y2) + (v2 - v1) / dt) * dt;

  const u2 = u * u;
  const u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;

  return h00 * v1 + h10 * m1 + h01 * v2 + h11 * m2;
}

/**
 * Applies Taubin non-shrinking Laplacian mesh smoothing to a closed grid loft
 * (rows x radialSegments with welded seam) to eliminate any high-frequency crease
 * while preserving volume and silhouette accuracy.
 */
function applyGridTaubinSmoothing(
  positions: Float32Array,
  rows: number,
  radialSegments: number,
  iterations: number,
  pinEnds = true
): void {
  const vertexCount = rows * radialSegments;
  const temp = new Float32Array(positions.length);

  const stepPass = (weight: number) => {
    temp.set(positions);
    const startRow = pinEnds ? 1 : 0;
    const endRow = pinEnds ? rows - 1 : rows;

    for (let r = startRow; r < endRow; r++) {
      for (let c = 0; c < radialSegments; c++) {
        const idx = (r * radialSegments + c) * 3;
        const cPrev = (c - 1 + radialSegments) % radialSegments;
        const cNext = (c + 1) % radialSegments;
        const rPrev = Math.max(0, r - 1);
        const rNext = Math.min(rows - 1, r + 1);

        const idxL = (r * radialSegments + cPrev) * 3;
        const idxR = (r * radialSegments + cNext) * 3;
        const idxD = (rPrev * radialSegments + c) * 3;
        const idxU = (rNext * radialSegments + c) * 3;

        const avgX = 0.25 * (temp[idxL] + temp[idxR] + temp[idxD] + temp[idxU]);
        const avgY = 0.25 * (temp[idxL + 1] + temp[idxR + 1] + temp[idxD + 1] + temp[idxU + 1]);
        const avgZ = 0.25 * (temp[idxL + 2] + temp[idxR + 2] + temp[idxD + 2] + temp[idxU + 2]);

        positions[idx] = temp[idx] + weight * (avgX - temp[idx]);
        positions[idx + 1] = temp[idx + 1] + weight * (avgY - temp[idx + 1]);
        positions[idx + 2] = temp[idx + 2] + weight * (avgZ - temp[idx + 2]);
      }
    }
  };

  const lambda = 0.45;
  const mu = -0.47;
  for (let i = 0; i < iterations; i++) {
    stepPass(lambda);
    stepPass(mu);
  }
  void vertexCount;
}

/**
 * Builds a watertight indexed BufferGeometry from a [rows x radialSegments] vertex grid,
 * adding smooth pole caps at the bottom and top rings if requested.
 */
function buildLoftedGridGeometry(
  gridPositions: Float32Array,
  rows: number,
  radialSegments: number,
  capBottom = true,
  capTop = true
): THREE.BufferGeometry {
  const extraVertices = (capBottom ? 1 : 0) + (capTop ? 1 : 0);
  const totalVertices = rows * radialSegments + extraVertices;
  const finalPositions = new Float32Array(totalVertices * 3);
  finalPositions.set(gridPositions, 0);

  let nextVertexIndex = rows * radialSegments;
  let bottomPoleIndex = -1;
  let topPoleIndex = -1;

  if (capBottom) {
    let bx = 0;
    let by = 0;
    let bz = 0;
    for (let c = 0; c < radialSegments; c++) {
      bx += gridPositions[c * 3];
      by += gridPositions[c * 3 + 1];
      bz += gridPositions[c * 3 + 2];
    }
    bottomPoleIndex = nextVertexIndex++;
    finalPositions[bottomPoleIndex * 3] = bx / radialSegments;
    finalPositions[bottomPoleIndex * 3 + 1] = by / radialSegments;
    finalPositions[bottomPoleIndex * 3 + 2] = bz / radialSegments;
  }

  if (capTop) {
    let tx = 0;
    let ty = 0;
    let tz = 0;
    const base = (rows - 1) * radialSegments * 3;
    for (let c = 0; c < radialSegments; c++) {
      tx += gridPositions[base + c * 3];
      ty += gridPositions[base + c * 3 + 1];
      tz += gridPositions[base + c * 3 + 2];
    }
    topPoleIndex = nextVertexIndex++;
    finalPositions[topPoleIndex * 3] = tx / radialSegments;
    finalPositions[topPoleIndex * 3 + 1] = ty / radialSegments;
    finalPositions[topPoleIndex * 3 + 2] = tz / radialSegments;
  }

  const indices: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    const rowA = r * radialSegments;
    const rowB = (r + 1) * radialSegments;
    for (let c = 0; c < radialSegments; c++) {
      const cNext = (c + 1) % radialSegments;
      const a = rowA + c;
      const b = rowA + cNext;
      const d = rowB + c;
      const e = rowB + cNext;
      // Outward counter-clockwise winding when theta goes 0 -> 2pi from +Z toward +X -> -Z -> -X
      indices.push(a, b, e);
      indices.push(a, e, d);
    }
  }

  if (capBottom && bottomPoleIndex >= 0) {
    for (let c = 0; c < radialSegments; c++) {
      const cNext = (c + 1) % radialSegments;
      indices.push(bottomPoleIndex, cNext, c);
    }
  }

  if (capTop && topPoleIndex >= 0) {
    const topRow = (rows - 1) * radialSegments;
    for (let c = 0; c < radialSegments; c++) {
      const cNext = (c + 1) % radialSegments;
      indices.push(topPoleIndex, topRow + c, topRow + cNext);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(finalPositions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * 1. AXIAL BODY MANIFOLD:
 * Continuous, high-resolution sculpture from the pelvic floor/gluteal fold (y = 0.780m)
 * through hips, defined waist, ribcage, feminine bust, sloping shoulders, neck,
 * and featureless oval head crown (y = 1.700m).
 */
function createAxialBodyGeometry(gender: 'female' | 'male' = 'female'): THREE.BufferGeometry {
  const rows = 100;
  const radialSegments = 64;
  const yMin = 0.782;
  const yMax = 1.700;
  const isMale = gender === 'male';

  // Half-width (X radius) profile from pelvis to crown of head
  const rxKeyframes: Array<[number, number]> = isMale
    ? [
        [0.782, 0.058], // Perineal / lower pelvic floor convergence
        [0.805, 0.148], // Sub-gluteal outer thigh/pelvis transition
        [0.840, 0.166], // Lower hip / trochanteric curve
        [0.885, 0.172], // Male hip crest
        [0.940, 0.168], // High hip / iliac
        [0.995, 0.158], // Lower waist
        [1.055, 0.148], // Male waist
        [1.115, 0.156], // Lower ribcage
        [1.175, 0.168], // Mid ribcage
        [1.240, 0.180], // Pectoral / latissimus width
        [1.300, 0.190], // Upper chest
        [1.355, 0.216], // Broad male acromion / shoulder joint span
        [1.380, 0.200], // Upper deltoid / clavicle outer slope
        [1.402, 0.136], // Trapezius slope
        [1.422, 0.072], // Neck-shoulder junction
        [1.445, 0.060], // Lower-mid cylindrical neck
        [1.472, 0.058], // Upper neck
        [1.490, 0.060], // Submental / jawline transition
        [1.515, 0.066], // Lower jaw
        [1.555, 0.074], // Cheekbone / zygomatic arch
        [1.600, 0.076], // Cranial parietal width
        [1.645, 0.069], // Upper cranium
        [1.680, 0.046], // Upper dome taper
        [1.696, 0.018], // Crown apex transition
        [1.700, 0.002], // Exact crown pole at 1.700m
      ]
    : [
        [0.782, 0.055], // Perineal / lower pelvic floor convergence
        [0.805, 0.148], // Sub-gluteal outer thigh/pelvis transition
        [0.840, 0.174], // Lower hip / trochanteric curve
        [0.885, 0.184], // Full hip crest (max female hip width = 0.368m)
        [0.940, 0.175], // High hip / iliac flare
        [0.995, 0.146], // Lower waist taper
        [1.055, 0.125], // Natural defined female waist (width = 0.250m)
        [1.115, 0.133], // Lower ribcage
        [1.175, 0.144], // Inframammary ribcage
        [1.240, 0.153], // Mid-thorax / bust level ribcage width
        [1.300, 0.161], // Upper chest / axillary fold
        [1.355, 0.194], // Acromion / horizontal T-pose shoulder joint span
        [1.380, 0.182], // Upper deltoid / clavicle outer slope
        [1.402, 0.122], // Gently sloping female shoulder / trapezius mid-slope
        [1.422, 0.064], // Neck-shoulder junction (base of neck)
        [1.445, 0.052], // Lower-mid cylindrical neck
        [1.472, 0.050], // Upper neck
        [1.490, 0.054], // Submental / jawline transition
        [1.515, 0.062], // Lower jaw / chin-to-cheek taper
        [1.555, 0.071], // Cheekbone / zygomatic arch (smooth oval)
        [1.600, 0.074], // Cranial parietal width
        [1.645, 0.067], // Upper cranium
        [1.680, 0.045], // Upper dome taper
        [1.696, 0.018], // Crown apex transition
        [1.700, 0.002], // Exact crown pole at 1.700m
      ];

  // Anterior (+Z) radius from spine/body centerline
  const rzFrontKeyframes: Array<[number, number]> = [
    [0.782, 0.042], // Pubic arch / lower pelvis
    [0.815, 0.088], // Mons / lower pelvic front
    [0.880, 0.103], // Lower abdomen / anterior pelvis
    [0.955, 0.105], // Soft female lower abdominal contour
    [1.055, 0.094], // Natural waist anterior plane
    [1.135, 0.098], // Upper epigastric / lower sternum
    [1.175, 0.102], // Inframammary sternum plane
    [1.240, 0.106], // Mid-sternum plane (breasts added smoothly via bilateral lobes)
    [1.320, 0.098], // Upper chest / manubrium
    [1.385, 0.078], // Clavicular notch / collar line
    [1.420, 0.054], // Anterior neck base
    [1.455, 0.051], // Mid-anterior neck (throat)
    [1.482, 0.056], // Submental curve under chin
    [1.498, 0.086], // Smooth rounded chin apex
    [1.535, 0.093], // Lower facial oval profile (featureless)
    [1.580, 0.096], // Mid-upper facial brow oval
    [1.630, 0.091], // Forehead dome
    [1.675, 0.062], // Frontal crown curve
    [1.696, 0.022], // Top dome
    [1.700, 0.002], // Crown pole
  ];

  // Posterior (-Z) radius from body centerline
  const rzBackKeyframes: Array<[number, number]> = [
    [0.782, 0.048], // Lower gluteal fold convergence
    [0.805, 0.098], // Inframammary/infragluteal crease transition
    [0.860, 0.112], // Sacrum / base gluteal pelvis (gluteal domes add smoothly on top)
    [0.940, 0.096], // Upper sacrum / posterior iliac spine
    [1.035, 0.074], // Lumbar lordosis (natural inward curve of lower back)
    [1.120, 0.085], // Lower thoracic back
    [1.230, 0.104], // Mid-thoracic / scapular back plane
    [1.320, 0.100], // Upper scapular / trapezius plane
    [1.385, 0.076], // Cervicothoracic junction
    [1.425, 0.056], // Base of nape
    [1.465, 0.053], // Nape of neck
    [1.510, 0.068], // Lower occiput
    [1.575, 0.095], // Posterior occipital skull curve
    [1.635, 0.088], // Parietal-occipital dome
    [1.678, 0.058], // Upper posterior cranium
    [1.696, 0.020], // Crown apex
    [1.700, 0.002], // Crown pole
  ];

  // Subtle natural S-curve centerline offset in Z (postural balance)
  const zCenterKeyframes: Array<[number, number]> = [
    [0.782, -0.004],
    [0.880, -0.004],
    [1.055, 0.006],  // Gentle lumbar forward sway
    [1.240, -0.005], // Thoracic balance
    [1.365, -0.008], // Aligns shoulder joint centerline with T-pose arm axis
    [1.425, -0.004],
    [1.475, 0.003],
    [1.550, 0.004],
    [1.700, 0.000],
  ];

  const gridPositions = new Float32Array(rows * radialSegments * 3);

  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1);
    const y = yMin + v * (yMax - yMin);

    const baseRx = evalProfile(y, rxKeyframes);
    const baseRzFront = evalProfile(y, rzFrontKeyframes);
    const baseRzBack = evalProfile(y, rzBackKeyframes);
    const zCenter = evalProfile(y, zCenterKeyframes);

    // Superellipse squaring factor: slightly squarer across shoulders and chest, rounder at neck/head/waist
    const shoulderBand = windowBand(y, 1.31, 1.39, 0.03);
    const hipBand = windowBand(y, 0.82, 0.94, 0.04);

    for (let c = 0; c < radialSegments; c++) {
      // theta = 0 at +Z (front), pi/2 at +X (left), pi at -Z (back), 3pi/2 at -X (right)
      const theta = (c / radialSegments) * Math.PI * 2;
      const sinT = Math.sin(theta); // Lateral X direction
      const cosT = Math.cos(theta); // Anterior-posterior Z direction (+1 front, -1 back)

      // Smooth front/back depth interpolation
      const frontWeight = 0.5 + 0.5 * cosT;
      let rz = baseRzBack + (baseRzFront - baseRzBack) * smoothstep(0, 1, frontWeight);
      let rx = baseRx;

      // Subtle anatomical squaring at shoulders and hips
      const superPower = 2.0 + 0.35 * shoulderBand + 0.18 * hipBand;
      const normFactor = Math.pow(
        Math.pow(Math.abs(sinT), superPower) + Math.pow(Math.abs(cosT), superPower),
        -1 / superPower
      );

      let x = rx * sinT * normFactor;
      let z = rz * cosT * normFactor;
      let yOut = y;

      // 1. Chest / Breast or Masculine Pectoral Contours (strictly smooth resin, no nipples)
      if (cosT > 0 && y > 1.14 && y < 1.35) {
        const absSin = Math.abs(sinT);
        if (isMale) {
          // Broad, flatter masculine pectoral plate with crisp sternal cleavage
          const pecLobe =
            gaussian(absSin, 0.50, 0.28) * smootherstep(0.03, 0.16, absSin) * smootherstep(0.96, 0.72, absSin);
          const verticalPec =
            y < 1.245
              ? gaussian(y, 1.245, 0.032)
              : gaussian(y, 1.245, 0.048);
          z += 0.022 * pecLobe * verticalPec * Math.pow(cosT, 0.9);
        } else {
          // Lateral breast dome centered around |sinT| = 0.54 (x ~ +-0.085m), with soft sternum valley at sinT = 0
          const lateralLobe =
            gaussian(absSin, 0.53, 0.24) * smootherstep(0.04, 0.22, absSin) * smootherstep(0.96, 0.72, absSin);
          // Asymmetric vertical teardrop profile: fuller lower pole (y ~ 1.215), gentle upper slope (y ~ 1.24..1.32)
          const verticalBust =
            y < 1.228
              ? gaussian(y, 1.228, 0.034)
              : gaussian(y, 1.228, 0.052);
          const bustProjection = 0.044 * lateralLobe * verticalBust * Math.pow(cosT, 0.85);
          z += bustProjection;
          // Subtle lateral fullness of breast tissue
          x += Math.sign(sinT) * 0.008 * lateralLobe * verticalBust;
          // Very subtle gravity droop at lower pole
          yOut -= 0.004 * lateralLobe * gaussian(y, 1.195, 0.025);
        }
      }

      // 1b. Subtle Tailor Construction Seam Grooves (neck collar, waist, hip, center vertical seam)
      const seamIndent =
        0.0014 *
        (gaussian(y, 1.425, 0.0035) +
          gaussian(y, 1.055, 0.0035) +
          gaussian(y, 0.885, 0.0035) +
          windowBand(y, 0.885, 1.422, 0.01) * gaussian(Math.abs(sinT), 0, 0.018));
      x *= 1 - seamIndent;
      z *= 1 - seamIndent;

      // 2. Subtle Collarbone (Clavicle) Relief across upper anterior chest (y ~ 1.385m)
      if (cosT > 0.15 && y > 1.35 && y < 1.415) {
        const absSin = Math.abs(sinT);
        const clavicleLine = 1.382 + 0.006 * absSin;
        const clavicleBump =
          0.0045 *
          gaussian(y, clavicleLine, 0.009) *
          smootherstep(0.08, 0.25, absSin) *
          (1 - smootherstep(0.75, 0.92, absSin)) *
          cosT;
        z += clavicleBump;
      }

      // 3. Rounded Gluteal Contours & Intergluteal Cleft (Back view, cosT < 0, y in [0.78, 0.96])
      if (cosT < 0 && y > 0.78 && y < 0.97) {
        const backCos = -cosT;
        const absSin = Math.abs(sinT);
        // Bilateral gluteal cheeks centered at |sinT| = 0.44
        const gluteCheek =
          gaussian(absSin, 0.43, 0.27) * smootherstep(0.02, 0.16, absSin);
        const gluteVert =
          y < 0.855
            ? gaussian(y, 0.855, 0.038)
            : gaussian(y, 0.855, 0.052);
        const gluteProj = 0.024 * gluteCheek * gluteVert * Math.pow(backCos, 0.9);
        // Subtle intergluteal cleft along midline (sinT = 0)
        const cleftIndent =
          0.011 *
          gaussian(absSin, 0.0, 0.085) *
          windowBand(y, 0.795, 0.915, 0.025) *
          Math.pow(backCos, 1.4);
        z -= gluteProj - cleftIndent;
      }

      // 4. Subtle Spinal Furrow & Scapular Planes on Back (cosT < 0, y in [0.98, 1.36])
      if (cosT < 0 && y > 0.96 && y < 1.38) {
        const backCos = -cosT;
        const absSin = Math.abs(sinT);
        const spineGroove =
          0.0055 *
          gaussian(absSin, 0.0, 0.09) *
          windowBand(y, 0.98, 1.33, 0.04) *
          Math.pow(backCos, 1.5);
        const scapulaPlane =
          0.005 *
          gaussian(absSin, 0.48, 0.22) *
          gaussian(y, 1.275, 0.055) *
          backCos;
        z -= scapulaPlane - spineGroove;
      }

      // 5. Pelvic Crotch Saddle Arch at Bottom of Torso (y in [0.782, 0.855])
      // Lifts the lateral hip-socket boundary slightly so the thighs emerge cleanly without a flat shelf
      if (y < 0.86) {
        const archWeight = 1 - smootherstep(0.782, 0.855, y);
        const lateralFlare = Math.pow(Math.abs(sinT), 1.6);
        yOut += 0.032 * archWeight * lateralFlare;
      }

      const idx = (r * radialSegments + c) * 3;
      gridPositions[idx] = x;
      gridPositions[idx + 1] = yOut;
      gridPositions[idx + 2] = z + zCenter;
    }
  }

  applyGridTaubinSmoothing(gridPositions, rows, radialSegments, 4, true);
  return buildLoftedGridGeometry(gridPositions, rows, radialSegments, true, true);
}

/**
 * 2. SYMMETRICAL STRAIGHT LEG & BARE FOOT MANIFOLD:
 * Continuous anatomical leg from the hip/pelvic socket (y = 0.855m) down through
 * thigh, knee, calf, and ankle, seamlessly continuing into a bare foot resting flat on the floor (y = 0.000m).
 *
 * @param side +1 for Left Leg (+X), -1 for Right Leg (-X)
 */
function createLegAndFootGeometry(side: 1 | -1, gender: 'female' | 'male' = 'female'): THREE.BufferGeometry {
  const rows = 80;
  const radialSegments = 40;
  const isMale = gender === 'male';
  const hipCenterX = side * (isMale ? 0.098 : 0.095); // Symmetrical hip-width stance
  const thicknessScale = isMale ? 1.07 : 1.0;

  // Leg keyframes from ankle (y = 0.068m) up to hip socket inside pelvis (y = 0.858m)
  const rxKeyframes: Array<[number, number]> = [
    [0.068, 0.036 * thicknessScale], // Ankle joint
    [0.095, 0.035 * thicknessScale], // Slender lower ankle above malleoli
    [0.165, 0.044 * thicknessScale], // Lower calf / Achilles taper
    [0.255, 0.054 * thicknessScale], // Mid-lower calf
    [0.330, 0.058 * thicknessScale], // Gastrocnemius calf belly max width
    [0.405, 0.053 * thicknessScale], // Upper calf below knee
    [0.475, 0.054 * thicknessScale], // Knee joint condyles
    [0.545, 0.061 * thicknessScale], // Lower thigh above knee
    [0.650, 0.074 * thicknessScale], // Mid thigh
    [0.755, 0.084 * (isMale ? 1.02 : 1.0)], // Upper thigh
    [0.815, 0.086 * (isMale ? 0.98 : 1.0)], // Gluteal/trochanteric thigh root
    [0.845, 0.076], // Smoothly tucked inside pelvic socket
    [0.860, 0.052], // Internal pelvic cap
  ];

  const rzFrontKeyframes: Array<[number, number]> = [
    [0.068, 0.044 * thicknessScale], // Anterior ankle / instep root
    [0.095, 0.039 * thicknessScale], // Anterior distal tibia
    [0.200, 0.045 * thicknessScale], // Anterior shin crest
    [0.330, 0.052 * thicknessScale], // Upper shin
    [0.478, 0.058 * thicknessScale], // Patella (kneecap) anterior contour
    [0.550, 0.062 * thicknessScale], // Distal quadriceps
    [0.680, 0.076 * thicknessScale], // Mid-anterior thigh (rectus femoris)
    [0.795, 0.085 * thicknessScale], // Upper anterior thigh
    [0.845, 0.076], // Pelvic blend
    [0.860, 0.052],
  ];

  const rzBackKeyframes: Array<[number, number]> = [
    [0.068, 0.042 * thicknessScale], // Posterior calcaneal/Achilles root
    [0.095, 0.040 * thicknessScale], // Achilles tendon
    [0.180, 0.049 * thicknessScale], // Lower gastrocnemius/soleus
    [0.325, 0.068 * thicknessScale], // Calf muscle belly posterior projection
    [0.420, 0.056 * thicknessScale], // Upper calf
    [0.478, 0.050 * thicknessScale], // Popliteal hollow (back of knee)
    [0.560, 0.063 * thicknessScale], // Distal hamstring
    [0.690, 0.078 * thicknessScale], // Mid-posterior thigh (hamstrings)
    [0.790, 0.088 * thicknessScale], // Sub-gluteal posterior thigh
    [0.845, 0.078], // Gluteal blend
    [0.860, 0.052],
  ];

  // Centerline X offset relative to hipCenterX (subtle natural anatomical axis from hip to ankle)
  const xOffsetKeyframes: Array<[number, number]> = [
    [0.068, 0.000],
    [0.330, side * 0.002],
    [0.478, 0.000],
    [0.720, side * -0.002],
    [0.815, side * -0.003],
    [0.860, side * -0.008],
  ];

  // Centerline Z offset (subtle knee/calf balance)
  const zOffsetKeyframes: Array<[number, number]> = [
    [0.068, -0.006],
    [0.325, -0.008],
    [0.478, 0.000],
    [0.680, 0.003],
    [0.815, -0.004],
    [0.860, -0.004],
  ];

  const gridPositions = new Float32Array(rows * radialSegments * 3);

  // Rows 0..footRows-1: Sculpted Bare Foot (from toe tips curving cleanly into the ankle)
  // Rows footRows..rows-1: Ankle to Upper Thigh/Hip Socket
  const footRows = 22;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < radialSegments; c++) {
      const theta = (c / radialSegments) * Math.PI * 2;
      const sinT = Math.sin(theta); // +1 is +X, so side * sinT > 0 is Lateral (outer), < 0 is Medial (inner)
      const cosT = Math.cos(theta); // +1 is +Z (anterior/toes), -1 is -Z (posterior/heel)
      const latSign = side * sinT;  // +1 outer side of leg/foot, -1 inner side of leg/foot

      if (r < footRows) {
        // Continuous parameter s in [0, 1] from sole/toe center up to ankle collar (y = 0.068m)
        const s = r / footRows;
        // At s = 0: closed plantar sole line; at s = 1: matches ankle ring at y = 0.068m
        const yAnkle = 0.068;

        // Foot plantar + dorsal envelope parameterized smoothly by s and theta
        const ankleRx = 0.036;
        const ankleRzF = 0.044;
        const ankleRzB = 0.042;
        const ankleZCenter = -0.006;

        // Foot longitudinal reach: forward to toes (+0.158m), backward to heel (-0.066m)
        const footFactor = Math.sin(Math.min(1, s * 1.35) * (Math.PI / 2));
        const soleFlatten = smootherstep(0.0, 0.18, s);

        // Forefoot & toe extension in +Z, rounded calcaneus heel in -Z
        const forwardReach =
          cosT >= 0
            ? (0.158 * (1 - smootherstep(0.18, 0.96, s)) + ankleRzF * smootherstep(0.15, 1.0, s)) * footFactor
            : (0.062 * (1 - smootherstep(0.25, 0.95, s)) + ankleRzB * smootherstep(0.15, 1.0, s)) * footFactor;

        // Foot width across ball of foot (wider anteriorly, narrower at heel)
        const forefootWidthBoost =
          cosT > 0
            ? 0.011 * (1 - smootherstep(0.25, 0.88, s)) * Math.pow(cosT, 0.7)
            : -0.004 * (1 - smootherstep(0.3, 0.9, s));
        const currentRx = (ankleRx + forefootWidthBoost) * footFactor;

        // Big toe medial bias & lateral toe taper at the front of the foot
        const toeBiasZ =
          cosT > 0.25
            ? -0.010 * latSign * (1 - smootherstep(0.25, 0.85, s)) * Math.pow(cosT, 1.2)
            : 0;

        const x = hipCenterX + sinT * currentRx;
        const z = ankleZCenter + cosT * forwardReach + toeBiasZ;

        // Vertical height y: flat on the floor (y = 0.000m) for the plantar sole,
        // sloping smoothly up over the toes (y ~ 0.018m), instep arch, and into the ankle (y = 0.068m)
        let y = yAnkle * Math.pow(s, 1.35) * soleFlatten;
        if (cosT > 0 && s > 0.12 && s < 0.92) {
          // Dorsal instep slope
          const instepSlope = 0.014 * Math.sin(s * Math.PI) * Math.pow(cosT, 0.8);
          y = Math.max(0, y - instepSlope * (1 - s));
        }
        // Subtle medial longitudinal arch under the inner mid-foot
        if (latSign < -0.2 && Math.abs(cosT) < 0.55 && s < 0.35) {
          y += 0.004 * (-latSign) * (1 - Math.abs(cosT) / 0.55) * Math.sin((s / 0.35) * Math.PI);
        }

        const idx = (r * radialSegments + c) * 3;
        gridPositions[idx] = x;
        gridPositions[idx + 1] = Math.max(0.0, y);
        gridPositions[idx + 2] = z;
      } else {
        // Ankle (y = 0.068m) to Hip Socket (y = 0.860m)
        const u = (r - footRows) / (rows - 1 - footRows);
        const y = 0.068 + u * (0.860 - 0.068);

        const rx = evalProfile(y, rxKeyframes);
        const rzFront = evalProfile(y, rzFrontKeyframes);
        const rzBack = evalProfile(y, rzBackKeyframes);
        const xOff = evalProfile(y, xOffsetKeyframes);
        const zOff = evalProfile(y, zOffsetKeyframes);

        const frontWeight = 0.5 + 0.5 * cosT;
        const rz = rzBack + (rzFront - rzBack) * smoothstep(0, 1, frontWeight);

        let x = hipCenterX + xOff + rx * sinT;
        let z = zOff + rz * cosT;

        // Anatomical outer thigh / trochanter sweep (latSign > 0) vs smooth inner thigh (latSign < 0)
        if (y > 0.52 && y < 0.85) {
          if (latSign > 0) {
            // Outer thigh blends smoothly into the hip crest at x = +-0.184m
            const outerSweep = 0.010 * smootherstep(0.55, 0.82, y) * (1 - smootherstep(0.83, 0.86, y)) * latSign;
            x += side * outerSweep;
          } else {
            // Soft inner thigh contour without overlapping the opposite leg
            const innerSoftness = 0.004 * gaussian(y, 0.72, 0.08) * (-latSign);
            x -= side * innerSoftness;
          }
        }

        // Subtle ankle malleoli (inner ankle slightly higher at y = 0.084m, outer slightly lower at y = 0.074m)
        if (y > 0.065 && y < 0.11) {
          const malleolusY = latSign < 0 ? 0.084 : 0.075;
          const malleolusBump = 0.0045 * gaussian(y, malleolusY, 0.009) * Math.pow(Math.abs(sinT), 2.0);
          x += side * latSign * malleolusBump;
        }

        // Subtle gastrocnemius medial/lateral contour in calf
        if (y > 0.22 && y < 0.42 && cosT < 0.2) {
          const calfPeakY = latSign > 0 ? 0.340 : 0.315;
          const calfShape = 0.0035 * gaussian(y, calfPeakY, 0.045) * Math.abs(sinT);
          x += side * latSign * calfShape;
        }

        const idx = (r * radialSegments + c) * 3;
        gridPositions[idx] = x;
        gridPositions[idx + 1] = y;
        gridPositions[idx + 2] = z;
      }
    }
  }

  applyGridTaubinSmoothing(gridPositions, rows, radialSegments, 3, true);
  // Ensure bottom sole vertices rest cleanly on y >= 0.000m floor plane
  for (let i = 0; i < rows * radialSegments; i++) {
    if (gridPositions[i * 3 + 1] < 0) {
      gridPositions[i * 3 + 1] = 0;
    }
  }

  return buildLoftedGridGeometry(gridPositions, rows, radialSegments, true, true);
}

/**
 * 3. STRICT HORIZONTAL T-POSE ARM, WRIST & PALM MANIFOLD:
 * Extends strictly horizontally at y = 1.365m (90 degrees to vertical torso axis)
 * from the shoulder socket (|x| = 0.158m) through upper arm, straight elbow, forearm,
 * neutral wrist, and open palm to the metacarpal knuckle line (|x| = 0.768m),
 * with the palm facing downward (-Y).
 *
 * @param side +1 for Left Arm (+X), -1 for Right Arm (-X)
 */
function createHorizontalArmAndPalmGeometry(side: 1 | -1, gender: 'female' | 'male' = 'female'): THREE.BufferGeometry {
  const rows = 56;
  const radialSegments = 32;
  const isMale = gender === 'male';
  const armThick = isMale ? 1.12 : 1.0;
  const xStart = 0.135; // Tucked smoothly inside shoulder deltoid socket
  const xEnd = 0.768;   // Distal metacarpal head (knuckle line where fingers emerge)
  const armAxisY = 1.352;
  const armAxisZ = -0.008;

  // Vertical half-thickness (Y radius) along the horizontal arm
  const ryKeyframes: Array<[number, number]> = [
    [0.135, 0.030 * armThick], // Internal shoulder socket cap
    [0.175, 0.042 * armThick], // Deltoid root / axillary depth
    [0.220, 0.043 * armThick], // Mid deltoid cap
    [0.275, 0.041 * armThick], // Deltoid tuberosity / upper arm
    [0.355, 0.038 * armThick], // Mid biceps/triceps vertical radius
    [0.445, 0.034 * armThick], // Straight elbow joint vertical thickness
    [0.505, 0.036 * armThick], // Proximal forearm muscle belly
    [0.595, 0.029 * armThick], // Mid forearm taper
    [0.678, 0.018 * armThick], // Neutral wrist vertical thickness (flattened oval)
    [0.715, 0.016], // Proximal palm / carpal thickness
    [0.750, 0.013], // Mid metacarpal palm thickness
    [0.768, 0.010], // Distal knuckle line thickness
  ];

  // Horizontal anterior-posterior half-width (Z radius) along the horizontal arm
  const rzKeyframes: Array<[number, number]> = [
    [0.135, 0.034 * armThick], // Internal shoulder socket
    [0.175, 0.046 * armThick], // Shoulder joint breadth
    [0.225, 0.046 * armThick], // Deltoid breadth
    [0.350, 0.042 * armThick], // Upper arm breadth
    [0.448, 0.041 * armThick], // Elbow epicondyle breadth
    [0.510, 0.042 * armThick], // Forearm brachioradialis breadth
    [0.600, 0.034 * armThick], // Mid-distal forearm
    [0.678, 0.028 * armThick], // Neutral wrist breadth (wider in Z than Y, palm facing down)
    [0.715, 0.038], // Palm base flare (thenar/hypothenar eminence)
    [0.748, 0.041], // Full open palm width across metacarpals
    [0.768, 0.039], // Knuckle line across the 4 fingers
  ];

  const gridPositions = new Float32Array(rows * radialSegments * 3);

  for (let r = 0; r < rows; r++) {
    const t = r / (rows - 1);
    const u = xStart + t * (xEnd - xStart); // Distance from body midline along horizontal arm

    const ry = evalProfile(u, ryKeyframes);
    const rz = evalProfile(u, rzKeyframes);

    const deltoidLift = 0;
    // Palm arch (u > 0.68): dorsal surface (+Y) slightly arched, palmar surface (-Y) softly hollowed
    const isPalm = smootherstep(0.675, 0.710, u);

    for (let c = 0; c < radialSegments; c++) {
      const phi = (c / radialSegments) * Math.PI * 2;
      // Define cross-section so outward normal points radially away from the arm axis:
      // For side = +1 (+X): y = sin(phi), z = cos(phi)
      // For side = -1 (-X): y = sin(phi), z = -cos(phi) (maintains outward CCW winding!)
      const sinP = Math.sin(phi); // +1 is +Y (dorsal/top), -1 is -Y (palmar/bottom)
      const cosP = side * Math.cos(phi); // +1 is +Z (anterior/thumb side), -1 is -Z (posterior/pinky side)

      // Flatten palm cross-section into an anatomical hand pad
      const superP = 2.0 + 0.55 * isPalm;
      const norm = Math.pow(
        Math.pow(Math.abs(sinP), superP) + Math.pow(Math.abs(cosP), superP),
        -1 / superP
      );

      let localY = ry * sinP * norm + deltoidLift * Math.max(0, sinP);
      let localZ = rz * cosP * norm;

      // Palmar hollow underneath (-Y) & thenar thumb pad (+Z, -Y) when palm faces downward
      if (isPalm > 0) {
        if (sinP < 0) {
          // Soft palmar concavity in center of underside
          const centerPalm = gaussian(cosP, 0.0, 0.45);
          localY += 0.0035 * isPalm * centerPalm * (-sinP);
          // Thenar eminence pad on anterior (+Z) underside
          const thenarPad = gaussian(cosP, 0.55, 0.28) * gaussian(u, 0.718, 0.020);
          localY -= 0.004 * thenarPad * (-sinP);
        }
        // Slight anterior bias for thumb base at u ~ 0.715
        if (cosP > 0) {
          localZ += 0.004 * gaussian(u, 0.715, 0.022) * Math.pow(cosP, 1.5);
        }
      }

      const idx = (r * radialSegments + c) * 3;
      gridPositions[idx] = side * u;
      gridPositions[idx + 1] = armAxisY + localY;
      gridPositions[idx + 2] = armAxisZ + localZ;
    }
  }

  applyGridTaubinSmoothing(gridPositions, rows, radialSegments, 3, true);
  return buildLoftedGridGeometry(gridPositions, rows, radialSegments, true, true);
}

/**
 * 4. EXTENDED HORIZONTAL FINGERS & THUMB:
 * Creates an individual smoothly sculpted finger or thumb extending horizontally
 * with the palm facing downward (-Y).
 */
function createFingerGeometry(
  side: 1 | -1,
  uStart: number,
  uEnd: number,
  zStart: number,
  zEnd: number,
  yStart: number,
  yEnd: number,
  baseRadiusZ: number,
  baseRadiusY: number
): THREE.BufferGeometry {
  const rows = 14;
  const radialSegments = 14;
  const gridPositions = new Float32Array(rows * radialSegments * 3);

  for (let r = 0; r < rows; r++) {
    const s = r / (rows - 1);
    const u = uStart + s * (uEnd - uStart);
    const yCenter = yStart + s * (yEnd - yStart);
    const zCenter = zStart + s * (zEnd - zStart);

    // Smooth phalangeal taper to rounded fingertip
    const tipRoundedTaper =
      s < 0.82
        ? 1.0 - 0.22 * s
        : 0.82 * Math.sqrt(Math.max(0.002, 1 - Math.pow((s - 0.82) / 0.18, 2)));

    // Subtle PIP/DIP knuckle articulation
    const knuckleSwell = 1.0 + 0.04 * gaussian(s, 0.36, 0.08) + 0.025 * gaussian(s, 0.68, 0.07);
    const rz = baseRadiusZ * tipRoundedTaper * knuckleSwell;
    const ry = baseRadiusY * tipRoundedTaper * knuckleSwell;

    for (let c = 0; c < radialSegments; c++) {
      const phi = (c / radialSegments) * Math.PI * 2;
      const sinP = Math.sin(phi); // +1 top (+Y), -1 bottom/pad (-Y)
      const cosP = side * Math.cos(phi);

      // Slightly flatter dorsal nailbed/top, softly rounded volar finger pad underneath (-Y)
      const yScale = sinP > 0 ? 0.92 : 1.06;

      const idx = (r * radialSegments + c) * 3;
      gridPositions[idx] = side * u;
      gridPositions[idx + 1] = yCenter + ry * sinP * yScale;
      gridPositions[idx + 2] = zCenter + rz * cosP;
    }
  }

  applyGridTaubinSmoothing(gridPositions, rows, radialSegments, 2, true);
  return buildLoftedGridGeometry(gridPositions, rows, radialSegments, true, true);
}

/**
 * Builds the complete, symmetrical adult mannequin (female or male) in a strict 90-degree horizontal T-pose,
 * applying the shared #C9AB84 resin material uniformly to all anatomical parts, scaling to 1.75m height,
 * and centering its Box3 at (x = 0, z = 0) with feet at y = 0.000m.
 */
export function buildMannequinGroup(
  gender: 'female' | 'male',
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = gender === 'male' ? 'MaleMannequinTPose' : 'FemaleMannequinTPose';

  // 1. Axial body (pelvis, hips, waist, bust/chest, shoulders, neck, featureless oval head)
  const axialGeo = createAxialBodyGeometry(gender);
  const axialMesh = new THREE.Mesh(axialGeo, material);
  axialMesh.name = 'AxialBody_HeadNeckTorsoPelvis';
  axialMesh.castShadow = true;
  axialMesh.receiveShadow = true;
  group.add(axialMesh);

  // 2. Left and Right Legs + Bare Feet (symmetrical, straight, flat on y = 0.000m floor)
  for (const side of [1, -1] as const) {
    const legGeo = createLegAndFootGeometry(side, gender);
    const legMesh = new THREE.Mesh(legGeo, material);
    legMesh.name = side === 1 ? 'LeftLegAndFoot' : 'RightLegAndFoot';
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);
  }

  // 3. Left and Right Horizontal T-Pose Arms, Wrists, Palms & 5 Extended Fingers
  const armAxisY = 1.352;
  const armAxisZ = -0.008;

  // Four extended fingers (Index, Middle, Ring, Little) naturally extended together, palms down
  const fingerSpecs = [
    { name: 'Index', zOff: 0.027, uEnd: 0.846, rz: 0.0082, ry: 0.0074 },
    { name: 'Middle', zOff: 0.009, uEnd: 0.855, rz: 0.0086, ry: 0.0078 },
    { name: 'Ring', zOff: -0.009, uEnd: 0.844, rz: 0.0080, ry: 0.0072 },
    { name: 'Little', zOff: -0.026, uEnd: 0.825, rz: 0.0072, ry: 0.0065 },
  ];

  for (const side of [1, -1] as const) {
    const armGeo = createHorizontalArmAndPalmGeometry(side, gender);
    const armMesh = new THREE.Mesh(armGeo, material);
    armMesh.name = side === 1 ? 'LeftArmAndPalm' : 'RightArmAndPalm';
    armMesh.castShadow = true;
    armMesh.receiveShadow = true;
    group.add(armMesh);

    for (const f of fingerSpecs) {
      const fGeo = createFingerGeometry(
        side,
        0.756,
        f.uEnd,
        armAxisZ + f.zOff,
        armAxisZ + f.zOff * 1.03,
        armAxisY - 0.001,
        armAxisY - 0.002,
        f.rz,
        f.ry
      );
      const fMesh = new THREE.Mesh(fGeo, material);
      fMesh.name = `${side === 1 ? 'Left' : 'Right'}Finger_${f.name}`;
      fMesh.castShadow = true;
      fMesh.receiveShadow = true;
      group.add(fMesh);
    }

    // Thumb emerging naturally from anterior (+Z) palm base, angled slightly alongside index
    const thumbGeo = createFingerGeometry(
      side,
      0.705,
      0.782,
      armAxisZ + 0.026,
      armAxisZ + 0.048,
      armAxisY - 0.005,
      armAxisY - 0.006,
      0.0096,
      0.0086
    );
    const thumbMesh = new THREE.Mesh(thumbGeo, material);
    thumbMesh.name = `${side === 1 ? 'Left' : 'Right'}Thumb`;
    thumbMesh.castShadow = true;
    thumbMesh.receiveShadow = true;
    group.add(thumbMesh);
  }

  // Scale to 1.75m height and center Box3 on vertical rotation axis (x = 0, z = 0, min.y = 0)
  const heightScale = 1.75 / 1.70;
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry.scale(heightScale, heightScale, heightScale);
    }
  });

  const box = new THREE.Box3().setFromObject(group);
  const center = box.getCenter(new THREE.Vector3());
  const offsetX = -center.x;
  const offsetY = -box.min.y;
  const offsetZ = -center.z;

  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.geometry.translate(offsetX, offsetY, offsetZ);
      mesh.geometry.computeBoundingBox();
      mesh.geometry.computeBoundingSphere();
    }
  });

  return group;
}

export function buildFemaleMannequinGroup(material: THREE.Material): THREE.Group {
  return buildMannequinGroup('female', material);
}

export function buildMaleMannequinGroup(material: THREE.Material): THREE.Group {
  return buildMannequinGroup('male', material);
}

export const FEMALE_MANNEQUIN_METRICS = {
  totalHeight: 1.75,
  floorY: 0.00,
  crownY: 1.75,
  armElevationY: 1.405,
  armSpanWidth: 1.76,
  hipSpacingX: 0.195,
  torsoArmAngleDegrees: 90,
} as const;
