# Implementation Plan: Exact 1:1 Match with Attached Design Screens

Revise the TailorFit web application to strictly replicate the exact design style, 3-column cockpit layout, visual hierarchy, components, and copy texts from the 4 attached design images (**Overview.png**, **table view.png**, **Clients.png**, and **Settings.png**), removing all extraneous elements not present in the designs.

---

## 1. Global Navigation Bar (`components/Navbar.tsx`)

### Exact Structure & Copy:
- **Brand Logo & Wordmark**:
  - Origami folded geometric "T" icon (Cyan, Cobalt, Indigo, Blue facets) + bold black `TailorFit` wordmark.
- **Center Capsule Navigation Pill**:
  - Black rounded-full container (`bg-[#0a0a0a] text-white p-1 rounded-full flex gap-1 shadow-md`).
  - Tab 1: `Overview` with Home/Cube icon (`Home` or `Layers`). Active state: white rounded pill, black text and icon, font bold.
  - Tab 2: `Clients` with dual user avatar icon (`Users`). Inactive state: black background, light text.
  - Tab 3: `Settings` with gear cog icon (`Settings`). Inactive state: black background, light text.
- **Right Action**:
  - Only a circular white button with a solid monochrome black bell icon (`Bell`), matching the mockup.
  - **No extra buttons** in the navbar (remove "+ New Order", "+ New Client", and avatar pills not present in the mockup).

---

## 2. Overview Screen & Table View (`components/screens/OverviewScreen.tsx`)

### Exact 3-Column Layout:
The screen consists of three elevated white cards with light borders on a canvas background (`#eaedf0`):

### Column 1 (Left): "New Client" Intake Card
- **Header**:
  - Title: `New Client` (bold font, tracking tight).
  - Top Template & Gender Pill:
    - Large rounded pill dropdown: `Choose Template` with dropdown chevron.
    - Segmented circle toggle: `[ M | F ]` (M: blue active circle `bg-[#1d4ed8] text-white`, F: white circle).
- **Basic Information Section**:
  - Subheading: `Basic Information`
  - 2x2 grid of rounded text inputs:
    - `Client` with placeholder `e.g Adriana Kunle`
    - `Garment Type` with placeholder `Bespoke African Gown`
    - `Phone Number` with placeholder `+234 - `
    - `Email Address` with placeholder `name@example.com`
- **Style References Section**:
  - Subheading: `Style References`
  - Dashed rectangular border area with circular upload arrow icon and label `Tap to upload image`.
- **Price /Due date Section**:
  - Subheading: `Price /Due date`
  - 2-column grid:
    - `Price (₦)` with placeholder `₦0.00`
    - `Due Date` with placeholder `09/10/2026`
- **Notes Section**:
  - Subheading: `Notes`
  - Subtitle: `Workroom notes and fabric details`
  - Textarea with placeholder: `e.g hand stiched, monogram design on wrist and gold buttons`

### Column 2 (Center): "Mannequin" View OR "Measurement List View" (Toggleable)
- **Top Bar**:
  - When in Mannequin View (`Overview.png`):
    - Title: `Mannequin`
    - Subtitle: `All available points • Feminine Form`
  - When in Table View (`table view.png`):
    - Title: `Measurement List View`
    - Subtitle: `Fast keyboard entry for all garment fields`
  - Right Controls:
    - Blue pill button: `Add Point` (`bg-[#1d4ed8] text-white px-4 py-1.5 rounded-full text-xs font-semibold`)
    - Segmented Icon Toggle:
      - Icon 1: Mannequin / Person silhouette (`User` / `Shirt`)
      - Icon 2: List / Table view (`List` / `Table`)
      - Active icon is encircled in blue `bg-[#1d4ed8] text-white`; clicking switches between Mannequin View and Measurement List View!
- **Center Content: Mannequin View**:
  - Stylized 3D mannequin figure with distinct color-blocked anatomical zones:
    - Turquoise upper chest/bust
    - Dark navy/black waist midriff band
    - Turquoise legs/thighs
    - White neck, arms, and hips
  - 6 Anatomical Pointer Callouts with target nodes and dashed leader lines:
    - Left side: `Neck`, `Waist`
    - Right side: `Shoulder`, `Bust`, `Sleeve`, `Thigh`
