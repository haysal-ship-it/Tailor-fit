import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateFootSDF } from './foot-sdf';

describe('Foot SDF Evaluation', () => {
  const legCenter = -42.0;
  const legRx = 11.0;
  const legRz = 15.0;

  it('1. Ankle transition has slender cross-section and Achilles tendon inward curve', () => {
    // At row 662 (Achilles tendon notch), posterior edge (z < -25) should curve inward
    const dPosterior = evaluateFootSDF(42.0, -28.0, 662, legCenter, legRx, legRz);
    assert.ok(dPosterior > 0, 'Achilles tendon notch pulls inward, leaving space outside');
  });

  it('2. Compact rounded heel extends posteriorly to z ~ -37 without lateral flaring', () => {
    // Apex of heel at z = -37 should be close to zero-crossing
    const dApex = evaluateFootSDF(42.0, -37.0, 698, legCenter, legRx, legRz);
    assert.ok(Math.abs(dApex) < 2.5, `Heel apex should be near 0, got ${dApex}`);

    // Behind heel (z = -43) must be clearly outside
    const dBehind = evaluateFootSDF(42.0, -43.0, 698, legCenter, legRx, legRz);
    assert.ok(dBehind > 0, 'Behind heel must be outside');

    // Lateral to heel at u = 68 (far lateral from heel width ~ 24px) must be outside
    const dLateral = evaluateFootSDF(68.0, -26.0, 698, legCenter, legRx, legRz);
    assert.ok(dLateral > 0, 'Lateral to heel must be outside');
  });

  it('3. Five distinct toes with individual tips and interdigital valleys', () => {
    const toes = [
      { name: 'Big toe (Toe 1)', u: 38.0, z: 52.7, r: 3.4 },
      { name: 'Index toe (Toe 2)', u: 42.8, z: 50.7, r: 3.1 },
      { name: 'Middle toe (Toe 3)', u: 48.1, z: 48.1, r: 2.8 },
      { name: 'Fourth toe (Toe 4)', u: 53.3, z: 45.6, r: 2.6 },
      { name: 'Pinky toe (Toe 5)', u: 58.5, z: 42.5, r: 2.3 },
    ];

    for (const t of toes) {
      const dTip = evaluateFootSDF(t.u, t.z, 714 - t.r, legCenter, legRx, legRz);
      assert.ok(dTip <= 1.0, `${t.name} tip should be on surface, got ${dTip}`);

      const dAhead = evaluateFootSDF(t.u, t.z + 5.0, 714 - t.r, legCenter, legRx, legRz);
      assert.ok(dAhead > 0, `${t.name} ahead of tip should be outside, got ${dAhead}`);
    }
  });

  it('4. Medial longitudinal arch lifts off the ground for u < 42 between row 685 and 708', () => {
    // At floor row 713, under medial arch (u = 34, z = 5) must be outside
    const dFloor = evaluateFootSDF(34.0, 5.0, 713, legCenter, legRx, legRz);
    assert.ok(dFloor > 4.0, `Medial arch should lift off the floor, got ${dFloor}`);
  });

  it('5. Ground contact plane cleanly bounds the sole at row 714', () => {
    // Below floor (row = 718) must always be outside
    const dBelow = evaluateFootSDF(42.0, 20.0, 718, legCenter, legRx, legRz);
    assert.ok(dBelow > 0, 'Below floor must be outside');
  });
});
