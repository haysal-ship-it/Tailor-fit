# Antigravity handoff: faithful 3D mannequin reconstruction

Prepared: 2 November 2026. Status: working reconstruction study, not a finished or approved visual replacement.

## 1. Objective and mandatory isolation

Build actual female and male 3D mannequins that match the original TailorFit mannequin images as closely as possible and rotate continuously and smoothly through 360 degrees. The original images are the visual authority: retain their proportions, understated anatomy, warm matte finish, construction lines, and T-pose. The user rejected an earlier replacement because it changed the mannequin appearance and the control panel. The user also dislikes image crossfades.

**Run and develop this separately from the main project’s user flows.** Continue using the isolated reconstruction preview, preferably in a dedicated local workspace/server. Do not replace the main mannequin, wire experimental geometry into application screens, redesign the original controls, or deploy this study. Present the separate result for visual acceptance first. Any later integration needs to preserve the original controls and component contract.

The current preview is `/preview/reconstructed-mannequin`: original image on the left, new mesh on the right. It is an isolated route inside the repository, NOT currently a standalone application or independent build. A separate workspace/server is stronger isolation; instructions are below.

Aim for a perceptually faithful result in every view. Four images cannot uniquely determine hidden geometry, material and lighting. Do not promise an exact recovery or call the current model perfect. Measure agreement and identify inferred regions. Finding the original source model would be the best route to an exact match.

## 2. Workspace and source of truth

Current workspace: `C:\Users\Sal\Documents\Vibe coding\Tailor-fit-main`.
Earlier work used `C:\Users\Sal\Downloads\Tailor-fit-main`; do not assume that historical path is still the active project.
Repository previously identified: `https://github.com/haysal-ship-it/Tailor-fit`. Verify the remote before Git operations. This document does not authorize publishing or deployment.

At handoff inspection, the reconstruction files were untracked. Earlier main-app edits remained modified. A fresh clone or worktree from HEAD will NOT contain all this work. Preserve/copy actual working files; do not reset or overwrite changes.

The older `project-memory/HANDOFF.md` describes earlier image assets and application integration. Its wording is historical, not proof that this reconstruction is approved. Its left/right angle labels also differ from the current preview convention. Use observed orientation and the mapping below.

| File/path relative to repository | Role |
| --- | --- |
| `app/preview/reconstructed-mannequin/page.tsx` | Separate comparison page, camera, scene, controls and basic drag/coast loop. |
| `lib/mannequin/reference-geometry.ts` | Implicit surface, Marching Cubes, welding, smoothing, normals and cache. |
| `lib/mannequin/reference-silhouettes.json` | Measured original alpha-mask row spans and arm-column spans. |
| `lib/mannequin/reference-material.ts` | Four reference textures projected in object space. |
| `scripts/build-reference-textures.cjs` | Cleans and pads colours into derived maps; originals untouched. |
| `public/assets/reconstruction/{female,male}-{front,back,left,right}-surface.png` | Eight derived texture maps. |
| `lib/mannequin/reference-geometry.test.ts` | Geometry sanity and cache-isolation checks, not fidelity tests. |
| `lib/rotation-math.ts`, `lib/rotation-config.ts`, `lib/rotation-math.test.ts` | Existing motion helpers, settings and tests. |
| `components/TurntableRig.tsx` | More complete rotation logic, but also earlier unwanted mannequin visuals. Read selectively; do not import wholesale. |
| `components/mannequin/RotatableMannequin.tsx` | Currently an adapter into TurntableRig from the earlier attempt; not the reconstruction preview. |

Modified tracked files at inspection: `components/TurntableRig.tsx`, `components/mannequin/RotatableMannequin.tsx`, `tsconfig.tsbuildinfo`. The first two contain earlier work; the last is generated/pre-existing working state. Do not treat them as an approved new integration or revert them blindly.

## 3. Authoritative references and calibration

Original transparent PNGs, each 636 x 730:

- `public/assets/mannequin-female-front.png`
- `public/assets/mannequin-female-back.png`
- `public/assets/mannequin-female-left.png`
- `public/assets/mannequin-female-right.png`
- `public/assets/mannequin-male-front.png`
- `public/assets/mannequin-male-back.png`
- `public/assets/mannequin-male-left.png`
- `public/assets/mannequin-male-right.png`

