import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import silhouettes from './reference-silhouettes.json';
import { REFERENCE_SCALE, clamp, profile, smoothMin } from './geometry/common';
import { evaluateTorsoHeadSDF, buildSmoothedSilhouetteTable } from './geometry/torso-head-sdf';
import { evaluateArmHandSDF } from './geometry/arm-hand-sdf';
import { evaluateFootSDF } from './geometry/foot-sdf';

export { REFERENCE_SCALE };

const geometryCache = new Map<string, THREE.BufferGeometry>();

function wrapGeometry(gender: string, geometry: THREE.BufferGeometry, material: THREE.Material) {
  const group = new THREE.Group();
  group.name = `${gender}-reference-reconstruction`;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'ContinuousReferenceBody';
  group.add(mesh);
  return group;
}

/** Continuous implicit surface fitted to orthographic references, in image coordinates.
 * Integrates modular SDF evaluators for Torso/Bust/Head, Deltoid/Arm/Hand, and Ankle/Foot/Toes.
 */
export function buildReferenceMannequin(gender: 'female' | 'male', material?: THREE.Material) {
  const source = silhouettes[gender];
  const female = gender === 'female';
  const surface = material ?? new THREE.MeshStandardMaterial({ color: '#b09576', roughness: 0.72, metalness: 0.0 });
  const cached = geometryCache.get(gender);
  if (cached) return wrapGeometry(gender, cached.clone(), surface);

  const resolution = 192;
  const volume = new MarchingCubes(resolution, surface, false, false, 260000);
  volume.isolation = 0;

  const bodyWidths = female
    ? [[54,1],[63,18],[80,28],[105,28],[128,21],[139,18],[151,21],[161,39],[172,57],[191,59],[211,55],[235,52],[265,48],[295,45],[314,49],[345,62],[370,67],[386,55],[400,1]]
    : [[54,1],[63,18],[80,29],[105,29],[128,22],[139,20],[151,25],[161,44],[175,65],[197,65],[225,61],[260,57],[295,55],[320,60],[350,63],[375,59],[393,42],[400,1]];

  // Pre-smoothed Gaussian lookup tables over 15 rows eliminate horizontal Marching Cubes terracing
  const frontTable = buildSmoothedSilhouetteTable(source.front.rows, 730, 7);
  const sideTable = buildSmoothedSilhouetteTable(source.left.rows, 730, 7);

  function rowBounds(y: number, side: boolean): [number, number] {
    const rowIdx = clamp(Math.round(y), 0, 729);
    return side ? sideTable[rowIdx] : frontTable[rowIdx];
  }

  const rows = Array.from({ length: resolution }, (_, iy) => {
    const row = 745 - (iy / resolution) * 760;
    const [front, back] = rowBounds(clamp(row, 56, 710), true);
    const [left, right] = rowBounds(clamp(row, 350, 710), false);
    const [bodyLeft, bodyRight] = rowBounds(clamp(row, 56, 390), false);
    const spans = source.front.rows[clamp(Math.round(row), 350, 710)];
    const leftSpan = spans.find((s: number[]) => s[0] < 310 && s[1] - s[0] > 9);
    const inner = leftSpan && leftSpan[1] < 318 ? leftSpan[1] : 316;
    const legOuter = Math.min(left, 636 - right);

    return {
      row,
      cz: 318 - (front + back) / 2,
      rz: Math.max(2, (back - front) / 2),
      rx: Math.max(
        1,
        row < 153 || (row > 220 && row < 375)
          ? (bodyRight - bodyLeft) / 2
          : profile(bodyWidths, row)
      ),
      legCenter: (legOuter + inner) / 2 - 318,
      legRadius: Math.max(2, (inner - legOuter) / 2),
    };
  });

  const arms = Array.from({ length: resolution }, (_, ix) => {
    const x = -330 + (ix / resolution) * 660;
    const column = Math.round(318 + Math.abs(x));
    const spans = [-2, -1, 0, 1, 2]
      .map((d) => source.front.columns[clamp(column + d, 0, 635)])
      .filter((v): v is number[] => !!v);
    const top = spans.length ? spans.reduce((a, b) => a + b[0], 0) / spans.length : 200;
    const bottom = spans.length
      ? Math.min(235, spans.reduce((a, b) => a + Math.min(235, b[1]), 0) / spans.length)
      : 202;
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

        // 1. Torso, Bust, Head, Trapezius, and Glutes evaluated via dedicated anatomical SDF
        const body = evaluateTorsoHeadSDF(x, z, row, r, female);

        // 2. Legs, Ankle, Calcaneus Heel, Instep, and 5 Toes
        let legs = 1000;
        if (row > 333) {
          const blend = clamp((row - 325) / 48, 0, 1);
          const taper = 0.15 + 0.85 * blend * blend * (3 - 2 * blend);
          const rootDepth = 0.83 + 0.17 * THREE.MathUtils.smoothstep(row, 380, 430);
          const legRx = r.legRadius * taper;
          const legRz = r.rz * taper * rootDepth;

          const u = Math.abs(x);
          const uLegCenter = -r.legCenter; // ~42..44

          if (row <= 660) {
            const leg = (Math.hypot((u - uLegCenter) / legRx, (z - r.cz) / legRz) - 1) * Math.min(legRx, legRz);
            legs = Math.max(leg, 345 - row, row - 714);
          } else {
            const groundedFoot = evaluateFootSDF(u, z, row, uLegCenter, legRx, legRz);
            legs = Math.max(groundedFoot, 345 - row);
          }
        }

        // 3. Deltoid Root, Forearm, Palm Block, 4 Adjacent Fingers, and Opposable Thumb
        const limb = evaluateArmHandSDF(x, row, z, arm);

        // Continuous shoulder deltoid line with suppressed underarm webbing
        const kArm = row < 185 ? 9.0 : THREE.MathUtils.lerp(9.0, 3.5, THREE.MathUtils.smoothstep(row, 185, 205));
        const distance = smoothMin(smoothMin(body, legs, 4), limb, kArm);
        volume.field[iz * resolution * resolution + iy * resolution + ix] = -distance;
      }
    }
  }

  volume.update();
  const geometry = new THREE.BufferGeometry();
  const count = volume.geometry.drawRange.count;
  geometry.setAttribute(
    'position',
    new THREE.BufferAttribute((volume.geometry.getAttribute('position').array as Float32Array).slice(0, count * 3), 3)
  );
  geometry.scale(330 * REFERENCE_SCALE, 380 * REFERENCE_SCALE, 115 * REFERENCE_SCALE);
  geometry.translate(0, 350 * REFERENCE_SCALE, 0);
  volume.geometry.dispose();

  // Weld triangles before fairing so adjacent faces move together. Alternating
  // positive/negative Laplacian passes soften voxel steps without shrinking limbs.
  const welded = mergeVertices(geometry, 0.00001);
  geometry.dispose();
  const positions = welded.getAttribute('position') as THREE.BufferAttribute;
  const index = welded.getIndex()!;
  const neighbours = Array.from({ length: positions.count }, () => new Set<number>());
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
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
    (positions.array as Float32Array).set(next);
  }

  welded.computeVertexNormals();
  welded.computeBoundingBox();
  welded.computeBoundingSphere();
  geometryCache.set(gender, welded.clone());
  return wrapGeometry(gender, welded, surface);
}
