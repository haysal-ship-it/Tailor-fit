import * as THREE from 'three';

/** Object-space texture projection. Weights depend on the surface normal, never
 * camera angle: the texture stays attached to the mesh through a full rotation.
 * The reference photographs contain studio lighting, so this study uses baked
 * colour rather than applying a second set of strong lights over the images.
 */
export function createReferenceMaterial(textures: THREE.Texture[]) {
  return new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      frontMap: { value: textures[0] },
      backMap: { value: textures[1] },
      sideMap: { value: textures[2] },
      rightMap: { value: textures[3] },
    },
    vertexShader: `
      #include <common>
      varying vec3 localPosition;
      varying vec3 localNormal;
      void main() {
        localPosition = position;
        localNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      #include <common>
      uniform sampler2D frontMap;
      uniform sampler2D backMap;
      uniform sampler2D sideMap;
      uniform sampler2D rightMap;
      varying vec3 localPosition;
      varying vec3 localNormal;
      void main() {
        float pixelScale = 660.0 / 1.75;
        float row = 715.0 - localPosition.y * pixelScale;
        vec2 uv = vec2((318.0 + localPosition.x * pixelScale) / 636.0, 1.0 - row / 730.0);
        vec2 backUV = vec2(1.0 - uv.x, uv.y);
        vec2 sideUV = vec2((318.0 - localPosition.z * pixelScale) / 636.0, uv.y);
        vec3 n = normalize(localNormal);
        vec4 f = texture2D(frontMap, uv);
        vec4 b = texture2D(backMap, backUV);
        vec4 s = n.x >= 0.0 ? texture2D(sideMap, sideUV) : texture2D(rightMap, vec2(1.0 - sideUV.x, sideUV.y));

        // Normal-based projection weights: quadratic response preserves spherical energy (nx^2 + nz^2 = 1)
        float fw = pow(max(n.z, 0.0), 2.0) * smoothstep(0.95, 1.0, f.a);
        float bw = pow(max(-n.z, 0.0), 2.0) * smoothstep(0.95, 1.0, b.a);
        float sw = pow(abs(n.x), 2.0) * smoothstep(0.95, 1.0, s.a);

        // Side images hide the arms behind the torso: use front/back texture for limbs.
        float armMask = 1.0 - smoothstep(0.13, 0.22, abs(localPosition.x));
        // The side photograph's hand occludes the shoulder. Do not project that hand
        // onto the shoulder surface; use the unobstructed front/back observations.
        float handOcclusion = smoothstep(168.0, 183.0, row) * (1.0 - smoothstep(208.0, 224.0, row));
        float sideMask = armMask * (1.0 - handOcclusion);

        // Seamless weight redistribution: transfer obstructed side weight to front/back
        // so total surface illumination remains uniform without dark seam dips
        float suppressedSide = sw * (1.0 - sideMask);
        sw *= sideMask;

        float frontness = smoothstep(-0.2, 0.2, n.z);
        fw += suppressedSide * frontness + 0.035 * frontness;
        bw += suppressedSide * (1.0 - frontness) + 0.035 * (1.0 - frontness);

        float total = fw + bw + sw;
        vec3 blended = (f.rgb * fw + b.rgb * bw + s.rgb * sw) / max(total, 1e-4);

        // Sampled matte tan resin fallback (#b09576 in linear space: rgb 0.434, 0.301, 0.181)
        // Smooth continuous mix prevents hard boundary artifacts on upward/downward-facing surfaces
        const vec3 resinFallback = vec3(0.434, 0.301, 0.181);
        vec3 colour = mix(resinFallback, blended, smoothstep(0.01, 0.06, total));

        // Procedural tailor seam lines (neck collar, center-front, center-back, underbust, waist, hip, ankle rings)
        // Pigment: dark tan #8c6f50 (~1px width)
        float seam = 0.0;
        // Neck collar ring (row ~139)
        seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 139.0)));
        // Torso circumference rings (underbust ~245, waist ~295, hip ~370)
        if (abs(localPosition.x) < 0.18) {
          seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 245.0)));
          seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 295.0)));
          seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 370.0)));
        }
        // Ankle rings (row ~665)
        if (row > 650.0 && row < 680.0) {
          seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 665.0)));
        }
        // Center-front (n.z > 0) and center-back (n.z < 0) seams on torso
        if (row >= 139.0 && row <= 408.0) {
          float xPx = localPosition.x * pixelScale;
          seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(xPx)));
        }

        const vec3 seamColor = vec3(0.264, 0.158, 0.080); // #8c6f50 in linear space
        colour = mix(colour, seamColor, seam * 0.70);

        gl_FragColor = vec4(colour, 1.0);
        // Note: #include <tonemapping_fragment> intentionally omitted so reference colors pass 1:1
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Satin matte resin clay material with procedural tailor dummy seams matching textured mode.
 */
export function createClayMaterial(): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({
    color: '#b09576',
    roughness: 0.72,
    metalness: 0.0,
  });
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vSeamLocalPosition;
       varying vec3 vSeamNormal;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vSeamLocalPosition = position;
       vSeamNormal = normal;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vSeamLocalPosition;
       varying vec3 vSeamNormal;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       float pixelScale = 660.0 / 1.75;
       float row = 715.0 - vSeamLocalPosition.y * pixelScale;
       float seam = 0.0;
       // Neck collar ring (row ~139)
       seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 139.0)));
       // Torso circumference rings (underbust ~245, waist ~295, hip ~370)
       if (abs(vSeamLocalPosition.x) < 0.18) {
         seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 245.0)));
         seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 295.0)));
         seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 370.0)));
       }
       // Ankle rings (row ~665)
       if (row > 650.0 && row < 680.0) {
         seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(row - 665.0)));
       }
       // Center-front and center-back seam lines on torso
       if (row >= 139.0 && row <= 408.0) {
         float xPx = vSeamLocalPosition.x * pixelScale;
         seam = max(seam, 1.0 - smoothstep(0.35, 1.25, abs(xPx)));
       }
       const vec3 seamColor = vec3(0.264, 0.158, 0.080); // #8c6f50
       gl_FragColor.rgb = mix(gl_FragColor.rgb, seamColor, seam * 0.70);`
    );
  };
  return mat;
}