Additional T-pose sheets/images exist under `public/assets/mannequin-{female,male}-tpose-*.png`. Inspect for useful information, but verify framing and proportions against the eight turntable images before mixing references.

Visual characteristics to preserve:

- Neutral T-pose, arms nearly horizontal, restrained mannequin anatomy.
- Featureless face, rounded crown, tapered jaw, slender neck.
- Warm tan/beige matte resin. `#C9AB84` is a useful base colour, not a complete material match.
- Distinct male/female shapes; do not substitute a uniform scaling of one model.
- Fine construction lines at neck, waist, hips and body centres, rather than deep grooves.
- Soft studio shading and subtle floor contact.
- Small, carefully proportioned hands/feet. Front views hide finger depth; side views contain hand/arm occlusion.

Working calibration, not independently recovered camera metadata:

- Image centre/spine approximately x=318; head top around row 55; floor around row 715.
- 660-pixel body height mapped to 1.75 world units: `S = 1.75 / 660`.
- World X = `(imageX - 318) * S`; world Y = `(715 - imageRow) * S`.
- Positive Z is the mannequin’s front.
- Left image samples at `imageX = 318 - worldZ/S`; right uses the opposite sign.
- Current preview yaw: Front=0, Right=PI/2, Back=PI, Left=3*PI/2.
- The left reference faces left on screen; the right reference faces right. Recheck after any model import/export.
- Approximate female landmarks: neck row 139, shoulder/arm region 165–210, bust 225, waist 295, hips 345–390, crotch 400, feet 715. Fit actual outlines rather than treating these estimates as fixed anatomy.

## 4. Work history and lessons

This records the steps taken during the conversation, checked against current source. It is not a commit-by-commit history; the iterations were not separately committed.

1. Investigated the original image turntable and motion. It used four PNG views with image transitions and projected measurement landmarks.
2. An early fix routed the mannequin through the existing Three.js TurntableRig. Motion improved, but appearance and controls changed. The user rejected that change. Do not repeat this substitution.
3. Considered ways to preserve the original look. Image crossfades were not accepted as the final solution; the user wants continuous real geometry.
4. Created `/preview/reconstructed-mannequin` to build and compare a new mesh separately from main screens.
5. Built an initial profile/shell approximation. It established framing/scale but had wrong proportions, angular surfaces, disconnected-looking joins and poor texture correspondence.
6. Extracted silhouette row/column spans from original alpha masks. The recorded extraction used an alpha threshold around 180. The JSON exists, but there is no dedicated silhouette regeneration script in the current file set. Recreate/document that pipeline before regeneration.
7. Replaced overlapping shells with one implicit surface combining torso, legs, arms, palms, fingers and female bust volumes through smooth unions.
8. Increased Marching Cubes grid resolution from 144 to 192. Added vertex welding, alternating positive/negative smoothing and recalculated shared normals to reduce faceting and unstable texture blends.
9. Used measured front contours for more of the torso/head, keeping interpolated profiles where arms obscure torso measurements. Refined thigh/pelvis entry, shoulder joins and bilateral bust shape.
10. Added separate palm/finger/thumb volumes instead of a flattened mitten-like outline. Their depth/pose remains inferred.
11. Generated padded texture maps. Rejected transparent fringes and white/grey cutout remnants, then extended valid tan colours to prevent background stripes during filtering.
12. Used object-space projection for front/back/sides. Added the right-side map, softened blending and removed a sign-dependent fallback that caused hard colour boundaries.
13. Suppressed side projection over arms and the shoulder region where a hand occludes the source image. This reduced false hand detail on the shoulder; it is still a heuristic.
14. Fixed mirrored side selection and equalized camera/image framing so comparisons fit the browser at a common scale.
15. Inspected live front, back, side, clay and textured views; dragged between views. Clay revealed errors hidden by source shading.
16. Tried cranium/jaw ellipsoids for a rounded crown, but these introduced a ridge. The final version rounds only the crown while retaining the measured jaw/neck profile.
17. Reduced thigh-root depth inside the pelvis to lessen hip bulges. Tapered central pelvis depth before the crotch to reduce a profile ledge. These are improvements, not proof that all contour errors are eliminated.
18. Passed types, targeted lint, both geometry tests and live rendering checks. Kept the reconstruction in the comparison route. No perfect-match or integration approval was claimed.

