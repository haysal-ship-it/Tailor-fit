/**
 * bake-mannequin-mesh.cjs
 * 
 * Offline baking pipeline for female and male 3D mannequin meshes.
 * Generates continuous Marching Cubes implicit geometry, welds vertices,
 * performs Laplacian smoothing, and exports optimized binary GLB assets
 * to public/assets/reconstruction/{female,male}-mannequin.glb.
 * 
 * This eliminates the 5-10s CPU block during runtime browser page load.
 */

const fs = require('node:fs');
const path = require('node:path');

// Polyfill FileReader for Three.js GLTFExporter in Node.js
class FileReaderPolyfill {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      if (typeof this.onloadend === 'function') this.onloadend();
    });
  }
}
globalThis.FileReader = FileReaderPolyfill;

async function runBake() {
  const THREE = await import('three');
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const { MarchingCubes } = await import('three/examples/jsm/objects/MarchingCubes.js');
  const { mergeVertices } = await import('three/examples/jsm/utils/BufferGeometryUtils.js');

  const silhouettesPath = path.resolve(__dirname, '../lib/mannequin/reference-silhouettes.json');
  const silhouettes = JSON.parse(fs.readFileSync(silhouettesPath, 'utf8'));

  const REFERENCE_SCALE = 1.75 / 660;
  const clamp = THREE.MathUtils.clamp;

  const smoothMin = (a, b, k) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  };

  const smoothMax = (a, b, k) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.max(a, b) + h * h * k * 0.25;
  };

  function profile(points, x) {
    let i = 0;
    while (i < points.length - 2 && x > points[i + 1][0]) i++;
    const a = points[i];
    const b = points[i + 1];
    const t = clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
    const before = points[Math.max(0, i - 1)];
    const after = points[Math.min(points.length - 1, i + 2)];
    const m0 = (b[1] - before[1]) / (b[0] - before[0]);
    const m1 = (after[1] - a[1]) / (after[0] - a[0]);
    return (
      (2 * t * t * t - 3 * t * t + 1) * a[1] +
      (t * t * t - 2 * t * t + t) * m0 * (b[0] - a[0]) +
      (-2 * t * t * t + 3 * t * t) * b[1] +
      (t * t * t - t * t) * m1 * (b[0] - a[0])
    );
  }

  function generateGeometry(gender) {
    console.log(`\nGenerating geometry for ${gender}...`);
    const startTime = performance.now();
    const source = silhouettes[gender];
    const female = gender === 'female';
    const resolution = 192;
    const surface = new THREE.MeshBasicMaterial();
    const volume = new MarchingCubes(resolution, surface, false, false, 260000);
    volume.isolation = 0;

    const bodyWidths = female
      ? [
          [54, 1], [63, 18], [80, 28], [105, 28], [128, 21], [139, 18],
          [151, 21], [161, 39], [172, 57], [191, 59], [211, 55], [235, 52],
          [265, 48], [295, 45], [314, 49], [345, 62], [370, 67], [386, 55], [400, 1]
        ]
      : [
          [54, 1], [63, 18], [80, 29], [105, 29], [128, 22], [139, 20],
          [151, 25], [161, 44], [175, 65], [197, 65], [225, 61], [260, 57],
          [295, 55], [320, 60], [350, 63], [375, 59], [393, 42], [400, 1]
        ];

    function rowBounds(y, side) {
      let lo = 0, hi = 0, count = 0;
      for (let d = -3; d <= 3; d++) {
        const spans = (side ? source.left.rows : source.front.rows)[clamp(Math.round(y + d), 0, 729)];
        const valid = spans.filter((s) => s[1] - s[0] > 9 && s[0] < 440 && s[1] > 200);
        if (valid.length) {
          lo += valid[0][0];
          hi += valid[valid.length - 1][1];
          count++;
        }
      }
      return count ? [lo / count, hi / count] : [317, 319];
    }

    const rows = Array.from({ length: resolution }, (_, iy) => {
      const row = 745 - (iy / resolution) * 760;
      const [front, back] = rowBounds(clamp(row, 56, 710), true);
      const [left, right] = rowBounds(clamp(row, 350, 710), false);
      const [bodyLeft, bodyRight] = rowBounds(clamp(row, 56, 390), false);
      const spans = source.front.rows[clamp(Math.round(row), 350, 710)];
      const leftSpan = spans.find((s) => s[0] < 310 && s[1] - s[0] > 9);
      const inner = leftSpan && leftSpan[1] < 318 ? leftSpan[1] : 316;
      const legOuter = Math.min(left, 636 - right);
      return {
        row,
        cz: 318 - (front + back) / 2,
        rz: Math.max(2, (back - front) / 2),
        rx: Math.max(1, row < 153 || (row > 220 && row < 375) ? (bodyRight - bodyLeft) / 2 : profile(bodyWidths, row)),
        legCenter: (legOuter + inner) / 2 - 318,
        legRadius: Math.max(2, (inner - legOuter) / 2),
      };
    });

    const arms = Array.from({ length: resolution }, (_, ix) => {
      const x = -330 + (ix / resolution) * 660;
      const column = Math.round(318 + Math.abs(x));
      const spans = [-2, -1, 0, 1, 2]
        .map((d) => source.front.columns[clamp(column + d, 0, 635)])
        .filter((v) => !!v);
      const top = spans.length ? spans.reduce((a, b) => a + b[0], 0) / spans.length : 200;
      const bottom = spans.length ? Math.min(235, spans.reduce((a, b) => a + Math.min(235, b[1]), 0) / spans.length) : 202;
      return { x, cy: (top + bottom) / 2, ry: Math.max(2, (bottom - top) / 2) };
    });

    for (let iz = 0; iz < resolution; iz++) {
      const z = -115 + (iz / resolution) * 230;
      for (let iy = 0; iy < resolution; iy++) {
        const r = rows[iy];
        const row = r.row;
        for (let ix = 0; ix < resolution; ix++) {
          const arm = arms[ix];
          const x = arm.x;
          let center = r.cz;
          let depth = r.rz;
          let width = r.rx;

          if (row < 90) {
            const blend = 1 - THREE.MathUtils.smoothstep(row, 72, 90);
            const cap = Math.sqrt(Math.max(0.001, 1 - Math.pow((row - 89) / 35, 2)));
            width = THREE.MathUtils.lerp(width, (female ? 29 : 30) * cap, blend);
            depth = THREE.MathUtils.lerp(depth, 38 * cap, blend);
            center = THREE.MathUtils.lerp(center, 0, blend);
          }

          if (female && z > center) {
            depth *= 1 - 0.27 * Math.exp(-Math.pow((row - 225) / 29, 2));
          }

          if (z > center) {
            depth *= 1 - 0.22 * THREE.MathUtils.smoothstep(row, 375, 400);
          } else {
            depth *= 1 - 0.08 * THREE.MathUtils.smoothstep(row, 385, 402);
          }

          let body = (Math.hypot(x / width, (z - center) / depth) - 1) * Math.min(width, depth);
          body = Math.max(body, 54 - row, row - 400);

          if (female && row > 185 && row < 264) {
            const dy = row < 228 ? (row - 228) / 30 : (row - 228) / 18;
            const breast = (Math.hypot((Math.abs(x) - 26) / 22.5, dy, (z - 26) / 21) - 1) * 21;
            body = smoothMin(body, breast, 6.5);
          }

          let legs = 1000;
          if (row > 333) {
            const blend = clamp((row - 325) / 48, 0, 1);
            const taper = 0.15 + 0.85 * blend * blend * (3 - 2 * blend);
            const rootDepth = 0.83 + 0.17 * THREE.MathUtils.smoothstep(row, 380, 430);
            let legRx = r.legRadius * taper;
            let legRz = r.rz * taper * rootDepth;

            const u = Math.abs(x);
            const uLegCenter = -r.legCenter; // ~42..44

            if (row <= 660) {
              const leg = (Math.hypot((u - uLegCenter) / legRx, (z - r.cz) / legRz) - 1) * Math.min(legRx, legRz);
              legs = Math.max(leg, 345 - row, row - 714);
            } else {
              // 1. Ankle slenderization (rows 660-675) with Achilles tendon inward curve
              const ankleBlend = Math.exp(-Math.pow((row - 666) / 11, 2));
              legRx *= 1.0 - 0.11 * ankleBlend;
              legRz *= 1.0 - 0.06 * ankleBlend;

              // Posterior Achilles tendon inward curve (z < r.cz)
              let effZ = z;
              const dz = z - r.cz;
              if (dz < 0) {
                const achillesT = Math.exp(-Math.pow((row - 663) / 12, 2));
                effZ += 3.2 * achillesT * clamp(-dz / Math.max(1, legRz), 0, 1);
              }

              // 4. Stance rotation (~6 degrees outward toe splay for row > 665)
              const footProgress = clamp((row - 660) / 45, 0, 1);
              const stanceAngle = (6.0 * Math.PI / 180) * footProgress; // ~6 degrees
              const cosA = Math.cos(stanceAngle);
              const sinA = Math.sin(stanceAngle);

              // Local foot coordinates relative to ankle pivot (uLegCenter, r.cz)
              const du = u - uLegCenter;
              const effDz = effZ - r.cz;

              const uRot = du * cosA - effDz * sinA;
              const zRot = du * sinA + effDz * cosA;

              // 2. Heel contour extending posteriorly to z ~ -37
              let footRz = legRz;
              if (row > 675) {
                const heelTargetRz = r.cz - (-37.0);
                if (zRot < 0 && heelTargetRz > footRz) {
                  const heelBlend = clamp((row - 675) / 20, 0, 1) * (1 - clamp((row - 708) / 6, 0, 1));
                  footRz = THREE.MathUtils.lerp(footRz, heelTargetRz, heelBlend);
                }
              }

              // 4. Toe wedge extending anteriorly to z ~ +45..+52
              let footRx = legRx;
              if (row > 675) {
                const toeT = clamp((row - 675) / 30, 0, 1);
                footRx *= 1.0 + 0.14 * toeT;
              }

              let footDist = (Math.hypot(uRot / footRx, zRot / footRz) - 1) * Math.min(footRx, footRz);

              // Toe box boundary: great toe at z ~ +51.5, lateral pinky toe at z ~ +46
              if (row > 685 && effDz > 20) {
                const toeCapZ = 51.5 - 0.25 * Math.max(0, uRot + 4);
                const toeOver = effZ - toeCapZ;
                if (toeOver > 0) {
                  footDist = Math.max(footDist, toeOver * 1.5);
                }
              }

              // 3. Medial arch elevation (lifting off the ground on the inner side abs(x) < 45 between row 685 and 708)
              let archLift = 0;
              if (u < 45 && effZ > -15 && effZ < 25) {
                const tZ = Math.exp(-Math.pow((effZ - 3) / 13, 2));
                const tX = clamp((45 - u) / 12, 0, 1);
                archLift = 14.0 * tZ * tX;
              }

              // 5. Ground contact plane at row 714 without sharp planar shearing
              const floorDist = row - 714 + archLift;
              const groundedFoot = smoothMax(footDist, floorDist, 2.4);

              legs = Math.max(groundedFoot, 345 - row);
            }
          }

          const depthFactor = THREE.MathUtils.lerp(0.90, 0.65, THREE.MathUtils.smoothstep(Math.abs(x), 215, 245));
          const armDepth = arm.ry * depthFactor;
          let limb = (Math.hypot((row - arm.cy) / arm.ry, (z + 3) / armDepth) - 1) * Math.min(arm.ry, armDepth);
          limb = Math.max(limb, 45 - Math.abs(x), Math.abs(x) - 248);

          // Refined anatomical hand geometry: wrist-to-palm flow, 4 tapered fingers, opposable thumb
          if (Math.abs(x) > 224 && row > 175 && row < 232) {
            const u = Math.abs(x);
            // 1. Tapered palm capsule between u = 238 (wrist width ~18px) and u = 266 (palm widening to ~29px)
            const nearestPalmU = clamp(u, 238, 266);
            const tPalm = (nearestPalmU - 238) / 28;
            const palmRow = THREE.MathUtils.lerp(202.0, 203.5, tPalm);
            const palmZ = THREE.MathUtils.lerp(-1.0, -1.5, tPalm);
            const palmRy = THREE.MathUtils.lerp(8.0, 6.6, tPalm);
            const palmRz = THREE.MathUtils.lerp(9.0, 14.5, tPalm);
            const dPalm = (Math.hypot((u - nearestPalmU) / 6.0, (row - palmRow) / palmRy, (z - palmZ) / palmRz) - 1) * palmRy;

            // 2. 4 distinct tapered fingers: knuckle rows [202..206], reaches [283, 292, 294, 287], centerZ [-12..+9]
            let dFingers = 1000;
            const fingertips = [283, 292, 294, 287];
            const knuckleRows = [206, 204, 202, 203.5];
            const knuckleZ = [-12, -5, 2, 9];
            const uKnuckle = 266;

            for (let f = 0; f < 4; f++) {
              const tip = fingertips[f];
              const centerZ = knuckleZ[f];
              const rowK = knuckleRows[f];
              const nearestF = clamp(u, uKnuckle, tip);
              const fingerT = clamp((nearestF - uKnuckle) / (tip - uKnuckle), 0, 1);
              const radX = THREE.MathUtils.lerp(3.6, 2.4, fingerT);
              const radY = THREE.MathUtils.lerp(3.3, 2.3, fingerT);
              const radZ = THREE.MathUtils.lerp(3.6, 2.4, fingerT);
              const dFinger = (Math.hypot((u - nearestF) / radX, (row - rowK) / radY, (z - centerZ) / radZ) - 1) * Math.min(radY, radZ);
              dFingers = f === 0 ? dFinger : smoothMin(dFingers, dFinger, 1.2);
            }

            // 3. Opposable thumb from base (row 208, u 248) to tip (row 217, u 264) with clean web space
            const thAx = 248, thAy = 208, thAz = 8.5;
            const thBx = 264, thBy = 217, thBz = 13.5;
            const abX = thBx - thAx, abY = thBy - thAy, abZ = thBz - thAz;
            const abLenSq = abX * abX + abY * abY + abZ * abZ;
            const thumbT = clamp(((u - thAx) * abX + (row - thAy) * abY + (z - thAz) * abZ) / abLenSq, 0, 1);
            const tX = thAx + abX * thumbT;
            const tY = thAy + abY * thumbT;
            const tZ = thAz + abZ * thumbT;
            const thumbRad = THREE.MathUtils.lerp(4.2, 2.8, thumbT);
            const dThumb = Math.hypot(u - tX, row - tY, z - tZ) - thumbRad;

            // Merge hand structures and blend into forearm without step discontinuities
            let hand = smoothMin(dPalm, dFingers, 2.2);
            hand = smoothMin(hand, dThumb, 2.8);
            limb = smoothMin(limb, hand, 3.5);
          }

          const kArm = row < 185 ? 9.0 : THREE.MathUtils.lerp(9.0, 3.5, THREE.MathUtils.smoothstep(row, 185, 205));
          const distance = smoothMin(smoothMin(body, legs, 4), limb, kArm);
          volume.field[iz * resolution * resolution + iy * resolution + ix] = -distance;
        }
      }
    }

    volume.update();
    const geometry = new THREE.BufferGeometry();
    const count = volume.geometry.drawRange.count;
    geometry.setAttribute('position', new THREE.BufferAttribute((volume.geometry.getAttribute('position').array).slice(0, count * 3), 3));
    geometry.scale(330 * REFERENCE_SCALE, 380 * REFERENCE_SCALE, 115 * REFERENCE_SCALE);
    geometry.translate(0, 350 * REFERENCE_SCALE, 0);
    volume.geometry.dispose();

    const welded = mergeVertices(geometry, 0.00001);
    geometry.dispose();
    const positions = welded.getAttribute('position');
    const index = welded.getIndex();
    const neighbours = Array.from({ length: positions.count }, () => new Set());
    for (let i = 0; i < index.count; i += 3) {
      const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
      neighbours[a].add(b).add(c);
      neighbours[b].add(a).add(c);
      neighbours[c].add(a).add(b);
    }
    const next = new Float32Array(positions.array.length);
    for (let pass = 0; pass < 10; pass++) {
      const weight = pass % 2 === 0 ? 0.45 : -0.47;
      for (let i = 0; i < positions.count; i++) {
        const adjacent = neighbours[i];
        for (let axis = 0; axis < 3; axis++) {
          let sum = 0;
          adjacent.forEach((j) => (sum += positions.array[j * 3 + axis]));
          const current = positions.array[i * 3 + axis];
          next[i * 3 + axis] = current + weight * (sum / Math.max(1, adjacent.size) - current);
        }
      }
      positions.array.set(next);
    }
    welded.computeVertexNormals();
    welded.computeBoundingBox();
    welded.computeBoundingSphere();

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    const box = welded.boundingBox;
    const size = box.getSize(new THREE.Vector3());
    console.log(`Geometry built in ${elapsed}s:`);
    console.log(`- Dimensions: X=${size.x.toFixed(3)}m, Y=${size.y.toFixed(3)}m, Z=${size.z.toFixed(3)}m`);
    console.log(`- Triangles: ${index.count / 3}, Vertices: ${positions.count}`);
    return welded;
  }

  function exportGLB(mesh, outputPath) {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        mesh,
        (glbBuffer) => {
          const buffer = Buffer.from(glbBuffer);
          fs.writeFileSync(outputPath, buffer);
          console.log(`Saved GLB: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
          resolve();
        },
        (error) => reject(error),
        { binary: true }
      );
    });
  }

  const outDir = path.resolve(__dirname, '../public/assets/reconstruction');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const gender of ['female', 'male']) {
    const geom = generateGeometry(gender);
    const mat = new THREE.MeshStandardMaterial({ color: '#c9ab84', roughness: 0.9 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = `${gender}-mannequin`;
    const outPath = path.join(outDir, `${gender}-mannequin.glb`);
    await exportGLB(mesh, outPath);
  }
  console.log('\nAll mannequin GLB assets baked successfully.');
}

runBake().catch((err) => {
  console.error('Error during baking:', err);
  process.exit(1);
});
