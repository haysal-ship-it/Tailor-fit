# Design Specification Implementation Plan: Clients Screen Container Hierarchy

Grounding all color fills, padding, borders, and spatial gaps strictly in the 4 design requirements identified from `Clients.png`.

---

## 1. Requirement Breakdown & Concrete Specifications

### 1. Client Directory Component (Left Column)
- **Main Container**:
  - Fill: `#FFFFFF` (`bg-[#FFFFFF]`)
  - Padding: `2px` (`p-[2px]`)
  - Corner Radius: `8px` (`rounded-[8px]`)
  - Elevation: `shadow-[0_2px_12px_rgba(0,0,0,0.03)]`
- **Inner Container**:
  - Fill: `#f8f8f8` (`bg-[#f8f8f8]`)
  - Corner Radius: `6px` (`rounded-[6px]`)
  - Internal Padding: `16px` (`p-4`)
  - Spacing: `space-y-4`
  - Content: Header title `"Client Directory"`, search bar, and recently viewed section.

### 2. Search Input Field
- **Fill**: `#f1f1f1` (`bg-[#f1f1f1]`)
- **Stroke / Border**: `#ededed` (`border border-[#ededed]`)
- **Geometry & Text**:
  - Corner Radius: `6px` (`rounded-[6px]`)
  - Height: `h-10`
  - Text: `text-[11px] text-gray-900 placeholder:text-gray-400`
  - Leading Icon: MagnifyingGlass icon with `left-3.5` offset

### 3. Recently Viewed Clients Container & Cards
- **Housing Container**:
  - Fill: `#FFFFFF` (`bg-[#FFFFFF]`)
  - Padding: `2px` (`p-[2px]`)
  - Corner Radius: `8px` (`rounded-[8px]`)
  - Gap: `flex flex-col gap-[2px]`
- **Individual Client Cards (Amanda Billings, Taylor Razaq, Chloe Dallas)**:
  - Fill: `#f8f8f8` (`bg-[#f8f8f8]`)
  - Corner Radius: `6px` (`rounded-[6px]`)
  - Spacing between each card: `2px` (`gap-[2px]`)
  - Selection: Active ring highlight (`ring-1.5 ring-[#1d4ed8]`) when selected, hover effect (`hover:bg-[#f0f0f0]`)
  - Initials Badge: White circle/square avatar with crisp typography and Phosphor `CaretRight` (weight="fill")

### 4. Right Column Cockpit (Client Profile, Body Measurement History, Order History)
- **Main Housing Container**:
  - Fill: `#FFFFFF` (`bg-[#FFFFFF]`)
  - Padding: `2px` (`p-[2px]`)
  - Corner Radius: `8px` (`rounded-[8px]`)
  - Elevation: `shadow-[0_2px_12px_rgba(0,0,0,0.03)]`
  - Spacing layout: `flex flex-col gap-[2px]`
- **Individual Child Containers**:
  1. **Client Profile Container**:
     - Fill: `#f8f8f8` (`bg-[#f8f8f8]`)
     - Corner Radius: `6px` (`rounded-[6px]`)
     - Internal Padding: `p-6 space-y-6`
     - Content: Subtitle `CLIENT PROFILE`, Name, `New Order` button, black avatar (`CD`), contact pills
  2. **Body Measurement History Container**:
     - Fill: `#f8f8f8` (`bg-[#f8f8f8]`)
     - Corner Radius: `6px` (`rounded-[6px]`)
     - Internal Padding: `p-5 space-y-4`
     - Content: Header, Add Point button, view toggle, interactive 2D anatomical mannequin graphic
  3. **Order History Container**:
     - Fill: `#f8f8f8` (`bg-[#f8f8f8]`)
     - Corner Radius: `6px` (`rounded-[6px]`)
     - Internal Padding: `p-5 space-y-4`
     - Content: Header `"Order History"`, 3 horizontal cards (Gown/Dress Urgent, Oxford Three Piece Suit Completed, Gown/Dress Pending) with black borders, style reference photos, and dark price footer
- **Container Separation**:
  - The `2px` gap between each of the three containers is created by the outer `#FFFFFF` container with `flex flex-col gap-[2px]` and `p-[2px]`.

---

## 2. File Modifications
- **`components/screens/ClientsScreen.tsx`**:
  - Update Left Column container nesting: outer `#FFFFFF` with `p-[2px] rounded-[8px]`, inner `#f8f8f8` with `rounded-[6px] p-4`.
  - Update Search Input: `bg-[#f1f1f1] border border-[#ededed] rounded-[6px]`.
  - Update Recently Viewed Clients list: outer `#FFFFFF` with `p-[2px] rounded-[8px] gap-[2px]`, cards `#f8f8f8 rounded-[6px]`.
  - Update Right Column container nesting: outer `#FFFFFF` with `p-[2px] rounded-[8px] flex flex-col gap-[2px]`, each of the 3 child sections set to `#f8f8f8 rounded-[6px]`.

---

## 3. Verification Steps
1. Verify nested container geometry on Left Column: `#FFFFFF` outer with `2px` padding, `#f8f8f8` inner.
2. Verify search input styling: `#f1f1f1` background with `#ededed` border.
3. Verify recently viewed cards: `#FFFFFF` container with `2px` padding, `#f8f8f8` cards with `2px` gap.
4. Verify right column: `#FFFFFF` container with `2px` padding housing Client Profile (`#f8f8f8`), Body Measurement History (`#f8f8f8`), and Order History (`#f8f8f8`) with `2px` gap between them.
5. Run ESLint and TypeScript compilation to guarantee zero errors.