## 5. Current geometry: how it works

`buildReferenceMannequin(gender, material)` returns a Three.Group with one mesh named `ContinuousReferenceBody`. One mesh does not prove that every triangle forms a connected, manifold surface.

- Grid resolution: 192 cubed, roughly 7.1 million sample positions.
- Working field: X -330 toward +330, image row 745 toward -15, depth Z -115 toward +115.
- Marching Cubes isolation=0; allocated triangle budget=260,000.
- Torso sections are mostly ellipses. Width comes from measured front spans for the head/neck and much of the torso; interpolated manual profiles fill other regions.
- Depth/centre comes primarily from the left-reference outline, averaged across seven rows. All four views are not fitted independently.
- Arm sections use five adjacent front columns. Depth is estimated from vertical radius.
- Legs use front-image width/spacing with bilateral mirroring and side-derived depth.
- Crown correction blends a rounded cap into measured sections between rows 72 and 90. It avoids separate overlapping head primitives.
- Female bust: two ellipsoids blended into a torso with reduced central front depth.
- Thigh roots expand gradually; depth starts reduced and returns to full depth across rows 380–430.
- Central pelvis depth tapers by up to 20% between rows 375–400 to avoid a narrow projecting slice.
- Hands: inferred palms, four finger capsules and thumb. These are not measured finger geometry.
- Mesh processing: world scale/translation, welding tolerance 0.00001, ten alternating Laplacian passes (+0.45/-0.47), recalculated normals/bounds.
- Cache per gender; return cloned geometry so disposal/mutation does not corrupt the cached mesh.

Limitations: ellipses do not capture full anatomy; smooth unions can inflate joins; profiles can produce steps; symmetry can conceal reference asymmetry; the fields approximate distance functions; smoothing changes fitted silhouettes. More voxels alone will not solve incorrect shape assumptions.

## 6. Current material and texture pipeline

`node scripts/build-reference-textures.cjs` regenerates derived maps in the isolated copy. It uses `sharp`, available in the prior environment but not directly declared in package.json. Verify resolution and declare a reproducible direct development dependency in the isolated tool project if needed; do not silently depend on a transitive install.

The script reads RGBA originals, selects interior pixels with alpha >=253 and four neighbour checks at a three-pixel offset, rejects white/grey colours with tan-colour heuristics, flood-fills outward from valid colours, and writes fully opaque padded maps. It does not change the originals.

The shader projects front/back and appropriate left/right colours using local positions. Weights depend on local normals, not camera angle: front/back normal components squared, side component to the fourth power times 0.6, plus small continuous fallback weights. Side projection is masked in arms/occluded shoulder areas. This keeps the surface attached during rotation; it does not switch the displayed photograph as the camera turns.

Remaining limitations:

- Pixels contain baked lighting/shadows, so this is not a recovered physically based material.
- Lighting differences between source views produce patches and duplicated highlights/shadows.
- Padding invents colour beyond visible surfaces.
- Fully opaque padded maps mean shader alpha tests no longer represent actual visibility/confidence. Preserve separate masks in the next pipeline.
- Shoulder masking is heuristic, not depth-tested visibility.
- Projection stretches seams in curved or hidden regions.
- Side geometry is mostly left-view-derived, but colours come from both sides.

Clay mode uses MeshStandardMaterial, colour #c9ab84, roughness 0.9, hemisphere and directional lighting. It is for geometry inspection, not evidence of a finished studio-lighting match.

## 7. What is working and what remains

Working foundations: real mesh with continuous yaw; common reference framing; closer front/back proportions; improved crown and joined surfaces; smoother normals; original surface detail attached to the mesh; corrected side orientation; fewer white edge artifacts; separate comparison and clay modes; disposal and independent cached copies.

