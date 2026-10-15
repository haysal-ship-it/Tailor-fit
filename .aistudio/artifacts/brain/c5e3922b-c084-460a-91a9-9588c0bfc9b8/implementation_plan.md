# Implementation Plan: TailorFit EasyUI Design System Overhaul

Restyle TailorFit with a complete design system inspired by [EasyUI](https://easyui.site): monochrome neutral surfaces, hairline 1px borders, pill-shaped controls, and calm spring-physics motion, preserving every existing screen, route, data model, and user workflow.

---

## 1. Architecture & Theme Tokens

### 1.1 CSS Variables (`app/globals.css`)
Define the light and dark theme palette strictly as specified:
- **Light Theme** (`:root`):
  - `--bg: #FAFAFA`
  - `--surface-1: #FFFFFF`
  - `--surface-2: #F4F4F5`
  - `--border: #E4E4E7`
  - `--border-strong: #D4D4D8`
  - `--text: #0A0A0A`
  - `--text-muted: #525252`
  - `--text-faint: #737373`
  - `--accent: #0447FF`
- **Dark Theme** (`.dark`):
  - `--bg: #050505`
  - `--surface-1: #0E0E0E`
  - `--surface-2: #151515`
  - `--border: #1F1F1F`
  - `--border-strong: #2A2A2A`
  - `--text: #FAFAFA`
  - `--text-muted: #A3A3A3`
  - `--text-faint: #8A8A8A`
  - `--accent: #5B83FF`
- **Status Colors** (Pill background = color at 12% opacity):
  - Success: `#16A34A` (light) / `#4ADE80` (dark)
  - Warning: `#D97706` (light) / `#FBBF24` (dark)
  - Danger: `#DC2626` (light) / `#F87171` (dark)
- **Rules Enforced**:
  - Elevation from surface steps (`--bg` → `--surface-1` → `--surface-2`) plus 1px `--border`, no heavy box-shadows.
  - Accent color restricted strictly to: measured hotspots, focus rings, selected calendar day, and text links.
  - Primary buttons are inverted monochrome (`bg-[var(--text)] text-[var(--bg)]`).

### 1.2 Viewport Configuration (`app/layout.tsx`)
- Remove `maximum-scale=1` and `user-scalable=no` from viewport metadata to allow natural pinch-to-zoom.
- Include client-side theme initialization script to prevent flash of wrong theme (defaulting to system preference, with `localStorage` persistence).

---

## 2. Motion Tokens (`lib/motion-tokens.ts`)

Export spring and easing physics configurations:
- `springGentle`: `{ stiffness: 170, damping: 26, mass: 0.9 }`
- `springSmooth`: `{ stiffness: 200, damping: 28, mass: 0.85 }`
- `springSnappy`: `{ stiffness: 380, damping: 30, mass: 0.5 }`
- `springMorph`: `{ stiffness: 220, damping: 32, mass: 1.0 }`
- `springResponsive`: `{ stiffness: 320, damping: 24, mass: 0.7 }`
- `springSoft`: `{ stiffness: 150, damping: 22, mass: 0.9 }`
- `easeSoft`: `{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }`
- `easeFast`: `{ duration: 0.20, ease: [0.2, 0, 0, 1] }`
- Export `useSafeMotion` helper respecting `useReducedMotion` (disables transforms, keeps instant opacity fades).

---

## 3. UI Component Library (`components/ui/`)

Build the following modular components:
1. **`Button.tsx`**:
   - Variants: `primary` (inverted monochrome `--text` fill), `secondary`, `outline`, `ghost`, `destructive`, `link`.
   - Sizes: `sm`, `md`, `lg`, `icon`. Fully pill-shaped (`rounded-full`).
   - Supports `isLoading`, `leftIcon`, `rightIcon`, `fullWidth`, `whileTap={{ scale: 0.97 }}` with `springSnappy`.
2. **`MorphingSaveButton.tsx`**:
   - Fixed-width button: `Idle` → `Loading` → `Success` (DrawCheckbox checkmark draws itself) → resets after 1.6s, plus `Error` retry state.
3. **`SegmentedControl.tsx`**:
   - Shared animated tabs with sliding pill indicator (`springSnappy` layoutId) and cross-fading content.
4. **`SpringSelect.tsx`**:
   - Dropdown opening from trigger edge with slight overshoot, rotating chevron (past 180° before settling).
5. **`Input.tsx` & `Textarea.tsx`**:
   - 12px `--text-muted` label above. 40px height desktop, 44px mobile (16px text on mobile).
   - Fill `--surface-2`, 1px `--border`. Focus tweens border to `--accent` with 2px ring scaling in.
   - Animated validation error message in danger color.
6. **`AnimatedFileUpload.tsx`**:
   - Dashed-border drop zone reacting to drag-over, per-file upload progress bar, morphing thumbnail preview with remove icon and retry.
7. **`AnimatedNumberMorph.tsx`**:
   - Tabular numerals with Geist Mono, animated rolling number counter for prices with locale commas (`₦130,000`).
8. **`DrawCheckbox.tsx`**:
   - Animated SVG stroke draw-in with tiny overshoot for measurement confirmation.
9. **`Toasts.tsx`**:
   - `VelocityToast` for action confirmations.
   - `UndoToast` (5-second countdown bar that pauses on hover) for deletions.
10. **`ExpandableDataRow.tsx`**:
    - Order row: collapsed shows initials, client name, garment, and chevron; expanded smoothly reveals price (Geist Mono), due date, status pill, and "Open order" ghost link.
11. **`ThemeToggle.tsx`**:
    - Icon-only toggle button (Sun/Moon) with gentle spring rotation.
12. **`NotificationDropdown.tsx`**:
    - Bell button with shake animation on new notifications, badge counter, and origin-expanded popover panel.
13. **`SmallFloatingDock.tsx`**:
    - Bottom fixed pill for mobile (<768px) with 3 tabs and sliding inverted pill indicator.

---

## 4. Screen Updates

### 4.1 Navbar (`components/Navbar.tsx`)
- Modern pill navigation (Overview / Clients / Settings) with shared sliding `layoutId` pill in inverted `--text` fill.
- Notification bell with badge, shake, and dropdown.
- Integrated `ThemeToggle` right next to the notification bell.

### 4.2 Overview Screen (`components/screens/OverviewScreen.tsx`)
- **Left Column** (New Client form):
  - Form fields use `Input` / `Textarea` with `--surface-2` fill and 12px labels.
  - Template selector uses `SpringSelect`.
  - Gender selector uses `SegmentedControl`.
  - Image upload uses `AnimatedFileUpload`.
- **Center Column** (Mannequin / Measurement view):
  - Segmented control toggle between Mannequin and List view.
  - Mannequin: Unmeasured points are 10px rings in `--border-strong`. Measured points are filled `--accent` with a single soft pulse. 1px dashed leader lines. Origin-anchored popover for editing (and bottom sheet on mobile).
  - List View: `--surface-1` rounded-2xl cards with Geist Mono inputs, `DrawCheckbox` confirm animation, and ghost remove button triggering `UndoToast`.
  - Single primary commit button: `MorphingSaveButton` ("Save").
- **Right Column** (Garment Calendar & Recent Orders):
  - Calendar day cells `--surface-2`, rounded-xl, Geist Mono numerals, status dots. Tapping opens Peek Card popover. Month change sliding transition.
  - Recent Orders: `ExpandableDataRow` components.

### 4.3 Clients Screen (`components/screens/ClientsScreen.tsx`)
- Expandable search pill with clear button.
- Remove "Recently Viewed Clients" label while searching.
- Read-only historical mannequin with reduced opacity and origin popovers disabled.
- Aligned measurement list view with Geist Mono tabular numbers.
- Order history cards in `--surface-1 rounded-2xl`, status pill top-right, 3-up thumbnail grid, hairline price row.
- Single primary button: `New Order`.

### 4.4 Settings Screen (`components/screens/SettingsScreen.tsx`)
- Single primary button: `Save Changes`.
- Sub-item buttons (`Add Template`, `Add Measurement`) use outline pills.
- Tag chips as pills on `--surface-2`.
- Blueprint "+3 more" smoothly expands inline with accordion motion.
- Currency selection cards with `--accent` border and check icon.

---

## 5. Responsive Behavior (Section 7 Rules)
- **Desktop (≥1280px)**: 3-column layout, card padding 24px.
- **Tablet (768–1279px)**: 2 columns (form + mannequin); calendar/orders moves below as a collapsible section.
- **Mobile (<768px)**: Single column showing one panel at a time, switched by `SmallFloatingDock` fixed to bottom with safe-area padding. Card padding 16px. All tap targets ≥44px.

---

## 6. Verification Plan
- **Linting & Compilation**: `npm run lint` and `npm run build` to ensure zero errors.
- **Theme Verification**: Toggle light and dark modes, verify all contrast ratios and `--surface` steps.
- **Motion Verification**: Confirm spring physics on button taps, popovers, tabs, and reduced-motion compliance.
- **Interactive Walkthrough**: Test order intake save, mannequin hotspot popovers, measurement list edits, undo toasts, calendar peek card, and responsive breakpoints.
