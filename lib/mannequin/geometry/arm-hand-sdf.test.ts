import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateArmHandSDF } from './arm-hand-sdf';

describe('evaluateArmHandSDF', () => {
  it('extrapolates shoulder deltoid root smoothly for |x| < 75 without planar cuts', () => {
    const rawArm = { x: 50, cy: 195, ry: 35 }; // simulated torso-inflated measurement

    // Evaluate continuity across x = 40 to 60 (where the old knife cut at x = 45 was)
    const d44 = evaluateArmHandSDF(44.0, 185.0, 0.0, rawArm);
    const d45 = evaluateArmHandSDF(45.0, 185.0, 0.0, rawArm);
    const d46 = evaluateArmHandSDF(46.0, 185.0, 0.0, rawArm);

    assert.ok(Number.isFinite(d44) && Number.isFinite(d45) && Number.isFinite(d46));
    // Check that there is no derivative jump / step crease at x = 45
    const diff1 = Math.abs(d45 - d44);
    const diff2 = Math.abs(d46 - d45);
    assert.ok(Math.abs(diff1 - diff2) < 0.25, 'Smooth gradient across x = 45 without planar cut');

    // Medial dome at x < 42 forms a smooth capsule, not infinity or flat wall
    const d30 = evaluateArmHandSDF(30.0, 185.0, 0.0, rawArm);
    assert.ok(Number.isFinite(d30) && d30 > d45, 'Finite positive distance inside torso');
  });

  it('reconstructs thicker palm block between wrist (u=238) and knuckles (u=266)', () => {
    const arm = { x: 238, cy: 202, ry: 9 };

    // At wrist (u = 238): center row ~202, z ~0
    const dWristCenter = evaluateArmHandSDF(238, 202, 0, arm);
    assert.ok(dWristCenter < 0, 'Wrist center is inside the surface');

    // At knuckles (u = 266): width across Z is ~28px (rz ~ 14)
    const dKnuckleZ0 = evaluateArmHandSDF(266, 203.5, 0, arm);
    const dKnuckleZ10 = evaluateArmHandSDF(266, 203.5, 10.5, arm);
    const dKnuckleZ14 = evaluateArmHandSDF(266, 203.5, 14.0, arm);
    const dKnuckleZ20 = evaluateArmHandSDF(266, 203.5, 20.0, arm);

    assert.ok(dKnuckleZ0 < 0, 'Knuckle center is inside surface');
    assert.ok(dKnuckleZ10 < 0, 'Index/little finger knuckle lateral centers are inside surface');
    assert.ok(dKnuckleZ14 <= 0.5, 'Palm edge at z=14 is near boundary');
    assert.ok(dKnuckleZ20 > 2.0, 'Outside palm at z=20 is positive');
  });

  it('reconstructs 4 distinct adjacent fingers with accurate reaches', () => {
    const arm = { x: 280, cy: 203, ry: 6 };

    // 1. Middle finger reaches ~293 (longest)
    const dMid292 = evaluateArmHandSDF(292, 203.5, 3.5, arm);
    const dMid296 = evaluateArmHandSDF(296, 203.5, 3.5, arm);
    assert.ok(dMid292 < 0, 'Middle finger inside at reach 292');
    assert.ok(dMid296 > 0, 'Middle finger ends past reach 294');

    // 2. Index finger reaches ~284 (ended at 288)
    const dIdx282 = evaluateArmHandSDF(282, 204.5, 10.5, arm);
    const dIdx288 = evaluateArmHandSDF(288, 204.5, 10.5, arm);
    assert.ok(dIdx282 < 0, 'Index finger inside at reach 282');
    assert.ok(dIdx288 > 0, 'Index finger ended by reach 288');

    // 3. Adjacent fingers have separating grooves
    // Midpoint between Index (z=10.5) and Middle (z=3.5) is z = 7.0
    const dGroove = evaluateArmHandSDF(275, 203.0, 7.0, arm);
    const dIndexCore = evaluateArmHandSDF(275, 203.0, 10.5, arm);
    assert.ok(dGroove > dIndexCore, 'Groove has higher distance than finger core');
  });

  it('reconstructs opposable thumb reaching u ≈ 260 with clean web space', () => {
    const arm = { x: 255, cy: 204, ry: 8 };

    // Thumb base (u=248, row=207.5, z=8.5) and shaft (u=254, row=211.5, z=10.0)
    const dThumbShaft = evaluateArmHandSDF(254, 211.5, 10.0, arm);
    assert.ok(dThumbShaft < 0, 'Thumb shaft is inside surface');

    // Thumb tip at u ≈ 260
    const dThumbTip = evaluateArmHandSDF(260, 215.5, 11.5, arm);
    const dThumbPast = evaluateArmHandSDF(265, 217.0, 12.0, arm);
    assert.ok(dThumbTip < 0.5, 'Thumb tip reaches u ≈ 260');
    assert.ok(dThumbPast > 1.5, 'Thumb terminates before u = 265');

    // Web space between thumb (row ~212) and palm/index finger (row ~203) at u = 255
    const dWeb = evaluateArmHandSDF(255, 207.0, 9.5, arm);
    assert.ok(Number.isFinite(dWeb), 'Web space is finite and well-defined');
  });
});
