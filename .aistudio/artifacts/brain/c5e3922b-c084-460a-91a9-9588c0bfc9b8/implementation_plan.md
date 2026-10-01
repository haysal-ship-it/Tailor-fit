# 2px Container Rhythm & Phosphor Icons (Filled) Migration Plan

Architecture and implementation plan to enforce a uniform 2px gap rhythm between all inner cards on the Overview, Clients, and Settings screens, and migrate all iconography to `@phosphor-icons/react` with filled weight (`weight="fill"`).

## User Review & Critical Decisions

> [!IMPORTANT]
> The following explicit decisions and design requirements have been confirmed:

- **Confirmed Decision 1 (Phosphor Icons with Filled Weight)**: Install `@phosphor-icons/react` and replace `lucide-react` across navigation, action buttons, landmark indicators, and screen components. All primary icons and action elements will use `weight="fill"` for a bold, distinctive silhouette.
- **Confirmed Decision 2 (Overview Page 2px Container Alignment)**:
  - Outer white container: `bg-white p-[2px] rounded-[10px] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-[2px]`.
  - Top row: New Client container (`bg-[#f8f8f8]`) and Mannequin container (`bg-[#f8f8f8]`) arranged side-by-side with a strict 2px gap (`grid grid-cols-1 lg:grid-cols-12 gap-[2px]`).
  - Bottom row: Save button container (`bg-[#f8f8f8]`) placed 2px directly below the top row with `p-2 flex justify-end`.
- **Confirmed Decision 3 (Clients Page 2px Container Alignment)**:
  - Right dossier column outer container: `bg-white p-[2px] rounded-[10px] flex flex-col gap-[2px]`.
  - Inner container 1: Client Profile container (`bg-[#f8f8f8]`).
  - Inner container 2: Body Measurement History container (`bg-[#f8f8f8]`).
  - Inner container 3: Order History container (`bg-[#f8f8f8]`).
  - All three separated by a strict 2px vertical gap (`gap-[2px]`).
- **Confirmed Decision 4 (Settings Page 2px Container Alignment)**:
  - Right configuration column outer container: `bg-white p-[2px] rounded-[10px] flex flex-col gap-[2px]`.
  - Inner container 1: Measurement and Billing Standards (`bg-[#f8f8f8]`).
  - Inner container 2: Garment Blueprints (`bg-[#f8f8f8]`).
  - Inner container 3: Sizing/Measurements (`bg-[#f8f8f8]`).
  - All three separated by a strict 2px vertical gap (`gap-[2px]`) with no white border strokes.

---

## 1. Overview & Core Concept

- **What It Delivers**:
  1. Complete icon pack migration from Lucide to Phosphor Icons (`@phosphor-icons/react`) with filled weight (`weight="fill"`) across all screens, headers, buttons, cards, and modal sheets.
  2. Exact, standardized 2px inner container spacing rhythm on the Overview cockpit, Clients profile dossier, and Settings configuration view.
- **Key Value**: Delivers the tactile, pixel-perfect feel of the original design mockups with crisp 2px insets and rich, solid Phosphor silhouettes.

---

## 2. User Experience & Visual Design

### Key User Flows & Visual Enhancements

1. **Navigation Bar (`Navbar.tsx`)**:
   - Floating header with 2px white border and `#f8f8f8` inner pill.
   - Phosphor Filled Icons: `House` (fill) for Overview, `Users` (fill) for Clients, `Gear` (fill) for Settings, and `Bell` (fill) for alerts.

2. **Overview Cockpit (`OverviewScreen.tsx`)**:
   - Left parent white shell (`p-[2px] gap-[2px]`):
     - Child 1: New Client Card (`bg-[#f8f8f8]`).
     - Child 2: Mannequin Card (`bg-[#f8f8f8]`).
       - Header actions: `Plus` (bold/fill) for Add Point, `User` (fill) and `List` (fill) for view toggle.
     - 2px gap between Child 1 and Child 2 on desktop (`gap-[2px]`).
     - Child 3: Save button card (`bg-[#f8f8f8]`) positioned 2px below with `FloppyDisk` (fill).
   - Right parent white shell (`p-[2px] gap-[2px]`):
     - Child 1: Garment's Calendar (`bg-[#f8f8f8]`).
     - Child 2: Recent Orders (`bg-[#f8f8f8]`) with `CaretRight` (fill) navigation directing to client profile.

3. **Clients Screen (`ClientsScreen.tsx`)**:
   - Left column: Client Directory search bar with `MagnifyingGlass` (fill/bold).
   - Right column parent white shell (`p-[2px] gap-[2px]`):
     - Card 1: Client Profile Header with `Plus` (bold/fill) for New Order, `Phone` (fill), and `EnvelopeSimple` (fill).
     - Card 2: Body Measurement History with `Plus` (bold/fill) Add Point, `User` (fill), and `List` (fill) toggle.
     - Card 3: Order History with `Clock` (fill), `Scissors` (fill), and status badges.
     - All 3 cards vertically stacked with strict 2px gap.

