# Plan: Responsive Modals (Web Backdrop Blur) & Bottom Sheet Drawers (Mobile)

Build and integrate pixel-accurate modal experiences matching `template modal.png`, `Mobile template modal.png`, `Overview modal point.png`, and `Mobile modal bottomsheet.png`.

---

## 1. Architecture & Responsive Dual-Presentation

Both dialogs will be responsive:
- **Desktop (Web, `sm:` and above)**: Centered floating card with heavy backdrop blur (`backdrop-blur-md bg-black/40`), soft drop shadows (`shadow-2xl`), and rounded corners (`rounded-3xl`).
- **Mobile (`< sm` / viewport under 640px)**: Slide-up bottom sheet drawer docked to screen bottom (`fixed inset-x-0 bottom-0 rounded-t-3xl`), featuring a dark top drag handle (`w-12 h-1 bg-black rounded-full mx-auto`), full touch ergonomics, and flexible vertical scrolling.

---

## 2. Dialog 1: Garment Templates Modal & Bottom Sheet Drawer
Triggered by pressing the **Choose Template** button in the New Client intake card.

### Content & Visuals (Matching `template modal.png` & `Mobile template modal.png`):
- **Header**:
  - Title: `Garment Templates` (bold typography, matching atelier style)
  - Subtitle: `Browse through available templates that suit all your bespoke needs.`
- **Templates**:
  1. **Shirt/Blouse** — *Essential measurements for bespoke dress shirts/blouses*
  2. **Trousers/shorts** — *Fittings for tailored pants, trousers, pleated pants and shorts.*
  3. **Gown/Dress** — *Evening wears, party gowns, wedding dress etc*
  4. **Suits/Blazers** — *Full bespoke fitting of two piece suits or blazers and trousers*
- **Layout**:
  - **Desktop**: 2x2 grid of selectable cards (`grid-cols-2 gap-4`).
  - **Mobile**: Single-column vertical stack (`flex flex-col gap-3`).
- **Card States**:
  - **Selected**: Royal blue border (`border-2 border-[#1D4ED8] bg-blue-50/20`), blue title text (`text-[#1D4ED8] font-bold`).
  - **Unselected**: Subtle neutral border (`border border-gray-200/80 bg-white hover:border-gray-300`).
- **Footer Actions**:
  - **Cancel** pill button (`rounded-full bg-[#F3F4F6] text-gray-700 font-semibold px-8 py-3 text-sm hover:bg-gray-200`).
  - **Choose Template** primary pill button (`rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold px-8 py-3 text-sm shadow-xs`).
- **Interactions & Pre-fills**:
  - When confirmed, sets the selected template, updates the Garment Type input field in the New Client form, and selects standard measurement presets.

---

## 3. Dialog 2: Set Point Size Modal & Bottom Sheet Drawer
Triggered when tapping individual points/landmarks on the mannequin or pressing "+ Add Point".

### Content & Visuals (Matching `Overview modal point.png` & `Mobile modal bottomsheet.png`):
- **Header**:
  - Title: `Set point size` (bold, clean typography)
- **Body Row**:
  - **Label**: Active landmark name (e.g. `Sleeve`, `Neck`, `Bust`, `Waist`, `Shoulder`, `Thigh`) on the left.
  - **Input Capsule**: `bg-[#F8F8F8] border border-gray-200/80 rounded-xl px-4 py-2 flex items-center justify-between gap-3`.
    - Numerical input with formatted value (or placeholder `0.0`), right-aligned text.
    - Unit label: `CM` (or `IN` based on active atelier unit).
- **Footer Actions**:
  - **Cancel** pill button (`rounded-full bg-[#F3F4F6] text-gray-700 font-semibold px-6 py-2.5 text-xs hover:bg-gray-200`).
  - **Add Point** primary pill button (`rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold px-6 py-2.5 text-xs shadow-xs`).
- **Interactions**:
  - Updates the active mannequin landmark measurement in real time and updates the measurement list and table view.

---

## 4. Implementation Steps

1. **Update `components/AtelierMannequin.tsx`**:
   - Update landmark click handler so clicking a landmark opens the new responsive "Set point size" dialog rather than the inline bottom bar.
   - Pass landmark key, display name, current value, and unit to the modal.

2. **Update `components/screens/OverviewScreen.tsx`**:
   - Replace the legacy inline template dropdown with the full Garment Templates dialog (desktop centered modal with blur + mobile bottom sheet drawer).
   - Integrate the "Set point size" modal & bottom sheet drawer with state connected to both the mannequin SVG points and the Add Point action.

3. **Responsive & Backdrop Blur Styling**:
   - Shared backdrop with `fixed inset-0 z-50 bg-black/40 backdrop-blur-md transition-opacity`.
   - Desktop wrapper: `hidden sm:flex items-center justify-center p-4 min-h-screen`.
   - Mobile wrapper: `flex sm:hidden fixed inset-x-0 bottom-0 z-50`.
   - Mobile top drag handle indicator: `w-12 h-1 bg-black rounded-full mx-auto mb-4`.

4. **Verification**:
   - Run `lint_applet` and `compile_applet`.
   - Verify desktop view displays centered modals with backdrop blur and mobile viewport displays smooth bottom sheet drawers.