| Area | Remaining problem | Required next action |
| --- | --- | --- |
| Multi-view body fit | Plausible cardinal views can conceal incorrect oblique surfaces. | Calibrate cameras, fit all four silhouettes/landmarks jointly, then inspect intermediate angles. |
| Shoulders/armpits | Smooth unions create bulges or unnatural undersides. | Sculpt continuous clavicle, deltoid and armpit flow using front/back outlines and clay quarter-turns. |
| Bust/torso | Ellipsoids can look attached or excessively round. | Refine chest curvature, breast root/spacing and lower fold while retaining understated mannequin anatomy. |
| Pelvis/crotch | Prior bulges, ridges and profile ledges were reduced, not certified eliminated. | Validate waist-to-hip-to-thigh contour; eliminate central fins without flattening the buttocks. |
| Head/neck | Rounded crown improved; lower-face depth and neck junction remain approximate. | Match all silhouettes and curvature; keep the face featureless. |
| Hands | Finger depth, pose, taper and thumb angle are inferred. | Model tapered fingers, palm and knuckles; fit visible outlines and use extra references if available. |
| Feet | Blocky toes, weak arch/heel/ankle transitions, imperfect stance. | Model ankle, heel, instep, toe wedge and floor contact explicitly. |
| Surface | Patchy shading, stretched projected lines and missing hidden detail. | Visibility-aware projection into a consistent UV atlas, with deliberate lighting treatment. |
| Runtime | Dense field generation runs synchronously in the browser. | Bake models offline and load GLB; use a worker only as an interim authoring measure. |
| Motion | Prototype release velocity depends on event timing; preset turns jump. | Apply the controller design below while retaining direct drag feel. |

## 8. Implementation sequence for the closest achievable match

### A. Preserve and calibrate

1. Snapshot working files, including untracked reconstruction/assets. Record hashes of all eight originals and keep them immutable.
2. Inspect originals at full resolution. Create a contact sheet and landmark table for each gender/view.
3. Separate silhouette masks from colour textures; exclude floor shadows consistently. Recreate the missing silhouette extraction script with documented thresholds and deterministic outputs.
4. Calibrate scale, centre, vertical alignment and camera orientation per view. Orthographic is the current assumption; verify it rather than distorting anatomy to compensate for camera errors.
5. Add fixed-camera overlay and difference views. Compare at source resolution 636 x 730 as well as actual display size.
6. Search project assets/history for the source GLB/GLTF/OBJ/Blender model or known provenance. If found, inspect it before continuing reconstruction. A generic mannequin is not a replacement just because its category matches.

### B. Fit geometry before texture polish

Preferred route: use the current procedural mesh as a scale/pose blockout, then construct or retopologize a clean editable surface in a 3D authoring workflow such as Blender. This gives better control of shoulders, hands, feet and pelvis than indefinitely adding smooth-union constants.

1. Place orthographic front/back/left/right reference cameras using calibrated transforms. Keep world Y and floor fixed.
2. Fit torso, shoulder span, arm height/length, waist, hips, crotch, leg spacing, knees, ankles and overall height in clay first.
3. Fit male/female independently. Use symmetry only where supported, then inspect real asymmetries.
4. Sculpt cross-sectional shape: back, chest, abdomen, buttocks, shoulders, underarms, knees/calves and ankles. Remove hard transitions between parts.
5. Build hands and feet as deliberate geometry, not simple extruded outlines. Keep proportions understated; do not add human facial/muscle details absent from the original.
6. Inspect at least every 15 degrees around 360 degrees, including arm undersides and quarter-turn head/pelvis views. Front-view agreement alone is insufficient.
7. Validate seams, normals, disconnected slivers, self-intersections and unintended holes. Add explicit manifold/connected-component checks if useful; one mesh object is not proof.
8. If remaining procedural initially, fit a modest parameter set against all four views with silhouette/landmark losses, bounded parameters and smoothness regularization. Penalize self-intersection and unsupported asymmetry. Do not use voxel density as the main fitting tool.
9. Recheck silhouettes after smoothing, subdivision, retopology and export because each can move the outline.

Suggested fitting objective: weighted silhouette distance + landmark error + surface smoothness + penalties for self-intersection/unjustified asymmetry. Give lower confidence to occluded/inferred surfaces. Do not optimize texture-inclusive pixel error early: it can sculpt source lighting into the geometry.

### C. Establish a coherent surface

