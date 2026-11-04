import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildReferenceMannequin } from './reference-geometry';

describe('reference mannequin reconstruction', () => {
  for (const gender of ['female', 'male'] as const) {
    it(`${gender}: finite continuous body with reference scale and independent cached copies`, () => {
      const group = buildReferenceMannequin(gender);
      assert.equal(group.children.length, 1);
      const mesh = group.children[0] as THREE.Mesh;
      const positions = mesh.geometry.getAttribute('position');
      const normals = mesh.geometry.getAttribute('normal');
      assert.ok(Array.from(positions.array).every(Number.isFinite));
      assert.ok(Array.from(normals.array).every(Number.isFinite));
      assert.ok((mesh.geometry.index?.count ?? positions.count) / 3 < 260000);
      const bounds = new THREE.Box3().setFromObject(group);
      const size = bounds.getSize(new THREE.Vector3());
      assert.ok(size.y > 1.73 && size.y < 1.78);
      assert.ok(size.x > 1.50 && size.x < 1.60);
      assert.ok(size.z > 0.20 && size.z < 0.35);
      assert.ok(Math.abs(bounds.getCenter(new THREE.Vector3()).x) < 0.01);

      // Verify hand and finger geometry in image scale units (x / REFERENCE_SCALE)
      const S = 1.75 / 660; // REFERENCE_SCALE
      let maxHandU = 0;
      let minThumbRow = 999, maxThumbRow = -999;
      for (let i = 0; i < positions.count; i++) {
        const u = Math.abs(positions.getX(i)) / S;
        const row = 715 - positions.getY(i) / S;
        if (u > maxHandU) maxHandU = u;
        if (u > 245 && u < 268 && row > 211) {
          if (row < minThumbRow) minThumbRow = row;
          if (row > maxThumbRow) maxThumbRow = row;
        }
      }
      // Fingertip reaches middle finger reach ~294 (+tip radius ~2.2px -> ~296px)
      assert.ok(maxHandU >= 293 && maxHandU <= 298, `Max hand reach ${maxHandU} within [293, 298]`);
      // Thumb reaches downward to row 217 (~217-220)
      assert.ok(maxThumbRow >= 216 && maxThumbRow <= 222, `Thumb reaches downward to row ${maxThumbRow}`);

      const copy = buildReferenceMannequin(gender).children[0] as THREE.Mesh;
      assert.notEqual(copy.geometry, mesh.geometry);
      const initial = copy.geometry.getAttribute('position').getX(0);
      positions.setX(0, 100);
      assert.equal(copy.geometry.getAttribute('position').getX(0), initial);
      mesh.geometry.dispose(); copy.geometry.dispose();
      (mesh.material as THREE.Material).dispose(); (copy.material as THREE.Material).dispose();
    });
  }
});