4. **Settings Screen (`SettingsScreen.tsx`)**:
   - Left column: Settings Navigation with `Ruler` (fill), `BookOpen` (fill), and `Tape` (fill).
   - Right column parent white shell (`p-[2px] gap-[2px]`):
     - Card 1: Measurement & Billing Standards (`bg-[#f8f8f8]`).
     - Card 2: Garment Blueprints (`bg-[#f8f8f8]`) with `Plus` (fill) Add Template.
     - Card 3: Sizing/Measurements (`bg-[#f8f8f8]`) with `Plus` (fill) Add Measurement.
     - All 3 cards vertically stacked with strict 2px gap and no borders.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Phosphor Icons Package Selection**:
  - *Chosen Approach*: Install `@phosphor-icons/react` and use `weight="fill"` for primary icons.
  - *Why*: It is the official React implementation of Phosphor Icons, provides full tree-shaking, supports standard size and weight props (`weight="fill"`), and integrates smoothly with Tailwind CSS class names.
- **Decision 2: Uniform 2px Spacing Technique**:
  - *Chosen Approach*: Parent container uses `p-[2px] gap-[2px] bg-white rounded-[10px]`, and child cards use `bg-[#f8f8f8] rounded-[8px]`.
  - *Why*: Eliminates arbitrary margins or thick border hacks. CSS flexbox/grid `gap-[2px]` guarantees mathematical precision between all adjacent cards.

---

## 4. Technical Architecture & Data Strategy

### Component Layout & Icon Mapping Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│ Navbar: bg-white p-[2px] rounded-full                                  │
│   └─ Inner: bg-[#f8f8f8] px-6 py-2 rounded-full                        │
│       ├─ Logo: TailorFit Geometric Mark                                │
│       ├─ Center: [ House (fill) | Users (fill) | Gear (fill) ]         │
│       └─ Right: Bell (fill) Circle Button                              │
└────────────────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼                                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│ Left Parent Shell (p-[2px] gap-[2px])│  │ Right Parent Shell (p-[2px]) │
│ ┌──────────────────┬───────────────┐ │  │ ┌──────────────────────────┐ │
│ │ New Client       │ Mannequin     │ │  │ │ Garment's Calendar      │ │
│ │ bg-[#f8f8f8]     │ bg-[#f8f8f8]  │ │  │ │ bg-[#f8f8f8]            │ │
│ │                  │ User/List     │ │  │ └──────────────────────────┘ │
│ └──────────────────┴───────────────┘ │  │               ▲              │
│                  ▲ 2px gap           │  │               │ 2px gap      │
│ ┌──────────────────────────────────┐ │  │ ┌──────────────────────────┐ │
│ │ Save Container: bg-[#f8f8f8]     │ │  │ │ Recent Orders            │ │
│ │ FloppyDisk (fill) Save Button    │ │  │ │ CaretRight (fill) Links  │ │
│ └──────────────────────────────────┘ │  │ └──────────────────────────┘ │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### Phosphor Icon Replacement Mapping

| Lucide Icon | Phosphor Replacement (`@phosphor-icons/react`) | Weight |
|---|---|---|
| `Home` | `House` | `fill` |
| `Users` | `Users` | `fill` |
| `Settings` | `Gear` | `fill` |
| `Bell` | `Bell` | `fill` |
| `Save` | `FloppyDisk` | `fill` |
| `Plus` | `Plus` | `bold` / `fill` |
| `User` | `User` | `fill` |
| `List` | `List` | `fill` |
| `ChevronRight` | `CaretRight` | `fill` |
| `Search` | `MagnifyingGlass` | `bold` |
| `Phone` | `Phone` | `fill` |
| `Mail` | `EnvelopeSimple` | `fill` |
| `Clock` | `Clock` | `fill` |
| `Scissors` | `Scissors` | `fill` |
| `X` | `X` | `bold` |
| `Trash2` | `Trash` | `fill` |
| `Edit2` | `PencilSimple` | `fill` |
| `Calendar` | `CalendarBlank` | `fill` |

---

## 5. Execution Strategy

1. **Dependency Installation**: Run `install_applet_package` with `@phosphor-icons/react`.
2. **Icon & 2px Spacing Updates**:
   - `components/Navbar.tsx`: Swap Lucide icons for Phosphor filled icons (`House`, `Users`, `Gear`, `Bell`).
   - `components/screens/OverviewScreen.tsx`: Enforce 2px grid gap on New Client & Mannequin row, 2px gap to Save card, and replace all icons with Phosphor filled icons.
   - `components/screens/ClientsScreen.tsx`: Verify 2px gap between Client Profile, Body Measurement History, and Order History containers; replace all icons with Phosphor filled icons.
   - `components/screens/SettingsScreen.tsx`: Verify 2px gap between the 3 settings cards; replace icons with Phosphor filled icons.
   - Secondary modals/screens (`OrderFormModal.tsx`, `ClientProfileScreen.tsx`, `OrdersScreen.tsx`): Update to Phosphor icons.
3. **Verification**: Run `compile_applet` and `lint_applet` to confirm successful build.