- **Center Content: Measurement List View** (`table view.png`):
  - 3x4 grid of rounded white measurement cards:
    - Card 1: `Shoulder width` with top-right `X`, input `0.0`, green checkmark
    - Card 2: `Neck` with `X`, input `0.0`, green checkmark
    - Card 3: `Bust/Chest` with `X`, input `0.0`, green checkmark
    - Card 4: `Ankle` with `X`, input `0.0`, green checkmark
    - Card 5: `Hip` with `X`, input `0.0`, green checkmark
    - Card 6: `Wrist` with `X`, input `0.0`, green checkmark
    - Card 7: `Sleeve` with `X`, input `0.0`, green checkmark
    - Card 8: `Waist` with `X`, input `0.0`, green checkmark
    - Card 9: `Back` with `X`, input `0.0`, green checkmark
    - Card 10: `Neck to Waist` with `X`, input `0.0`, green checkmark
    - Card 11: `Neck to Ankle` with `X`, input `0.0`, green checkmark
- **Bottom Right Floating Button**:
  - Blue pill button: `Save` with floppy disk icon (`Save` / `Disk`) floating at the bottom right.

### Column 3 (Right): "Garment's Calendar" & "Recent Orders"
- **Top Section: Garment's Calendar**:
  - Header: `Garment's Calendar`
  - Weekday columns: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun` (with `Wed` bold/highlighted).
  - Days 1 to 31 with status indicator dots:
    - Day 7: Red dot (`Paused`)
    - Day 17: Green dot (`Completed`)
    - Day 23: Yellow dot (`Pending`)
  - Status Legend below:
    - Yellow dot: `Pending`
    - Green dot: `Completed`
    - Red dot: `Paused`
- **Bottom Section: Recent Orders / Garment Orders**:
  - Header: `Recent Orders` (or `Garment Orders`)
  - 3 items with circular monogram avatars, bold client names, garment subtitles, and right navigation chevrons `>`:
    - `CD` - `Chloe Dallas` • `Bespoke African Gown` `>`
    - `TR` - `Taylor Razaq` • `Bespoke African Gown` `>`
    - `BM` - `Bryan Muhammed` • `Bespoke African Gown` `>`

---

## 3. Clients Screen (`components/screens/ClientsScreen.tsx`)

### Left Sidebar: "Client Directory"
- Title: `Client Directory`
- Search bar: `Search clients by name, phone number, email...` with magnifying glass icon.
- Subheading: `Recently Viewed Clients`
- List items:
  - Avatar `CD` in circle, `Amanda Billings`, `+23740930299`, right chevron `>`
  - Avatar `TR` in circle, `Taylor Razaq`, `+44740930509`, right chevron `>`

### Right Container: Client Profile Dossier (`Clients.png`)
- **Top Bar**:
  - Small uppercase label: `CLIENT PROFILE`
  - Title: `Chloe Dallas`
  - Far Right: Blue pill button `New Order` (`bg-[#1d4ed8] text-white px-5 py-2 rounded-full font-semibold text-xs`)
- **Center Client Identity**:
  - Large black circular avatar with white text `CD`
  - Name: `Chloe Dallas` (bold title)
  - Subtitle: `Client since Jun 2025`
  - Contact row: Phone icon + `+234 8141 432 211`, Mail icon + `chloedallas@email.com`
- **Middle Section: Body Measurement History**:
  - Header: `Body Measurement History`
  - Subheader: `Mannequin`, `All available points • Feminine Form`
  - Right Controls: Blue pill button `Add Point`, segmented icon toggle (mannequin vs list view)
  - Color-blocked Mannequin figure with the exact 6 anatomical pointer lines (`Neck`, `Waist`, `Shoulder`, `Bust`, `Sleeve`, `Thigh`).
- **Bottom Section: Order History**:
  - Heading: `Order History`
  - 3 horizontal cards side-by-side:
    - **Card 1**:
      - Title: `Gown/ Dress`, orange pill badge `Urgent`
      - Subtitle: `Size taken on 09-10-2025`
      - Label: `Style references`
      - 3 reference photo thumbnails in a row with rounded corners
      - Black footer: `Price` on left, `₦130,000` on right
    - **Card 2**:
      - Title: `Oxford Three Piece Suit`, green pill badge `Completed`
      - Subtitle: `Size taken on 09-10-2025`
      - Label: `Style references`
      - 3 reference photo thumbnails in a row
      - Black footer: `Price` on left, `₦230,000` on right
    - **Card 3**:
      - Title: `Gown/ Dress`, yellow-green pill badge `Pending`
      - Subtitle: `Size taken on 09-10-2025`
      - Label: `Style references`
      - 3 reference photo thumbnails in a row
      - Black footer: `Price` on left, `₦130,000` on right

---

## 4. Settings Screen (`components/screens/SettingsScreen.tsx`)

### Left Sidebar: "Settings"
- Title: `Settings`
- Exactly 3 navigation items:
  1. `Measurement & Billing Standards` (active: blue text, light blue background `#eef2ff`)
  2. `Garment Blueprints` (inactive: gray text)
  3. `Sizing/measurements` (inactive: gray text)

### Right Panel:
- **Section 1: Measurement & Billing Standards**:
  - Small uppercase label: `DEFAULT UNITS AND CURRENCY SYMBOLS`
  - Heading: `Measurement & Billing Standards`
  - Field: `Default Mesurement Unit` (exact mockup spelling)
    - Blue active pill: `Centimeteres (cm)` (exact mockup spelling)
    - White inactive pill: `Inches (“)`
  - Field: `Preferred Currency`
    - 4 large rectangular cards in a horizontal row:
      1. `NGN (₦)` (selected with blue border)
      2. `US Dollar ($)`
      3. `Euro ()` (exact mockup copy)
      4. `Pounds (` (exact mockup copy)
- **Section 2: Garments Blueprints**:
  - Small uppercase label: `TAILORING TEMPLATES`
  - Heading: `Garments Blueprints`
  - Blue pill button on far right: `Add Template`
  - 2x2 grid of cards:
    - Card 1: `Bespoke African Gown` (Description: `Traditional african couture gown, bridal styles corset-backed silhouettes and embellished trains`, Pills: `neck`, `sleeves`, `bust`, `waist`, `+3 more`)
    - Card 2: `Shirt/Blouse` (Description: `Essential measurements for bespoke dress shirts, casual button downs and tailored blouses`, Pills: `neck`, `sleeves`, `bust`, `waist`, `+4 more`)
    - Card 3: `Trousers` (Description: `Fittings for tailored pants, pleated trouses and custom chinos/pants`, Pills: `neck`, `sleeves`, `bust`, `waist`, `+3 more`)
    - Card 4: `Bespoke African Gown` (Description: `Traditional african couture gown, bridal styles corset-backed silhouettes and embellished trains`, Pills: `neck`, `sleeves`, `bust`, `waist`, `+3 more`)
- **Section 3: Sizing/Measurements**:
  - Small uppercase label: `Standard Tape Measurements`
  - Heading: `Sizing/Measurements`
  - Blue pill button on far right: `Add Measurement`
  - 2x4 grid of cards (4 columns x 2 rows):
    - Card 1: `Shoulder width` • `Upper Body`
    - Card 2: `Neck Circumference` • `Head/Neck`
    - Card 3: `Bust/Chest` • `Upper Body`
    - Card 4: `Waist Circumference` • `Upper Body`
    - Card 5: `Hip Circumference` • `Lower Body`
    - Card 6: `Inseam Length` • `Lower Body`
    - Card 7: `Nape to Waist` • `Upper Body`
    - Card 8: `Back Width` • `Upper Body`

---

## 5. Verification & Testing
1. **Compilation Check**: Run `compile_applet` and verify successful build with zero errors.
2. **Lint Check**: Run `lint_applet` to ensure adherence to clean code rules.
3. **Exact Visual Alignment Check**:
   - Verify `Overview` has the exact 3 columns: New Client card on left, Mannequin with pointers in center, Calendar & Recent Orders on right.
   - Verify toggling to `table view` switches the center card to the 3x4 `Measurement List View` without altering left or right columns.
   - Verify `Clients` renders the Left Directory + Right Hero ("CD" Chloe Dallas, Mannequin diagram, and 3-card Order History with photos and dark price footers).
   - Verify `Settings` renders the 3-item left sidebar and exact 3 sections with exact copy.