1. UV unwrap accepted geometry with sensible seams and adequate padding.
2. Project calibrated source views using depth-based visibility checks; do not project a source hand onto a hidden shoulder.
3. Keep confidence masks separate from padded colour. Blend only reliable observations and gently fill unobserved regions.
4. Choose a deliberate material strategy in the isolated preview:
   - For the closest fixed-reference presentation, bake a coherent reference appearance into one UV atlas and use restrained/unlit rendering.
   - For physically moving lighting/reflections, separate approximate albedo from baked illumination, then use matte PBR under calibrated studio lights. This requires additional reconstruction; setting roughness alone will not achieve it.
5. Normalize exposure/colour between views before blending, preserving fine construction lines.
6. Bake those lines into the atlas or use a subtle mesh-attached detail/decal layer. Avoid deep engraved grooves.
7. Inspect colour patches, texture stretch and seams at cardinal and oblique angles. Surface colour must not change because the model rotates.
8. Export versioned GLB assets and editable sources. Check scale, Y-up, front direction, normals, UVs and colour space after loading in Three.js.

### D. Runtime and final preview

1. Load exported meshes instead of generating millions of field samples on the UI thread. Keep procedural generation as an offline authoring utility if needed.
2. Maintain a high-quality source and a tested runtime mesh. Choose polygon/texture budgets using target-device profiling rather than guessed decimation limits.
3. Reuse geometry/materials when switching inspection modes; avoid unnecessary renderer destruction/recreation.
4. Add loading/error states, safe resize handling, context-loss handling and owned-resource disposal.
5. Implement the rotation controller below.
6. Retain original/reference comparison. Keep the result separate until visual acceptance and a later integration request.

## 9. Running separately from the main project

Existing comparison route, from the workspace:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/preview/reconstructed-mannequin`.

This URL worked in the earlier session. Do not assume the server is still running or that port 3000 belongs to the current workspace after the directory move. Inspect before starting/stopping processes.

Recommended stronger isolation for Antigravity:

1. Create a dedicated local copy/workspace for the study, including untracked reconstruction files, originals, derived maps, preview dependencies and package/lock/config files.
2. Do not copy secrets or deployment credentials; the mannequin preview should not need them.
3. Install dependencies in that workspace using the existing npm lockfile. Use a distinct port such as 3001 and build output belonging to that copy.
4. Run `npm run dev -- --hostname 127.0.0.1 --port 3001` there and open `http://127.0.0.1:3001/preview/reconstructed-mannequin`.
5. Never run two Next dev servers sharing the same checkout and `.next` directory. A different port alone does not isolate build output.
6. Document the exact workspace/server under review. Transfer reviewed changes only as part of a later integration task.

A Git worktree is suitable only after safely preserving/copying uncommitted and untracked work. Creating a worktree from HEAD alone loses the reconstruction. Do not kill unrelated processes or replace the main project to get the study running.

## 10. Smooth rotation: current behaviour and required improvement

### Current preview controller

- One angle ref drives `model.rotation.y` on requestAnimationFrame.
- Drag adds `dx * 0.008` radians directly to yaw and uses pointer capture.
- Release velocity is `dx * 0.3` from the most recent pointer event, without elapsed-time normalization.
- Coast advances angle by `velocity * dt`, then multiplies velocity by `exp(-4 * dt)`.
- Frame dt is capped at 0.05 seconds.
- Reduced-motion preference disables release inertia; cancellation also clears velocity.
- View buttons stop inertia and immediately assign the selected angle.
- RAF continues even while idle.

This achieves real continuous rotation but is a prototype. Release speed varies with event frequency; a held/stopped gesture may release stale momentum; preset changes are instant. Do not present these details as the final controller.

### Reuse the good motion logic without importing unwanted visuals

Read `lib/rotation-math.ts`, `lib/rotation-config.ts` and the event/animation portions of `components/TurntableRig.tsx`. Extract/adapt the motion into a preview-only helper. Do not import the whole TurntableRig viewer, which would repeat the visual substitution the user rejected.

Use states idle, dragging, coasting and programmatic turn. Keep per-frame values in refs/plain objects instead of React state updates every frame.

1. **Pointer down:** accept primary input and left mouse button; track pointer ID and capture it; stop coast/preset motion immediately; clear old velocity/samples; start from the currently displayed angle. Grabbing a moving model must not jump.
2. **Drag:** apply horizontal displacement directly. Avoid a long spring that makes the model trail the pointer. Record timestamped samples. Use the same width-aware radians-per-pixel value for drag and velocity estimation; begin near current sensitivity and tune deliberately.
3. **Release:** estimate velocity over recent samples rather than using the last displacement. Existing `estimateReleaseVelocity` uses a recent window and rejects stale release. Defaults are 90 ms history and 60 ms stale threshold; tune as needed. Clamp implausible fling speeds.
4. **Coast:** use time in seconds and exponential damping. For damping k and frame dt:

