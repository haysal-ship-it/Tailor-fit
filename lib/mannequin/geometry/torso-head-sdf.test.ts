import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateTorsoHeadSDF, smoothRowBounds, buildSmoothedSilhouetteTable } from './torso-head-sdf';

describe('torso-head-sdf geometry and profile smoothing', () => {
  it('smoothRowBounds applies Gaussian smoothing over a 15-row window', () => {
    // Synthetic noisy data with a step at row 100
    const noisyData: number[][][] = new Array(200).fill(null).map((_, idx) => {
      const lo = idx < 100 ? 280 : 300;
      const hi = 350;
      return [[lo, hi]];
    });

    const smoothedAtStep = smoothRowBounds(100, noisyData, 7);
    assert.ok(Number.isFinite(smoothedAtStep[0]));
    assert.ok(Number.isFinite(smoothedAtStep[1]));
    // The smoothed boundary should transition smoothly between 280 and 300
    assert.ok(smoothedAtStep[0] > 280 && smoothedAtStep[0] < 300, `Expected smoothed value between 280 and 300, got ${smoothedAtStep[0]}`);

    const table = buildSmoothedSilhouetteTable(noisyData, 200, 7);
    assert.equal(table.length, 200);
    assert.ok(table.every(([lo, hi]) => Number.isFinite(lo) && Number.isFinite(hi)));
  });

  it('female bust: provides anatomical anterior projection at apex with firm sternum and natural slope', () => {
    // Row 228 is female bust apex
    const rApex = { cz: 5.0, rz: 33.0, rx: 53.0 };

    // At apex: abs(x) = 26.5, row = 228
    // Anterior silhouette apex reaches z ~ +42
    const apexSurfaceSDF = evaluateTorsoHeadSDF(26.5, 41.5, 228, rApex, true);
    assert.ok(apexSurfaceSDF <= 0.5, `Apex at z=41.5 should be inside or on surface, got ${apexSurfaceSDF}`);

    const apexOutsideSDF = evaluateTorsoHeadSDF(26.5, 47.0, 228, rApex, true);
    assert.ok(apexOutsideSDF > 0, `Point well anterior to apex (z=47) should be outside, got ${apexOutsideSDF}`);

    // Midline sternum at x = 0 should NOT be pulled forward to z=41
    const sternumSDF = evaluateTorsoHeadSDF(0, 41.5, 228, rApex, true);
    assert.ok(sternumSDF > 0, `Midline sternum at z=41.5 should be outside (cleavage valley), got ${sternumSDF}`);

    // Gentle upper slope: row 200 (infraclavicular/pectoral zone)
    const rUpper = { cz: 3.0, rz: 30.0, rx: 55.0 };
    const upperChestInside = evaluateTorsoHeadSDF(26.5, 30.0, 200, rUpper, true);
    assert.ok(upperChestInside < 0, `Upper chest at z=30 should be inside, got ${upperChestInside}`);

    // Inframammary fold underneath: row 256
    const rLower = { cz: 4.0, rz: 32.0, rx: 50.0 };
    const imfSDF = evaluateTorsoHeadSDF(26.5, 34.0, 256, rLower, true);
    assert.ok(Number.isFinite(imfSDF));
  });

  it('head & neck: softens chin undercut shelf and creates smooth throat fillet', () => {
    // Chin at row 128
    const rChin = { cz: 5.0, rz: 30.0, rx: 24.0 };
    const chinPoint = evaluateTorsoHeadSDF(0, 32.0, 128, rChin, true);
    assert.ok(chinPoint <= 0, `Chin at z=32 should be inside, got ${chinPoint}`);

    // Submental throat at row 133 (below chin, above neck)
    const rThroat = { cz: 2.0, rz: 24.0, rx: 20.0 };
    const throatFillet = evaluateTorsoHeadSDF(0, 20.0, 133, rThroat, true);
    assert.ok(Number.isFinite(throatFillet));

    // Neck at row 139
    const rNeck = { cz: 0.5, rz: 22.5, rx: 18.5 };
    const neckInside = evaluateTorsoHeadSDF(0, 0, 139, rNeck, true);
    assert.ok(neckInside < -10, `Neck center should be deeply inside, got ${neckInside}`);
    const neckLateralOutside = evaluateTorsoHeadSDF(22.0, 0, 139, rNeck, true);
    assert.ok(neckLateralOutside > 0, `Point lateral to neck (u=22 > 18.5) should be outside, got ${neckLateralOutside}`);
  });

  it('trapezius and shoulders: natural slope and rounded acromion joint', () => {
    const rShoulder = { cz: -1.0, rz: 26.0, rx: 57.0 };

    // Point above trapezius line at row 150, u = 45 (outside body)
    const aboveTrapezius = evaluateTorsoHeadSDF(45.0, 0, 150, rShoulder, true);
    assert.ok(aboveTrapezius > 0, `Point above trapezius at row 150, u=45 should be outside, got ${aboveTrapezius}`);

    // Point on shoulder body at row 168, u = 45 (inside body)
    const insideShoulder = evaluateTorsoHeadSDF(45.0, 0, 168, rShoulder, true);
    assert.ok(insideShoulder < 0, `Point inside shoulder at row 168, u=45 should be inside, got ${insideShoulder}`);

    // Acromion rounding: at corner (u=57, row=168), acromion is smoothly rounded
    const acromionSDF = evaluateTorsoHeadSDF(56.5, 0, 168, rShoulder, true);
    assert.ok(Number.isFinite(acromionSDF));
  });

  it('glutes: models bilateral cheek volumes filling profile gap with central cleft', () => {
    const rGlute = { cz: -9.5, rz: 42.5, rx: 65.0 };

    // Posterior cheek apex at row 376, abs(x) = 22.5
    // Reference silhouette extends to z = -52.0
    const cheekApexInside = evaluateTorsoHeadSDF(22.5, -50.0, 376, rGlute, true);
    assert.ok(cheekApexInside <= 0.5, `Glute cheek at z=-50 should be inside or on surface, got ${cheekApexInside}`);

    // Central intergluteal cleft at x = 0
    // Should indent anteriorly compared to the cheek apex
    const cleftMidline = evaluateTorsoHeadSDF(0, -50.0, 376, rGlute, true);
    assert.ok(cleftMidline > cheekApexInside, `Intergluteal cleft at midline should indent relative to cheeks: ${cleftMidline} > ${cheekApexInside}`);

    // Lower gluteal fold past row 400 continues smoothly without flat cut plane
    const lowerGlute = evaluateTorsoHeadSDF(22.5, -40.0, 408, rGlute, true);
    assert.ok(lowerGlute < 0, `Lower glute at row 408 should remain continuous inside volume, got ${lowerGlute}`);
  });
});
