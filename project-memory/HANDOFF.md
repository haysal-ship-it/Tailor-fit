# TailorFit — 3D Mannequin Handoff & Verification Log

## Current Stage
- **Stage 1 (Approved by User)**: Adult Female 3D Mannequin Orthographic Reference Sheet (`/preview/female-mannequin`).
- **Stage 2 (Approved by User)**: Adult Male 3D Mannequin Orthographic Reference Sheet (`/preview/male-mannequin`).
- **Stage 3 (Integrated Across App)**: Interactive 360° Rotatable 3D Mannequin (`components/mannequin/RotatableMannequin.tsx`) replacing static PNG/SVG mannequins across all application screens and modals.

---

## Architecture & Implementation Details

### 1. Centralized Skin Material (`lib/mannequin/material.ts`)
- **Base Albedo Constant**: `MANNEQUIN_SKIN_HEX = '#C9AB84'` (`RGB: 201, 171, 132`).
- **Surface Finish**: Smooth, matte mannequin-resin finish in warm tan-beige `#C9AB84` under soft neutral studio lighting with subtle floor-contact shadows and tailor construction seam lines.

### 2. Spine-Aligned Transparent Studio Assets (`public/assets/`)
- **Transparent 4-View Turntable Assets (`636 × 730`, aligned to spine axis `x = 318.0`)**:
  - Female: `mannequin-female-front.png` (`0°`), `mannequin-female-left.png` (`90°`), `mannequin-female-back.png` (`180°`), `mannequin-female-right.png` (`270°`).
  - Male: `mannequin-male-front.png` (`0°`), `mannequin-male-left.png` (`90°`), `mannequin-male-back.png` (`180°`), `mannequin-male-right.png` (`270°`).
- **Orthographic Reference Sheets**:
  - Female: `mannequin-female-tpose-sheet.png`, `mannequin-female-tpose-front.png`, `mannequin-female-tpose-left.png`, `mannequin-female-tpose-back.png`.
  - Male: `mannequin-male-tpose-sheet.png`, `mannequin-male-tpose-front.png`, `mannequin-male-tpose-left.png`, `mannequin-male-tpose-back.png`.

### 3. Interactive Rotatable Component & Integrated Screens
- **`components/mannequin/RotatableMannequin.tsx`**:
  - Supports pointer drag-to-rotate (`0°–360°`), keyboard arrow rotation, quick orthographic angle pills (`Front`, `Left`, `Back`, `Right`), `90°` step rotation button, and `Female` / `Male` gender switching.
  - Projects 3D anatomical measurement landmarks (`Neck`, `Shoulder`, `Bust`, `Back`, `Sleeve`, `Waist`, `Hip`, `Thigh`) with `#079BF8` dashed leader lines and clickable labels that orbit around the spine axis.
- **Integrated Screens**:
  - `components/screens/OverviewScreen.tsx`
  - `components/screens/ClientsScreen.tsx`
  - `components/screens/OrderFormModal.tsx`
  - `components/AtelierMannequin.tsx` & `components/screens/ClientProfileScreen.tsx`
  - `components/BodyDiagram.tsx` & `components/screens/MeasurementCaptureScreen.tsx`
  - `components/mannequin/FemaleMannequinReference.tsx` & `components/mannequin/MaleMannequinReference.tsx`