```text
q = exp(-k * dt)
angle += velocity * (1 - q) / k
velocity *= q
```

For effectively zero k, use `angle += velocity * dt`. This exact integrated travel is consistent across frame rates. Current preview k=4; shared config k=1.5 coasts longer. Compare intentionally rather than silently changing feel. Stop below a small angular-speed threshold. Keep automatic cardinal snapping disabled.

5. **Preset turns:** choose shortest path: `target = current + wrapPi(desired - current)`. Animate with critically damped interpolation or a short interruptible ease; roughly 0.2–0.3 seconds is a starting point. Pointer down interrupts immediately. Reset interpolation velocity when switching modes.
6. **Angle representation:** keep an unwrapped internal angle. Wrap for display/comparison, or rebase all related states together. No discontinuity crossing 0/360 degrees.
7. **Pointer lifecycle:** validate pointer ID; handle pointerup, pointercancel, lostpointercapture, blur and visibility changes. Cancellation must not fling. Release capture safely; reject stale motion after the user pauses before lifting.
8. **Reduced motion:** retain direct drag, disable inertia, make presets immediate or appropriately restrained. Listen for preference changes, not only pointer release.
9. **Touch/accessibility:** preserve vertical scrolling where appropriate and define horizontal gesture intent; test real touch cancellation. Provide keyboard turning, visible focus and accessible controls in the preview. No main-panel redesign is required.
10. **Rendering:** rotate the already-created mesh. Never rebuild geometry, regenerate textures, remount the canvas or select photographs during drag. Render while active and invalidate on loading, resize or material changes; stop idle RAF if no other animation requires it.
11. **Performance:** cap DPR sensibly (currently 2), preload assets and avoid allocation-heavy work in pointermove/RAF. Handle background/resume without a large jump.

Shared settings currently include maxSpeed=16 rad/s, stopSpeed=0.03 rad/s, minFlingSpeed=0.15 rad/s and smoothButton=0.28 s, with snapping disabled. These are existing starting values, not measured optimal values. Validate whether the maximum fling is too fast for inspection.

### Motion acceptance cases

- Slow drag follows the pointer without stiffness or noticeable lag.
- Fast drag releases into predictable natural coast.
- Drag, hold still, release causes no stale fling.
- Grabbing inertia/preset motion causes no jump and cancels the old motion.
- Repeated 0/360 crossings cause no reversal or texture transition.
- Equivalent timestamped gestures sampled at different event rates yield similar release velocity.
- Coast simulated at 30, 60 and 120 Hz produces essentially the same travel/decay.
- Cancellation, lost capture, resize, blur and tab resume do not leave motion stuck.
- Reduced-motion behaviour is direct and free of unintended coasting.
- Front/right/back/left buttons correspond to the correct source image.

## 11. Validation already performed and its limits

Completed successfully during the previous implementation work:

- Live browser inspection of both genders; female front/back/side and clay views; drag interaction.
- TypeScript `--noEmit` check.
- Targeted ESLint on reconstruction files and texture script.
- Two geometry tests, one per gender, including the final geometry adjustment.
- Earlier rotation-helper tests (nine tests reported in earlier work), separate from the last geometry pass.
- The reconstruction route served HTTP 200.

These checks do not certify a perfect visual match, manifoldness, mobile performance, complete accessibility or a production build. No fresh implementation test was needed merely to write this handoff; the claims above refer to prior verified work.

The current geometry tests assert: one mesh, finite positions/normals, fewer than 260,000 triangles, height 1.73–1.78, width 1.50–1.60, depth 0.20–0.35, approximate X-centering and independent cached copies. They do not check connected components, self-intersections or image agreement.

Field generation took tens of seconds in test runs and under load approached a minute per gender. These are geometry-build times, not animation frame rates. This supports moving generation offline rather than doing it on the browser UI thread.

### Reproducible checks in the isolated workspace

