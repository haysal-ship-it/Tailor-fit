import * as THREE from 'three';

/**
 * Centralized skin color and matte mannequin-resin material configuration.
 *
 * Required base albedo color: #C9AB84 (RGB: 201, 171, 132)
 * Applied uniformly across the entire mannequin geometry.
 */
export const MANNEQUIN_SKIN_HEX = '#C9AB84' as const;

export const MANNEQUIN_SKIN_RGB = {
  r: 201,
  g: 171,
  b: 132,
} as const;

export interface MannequinMaterialConfig {
  baseColorHex: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  reflectivity: number;
  sheen: number;
  sheenRoughness: number;
}

export const DEFAULT_MANNEQUIN_MATERIAL_CONFIG: MannequinMaterialConfig = {
  baseColorHex: MANNEQUIN_SKIN_HEX,
  // Smooth, matte mannequin-resin finish with subtle realistic form shading
  // Avoids metallic, glossy, waxy, or ceramic-like appearance
  roughness: 0.72,
  metalness: 0.0,
  clearcoat: 0.03,
  clearcoatRoughness: 0.8,
  reflectivity: 0.18,
  sheen: 0.08,
  sheenRoughness: 0.85,
};

/**
 * Creates a reusable Three.js material configured with the exact #C9AB84 base color
 * and a smooth, matte mannequin-resin surface finish.
 */
export function createMannequinResinMaterial(
  overrides?: Partial<MannequinMaterialConfig>
): THREE.MeshPhysicalMaterial {
  const cfg = { ...DEFAULT_MANNEQUIN_MATERIAL_CONFIG, ...overrides };
  const baseColor = new THREE.Color(cfg.baseColorHex);

  return new THREE.MeshPhysicalMaterial({
    color: baseColor,
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    clearcoat: cfg.clearcoat,
    clearcoatRoughness: cfg.clearcoatRoughness,
    reflectivity: cfg.reflectivity,
    sheen: cfg.sheen,
    sheenRoughness: cfg.sheenRoughness,
    sheenColor: baseColor.clone().multiplyScalar(0.95),
    flatShading: false,
    side: THREE.FrontSide,
  });
}
