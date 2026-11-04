/**
 * bake-mannequin-mesh.ts
 *
 * Offline baking pipeline for female and male 3D mannequin meshes.
 * Generates continuous Marching Cubes implicit geometry using the unified
 * buildReferenceMannequin pipeline (with modular Torso, Foot, and Arm SDFs),
 * welds vertices, performs Laplacian smoothing, and exports optimized binary GLB assets
 * to public/assets/reconstruction/{female,male}-mannequin.glb.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildReferenceMannequin } from '../lib/mannequin/reference-geometry';

// Polyfill FileReader for Three.js GLTFExporter in Node.js
class FileReaderPolyfill {
  result: any = null;
  onloadend: (() => void) | null = null;
  readAsArrayBuffer(blob: any) {
    blob.arrayBuffer().then((buf: ArrayBuffer) => {
      this.result = buf;
      if (typeof this.onloadend === 'function') this.onloadend();
    });
  }
}
(globalThis as any).FileReader = FileReaderPolyfill;

function exportGLB(mesh: THREE.Object3D, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      mesh,
      (glbBuffer) => {
        const buffer = Buffer.from(glbBuffer as ArrayBuffer);
        fs.writeFileSync(outputPath, buffer);
        console.log(`Saved GLB: ${outputPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
        resolve();
      },
      (error) => reject(error),
      { binary: true }
    );
  });
}

async function runBake() {
  const outDir = path.resolve(__dirname, '../public/assets/reconstruction');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const gender of ['female', 'male'] as const) {
    console.log(`\nBaking ${gender} mannequin mesh via buildReferenceMannequin...`);
    const startTime = performance.now();
    const group = buildReferenceMannequin(gender);
    const mesh = group.children[0] as THREE.Mesh;
    const geom = mesh.geometry;
    geom.computeBoundingBox();
    const size = geom.boundingBox!.getSize(new THREE.Vector3());
    const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
    console.log(`Geometry built in ${elapsed}s:`);
    console.log(`- Dimensions: X=${size.x.toFixed(3)}m, Y=${size.y.toFixed(3)}m, Z=${size.z.toFixed(3)}m`);
    console.log(`- Triangles: ${(geom.index ? geom.index.count : geom.attributes.position.count) / 3}, Vertices: ${geom.attributes.position.count}`);

    const outPath = path.join(outDir, `${gender}-mannequin.glb`);
    await exportGLB(group, outPath);
  }
  console.log('\nAll mannequin GLB assets baked successfully.');
}

runBake().catch((err) => {
  console.error('Error during baking:', err);
  process.exit(1);
});
