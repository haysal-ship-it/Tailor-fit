import * as THREE from 'three';

/**
 * Exact uniform base color required across the entire mannequin surface:
 * Warm sand / light tan matte resin (#C9AB84).
 */
export const MANNEQUIN_RESIN_HEX = '#C9AB84';
export const MANNEQUIN_SKIN_HEX = MANNEQUIN_RESIN_HEX;
export const MANNEQUIN_SKIN_RGB = { r: 201, g: 171, b: 132 } as const;

/**
 * Creates the non-reflective matte mannequin material per Step 3 specification:
 * - Uniform #C9AB84 base color
 * - Roughness 0.8, Metalness 0.0
 * - Smooth vertex normals (flatShading: false)
 */
export function createMannequinResinMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(MANNEQUIN_RESIN_HEX),
    roughness: 0.8,
    metalness: 0.0,
    flatShading: false,
    side: THREE.FrontSide,
  });
}

/**
 * Subtle darker taupe material for tailor construction seam lines on the mannequin torso/neck/hips,
 * giving clear visual rotation cues as the surface turns across the viewport.
 */
export function createMannequinSeamMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#9E805C'),
    roughness: 0.85,
    metalness: 0.0,
    flatShading: false,
  });
}

/**
 * Soft matte studio floor shadow catcher material.
 */
export function createFloorShadowMaterial(): THREE.ShadowMaterial {
  return new THREE.ShadowMaterial({
    opacity: 0.14,
    color: new THREE.Color('#2b2118'),
  });
}