```powershell
npx tsc --noEmit
npx eslint lib/mannequin/reference-geometry.ts lib/mannequin/reference-geometry.test.ts lib/mannequin/reference-material.ts app/preview/reconstructed-mannequin/page.tsx scripts/build-reference-textures.cjs
npx tsc lib/mannequin/reference-geometry.test.ts --outDir .model-check --module commonjs --target es2020 --esModuleInterop --resolveJsonModule --skipLibCheck
node --test .model-check/reference-geometry.test.js
```

Wait for compilation to succeed before running the test. The previous Node 24 environment supported this compiled test arrangement and emitted a Three.js CommonJS deprecation warning. If another runtime cannot load Three.js example modules through that arrangement, use a compatible ESM test setup instead of changing geometry to suppress a tooling problem.

The earlier restricted runner required execution permission to spawn the Node test process; that was an environment issue, not a model failure. Repository-wide lint had baseline issues in TurntableRig in earlier checks. Distinguish baseline failures from new regressions.

After checks, remove only the known generated `.model-check` directory after verifying its resolved location. Do not reset unrelated edits. Keep the development server available for user review when appropriate.

### Add visual and performance evidence

1. Save fixed-camera, source-sized renders for all four views and both genders, plus front/back quarter turns. Use the same viewport and framing for before/after comparison.
2. Measure silhouette intersection-over-union, mean/95th-percentile boundary distance and landmark error. Report per region so a large torso does not hide incorrect hands or feet.
3. Possible initial target: average outline error around 1–2 source pixels and 95th-percentile error below about 4 pixels in well-observed regions. These are proposed targets, NOT achieved results or user-approved tolerances. Establish a baseline first and account for reference uncertainty.
4. Assess colour/seam agreement only after geometry/camera fitting. Report photometric differences separately from contour error.
5. Review both clay and textured modes. A painted shadow that disguises a ridge is not a geometry fix.
6. Record frame times, load times and memory on the agreed target devices. Aim for stable display refresh rather than claiming an unmeasured “60 fps.”
7. Keep uncertainty visible: unseen finger surfaces and hidden body areas may remain inferred even when all four source views fit well.

A live front comparison screenshot from the prior pass is available on the local machine at:

`C:\Users\Sal\.codex\visualizations\2026\11\01\01a1966b-945c-7460-9381-aa0911481853\mannequin-refined-preview.png`

This is supporting evidence, not a replacement for inspecting the original PNGs or current live preview. It may not accompany a repository-only transfer.

## 12. Expected deliverables from Antigravity

1. A separate runnable study with documented workspace, port and launch command.
2. Preserved originals and a reproducible mask/calibration pipeline.
3. Editable high-quality female/male models and versioned runtime assets.
4. A coherent texture/material pipeline with visibility/confidence handling and no camera-driven image transitions.
5. An interruptible, time-based controller passing the motion cases above.
6. Before/after renders and honest comparison measurements by view/body region.
7. A limitations list distinguishing observed errors from inferred hidden surfaces.
8. No main-project integration until the user accepts the separate visual result and asks for integration.

For a later authorized integration, preserve the public mannequin props/callbacks, gender/view semantics, measurement selection and landmarks, original control layout, keyboard/touch behaviour and sizing across host screens. Replace only the accepted rendering/controller layer as needed. Reproject landmarks onto the accepted mesh and verify occlusion/label placement; do not assume old landmark coordinates fit a changed body. This is future work, not part of the isolated modelling task.

## 13. Immediate next actions

1. Preserve the current working reconstruction, including untracked files, and run the dedicated preview workspace.
2. Inspect all eight original images and current clay renders; establish a measurable baseline.
3. Recover any original 3D source if available. Otherwise use the procedural blockout to build a clean editable mesh.
4. Correct shoulder/bust/pelvis/head flow, then hands and feet, before additional colour polish.
5. Bake a coherent UV surface and export runtime meshes.
6. Adapt existing controller mathematics into the preview without bringing in TurntableRig’s unwanted visuals.
7. Validate cardinal and intermediate views, interruptions, timing and resource use; present the isolated result for review.

The main lesson: faithful appearance and smooth motion must be achieved together. Keep direct, continuous 3D rotation, while letting the original mannequin images—not a generic mannequin or convenient primitive—determine the model.
