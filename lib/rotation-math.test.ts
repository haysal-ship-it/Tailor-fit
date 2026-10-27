import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TAU, wrapPi, smoothDamp, estimateReleaseVelocity } from './rotation-math';
import { ROTATION } from './rotation-config';
import { buildMannequinGroup } from './mannequin/female-geometry';
import { createMannequinResinMaterial } from './mannequin/material';

describe('rotation-math', () => {
  describe('wrapPi', () => {
    it('keeps angles within (-PI, PI] unchanged', () => {
      assert.ok(Math.abs(wrapPi(0) - 0) < 1e-9);
      assert.ok(Math.abs(wrapPi(Math.PI / 2) - Math.PI / 2) < 1e-9);
      assert.ok(Math.abs(wrapPi(-Math.PI / 2) - -Math.PI / 2) < 1e-9);
    });

    it('wraps angles outside (-PI, PI] along the shortest angular distance', () => {
      // 350 deg -> -10 deg
      const a = (350 * Math.PI) / 180;
      const expected = (-10 * Math.PI) / 180;
      assert.ok(Math.abs(wrapPi(a) - expected) < 1e-9);

      // -350 deg -> +10 deg
      assert.ok(Math.abs(wrapPi(-a) - -expected) < 1e-9);

      // Multiple full revolutions (e.g. 5 * TAU + 0.4) -> 0.4
      assert.ok(Math.abs(wrapPi(5 * TAU + 0.4) - 0.4) < 1e-9);
      assert.ok(Math.abs(wrapPi(-3 * TAU - 0.7) - -0.7) < 1e-9);
    });
  });

  describe('smoothDamp', () => {
    it('converges monotonically toward the target without overshoot and mutates velocity', () => {
      let current = 0;
      const target = Math.PI / 2;
      const vel = { v: 0 };
      const dt = 1 / 60;
      const smoothTime = ROTATION.smoothButton;

      for (let i = 0; i < 120; i++) {
        const next = smoothDamp(current, target, vel, smoothTime, dt);
        assert.ok(next >= current, `Expected monotonic approach at step ${i}`);
        assert.ok(next <= target + 1e-5, `Expected no overshoot at step ${i}`);
        current = next;
      }

      assert.ok(Math.abs(current - target) < 1e-3);
      assert.ok(Math.abs(vel.v) < 1e-2);
    });

    it('is frame-rate independent across 60 Hz vs 120 Hz', () => {
      const target = 1.5;
      const smoothTime = 0.06;

      let c60 = 0;
      const v60 = { v: 0 };
      for (let i = 0; i < 12; i++) {
        c60 = smoothDamp(c60, target, v60, smoothTime, 1 / 60);
      }

      let c120 = 0;
      const v120 = { v: 0 };
      for (let i = 0; i < 24; i++) {
        c120 = smoothDamp(c120, target, v120, smoothTime, 1 / 120);
      }

      assert.ok(Math.abs(c60 - c120) < 0.015);
    });
  });

  describe('estimateReleaseVelocity', () => {
    it('returns 0 when fewer than 2 samples exist', () => {
      assert.equal(estimateReleaseVelocity([], 1000), 0);
      assert.equal(estimateReleaseVelocity([{ x: 100, t: 990 }], 1000), 0);
    });

    it('returns 0 when release is stale (> staleRelease = 60ms)', () => {
      const samples = [
        { x: 0, t: 900 },
        { x: 100, t: 930 },
      ];
      // Released at 1000ms -> 70ms after last sample (> 60ms)
      assert.equal(estimateReleaseVelocity(samples, 1000), 0);
    });

    it('computes accurate velocity from samples within velocityWindow (90ms)', () => {
      const samples = [
        { x: 0, t: 500 },    // Outside 90ms window, should be ignored
        { x: 200, t: 920 },  // Inside 90ms window (cutoff = 980 - 90 = 890)
        { x: 250, t: 980 },  // 50px in 60ms (0.06s) -> 8.75 rad/s (< maxSpeed 16)
      ];
      const v = estimateReleaseVelocity(samples, 990);
      const expected = ((250 - 200) * ROTATION.radPerPx) / 0.06;
      assert.ok(Math.abs(v - expected) < 1e-6);
    });

    it('clamps velocity to [-maxSpeed, +maxSpeed]', () => {
      const fastRight = [
        { x: 0, t: 950 },
        { x: 5000, t: 980 },
      ];
      assert.equal(estimateReleaseVelocity(fastRight, 985), ROTATION.maxSpeed);

      const fastLeft = [
        { x: 5000, t: 950 },
        { x: 0, t: 980 },
      ];
      assert.equal(estimateReleaseVelocity(fastLeft, 985), -ROTATION.maxSpeed);
    });
  });

  describe('buildMannequinGroup 3D Pivot & Triangle Budget', () => {
    it('centers Box3 at (x = 0, z = 0), rests feet at y = 0, height = 1.75m, and stays under 45k triangles', () => {
      const mat = createMannequinResinMaterial();
      for (const gender of ['female', 'male'] as const) {
        const group = buildMannequinGroup(gender, mat);
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        assert.ok(Math.abs(center.x) < 1e-5, `Expected ${gender} Box3 center.x = 0, got ${center.x}`);
        assert.ok(Math.abs(center.z) < 1e-5, `Expected ${gender} Box3 center.z = 0, got ${center.z}`);
        assert.ok(Math.abs(box.min.y) < 1e-5, `Expected ${gender} Box3 min.y = 0, got ${box.min.y}`);
        assert.ok(Math.abs(size.y - 1.75) < 1e-3, `Expected ${gender} height = 1.75m, got ${size.y}`);

        let triangles = 0;
        group.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const geom = (obj as THREE.Mesh).geometry;
            triangles += geom.index ? geom.index.count / 3 : geom.attributes.position.count / 3;
          }
        });
        assert.ok(triangles > 10000 && triangles <= 45000, `Expected triangle count <= 45000, got ${triangles}`);
      }
    });
  });
});
