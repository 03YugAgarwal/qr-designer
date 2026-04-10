# Design System: Editorial Utility & Precision

## 1. Overview & Creative North Star
### The Creative North Star: "The Digital Architect"
This design system rejects the "utilitarian-only" aesthetic of standard tools. Instead, it positions the user as a high-end designer. We move beyond the "template" look by treating the interface as a digital canvas—blending the structured precision of a CAD tool with the airy, luxurious feel of a fashion editorial.

To achieve this, the system leverages **Intentional Asymmetry** and **Tonal Depth**. We prioritize breathing room (negative space) and use typographic scale to create a clear narrative path. By overlapping elements and using varied container elevations, we create a UI that feels curated, not just generated.

---

## 2. Colors & Surface Philosophy
The palette is anchored in deep, sophisticated indigos contrasted against electric, hyper-modern cyans. This creates a "dark mode" that feels expensive rather than just "dim."

### The "No-Line" Rule
**Explicit Instruction:** Solid 1px borders are strictly prohibited for sectioning or containment. 
Structure must be defined through:
- **Background Color Shifts:** Use `surface-container-low` against `surface` to define regions.
- **Tonal Transitions:** Soft shifts between `surface-container` tiers.
- **Vertical Rhythm:** Using space as the primary separator.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of smoked glass and matte metal. 
- **Base Layer:** `surface` (#121416)
- **Primary Workspaces:** `surface-container-low` (#1a1c1e)
- **Interactive Modules:** `surface-container-high` (#282a2c)
- **Active Overlays:** `surface-container-highest` (#333537)

### The "Glass & Gradient" Rule
To elevate the experience, floating elements (like the QR Code Preview panel) should utilize **Glassmorphism**:
- **Background:** `surface_variant` at 60% opacity.
- **Effect:** `backdrop-blur: 24px`.
- **Signature Gradient:** Use a subtle linear gradient from `primary_container` (#2243ea) to `secondary_container` (#00e3fd) at 15% opacity to give containers a "soul" and depth.

---

## 3. Typography
We utilize a dual-sans-serif approach to balance "Creative Studio" (Display) with "Utility Tool" (Function).

*   **Display & Headlines (Manrope):** A geometric sans-serif that feels architectural. Use `display-lg` (3.5rem) for hero moments—like the number of scans or the "Create" prompt—to establish an editorial hierarchy.
*   **Body & Titles (Plus Jakarta Sans):** A modern, highly legible font for technical settings and labels.
*   **The Hierarchy Strategy:** Use `title-lg` for section headers but keep them in `on_surface_variant` (#c5c5d4) to allow the primary `display` numbers or the QR code itself to remain the focal point.

---

## 4. Elevation & Depth
Traditional drop shadows are too "standard." This system uses light and layer stacking.

*   **The Layering Principle:** A card should not sit *on* a page; it should be *within* it. Place `surface-container-lowest` cards inside a `surface-container-low` section. This "recessed" look feels more intentional and premium.
*   **Ambient Shadows:** For floating modals, use a diffused shadow: `0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow must never be pure black; it should feel like a shadow cast by the deep indigo `surface`.
*   **The "Ghost Border":** If accessibility requires a stroke, use `outline_variant` at **15% opacity**. This creates a suggestion of a boundary without breaking the "No-Line" rule.

---

## 5. Components

### Buttons
*   **Primary:** High-gloss. Background is `primary` (#bbc3ff) with a subtle `secondary_container` gradient overlay. Label uses `on_primary` (#001d93). Radius: `lg` (1rem).
*   **Secondary:** Glass-style. `surface_variant` with a `backdrop-blur`. 
*   **Tertiary:** No background. `primary` text with a `label-md` weight.

### Inputs & QR Controls
*   **Fields:** Background `surface_container_highest`. Radius: `md`. No border. On focus, a subtle glow of `secondary` (#bdf4ff) at 20% opacity should emanate from the container.
*   **Sliders (for QR customization):** The track should be `outline_variant`, and the thumb should be a vibrant `secondary_fixed_dim` (#00daf3) circle with a soft `lg` radius.

### Cards & QR Previews
*   **The "No Divider" Rule:** Never use a horizontal line to separate content. Use a `1.5rem` (xl) vertical gap or a shift from `surface-container-low` to `surface-container-high`.
*   **Preview Canvas:** The QR code should sit on a `surface_bright` (#37393b) canvas to ensure the "designer" elements pop against the dark UI.

### Interactive Chips
*   For selecting QR styles (Round, Square, Pixelated). Use `secondary_container` for the active state with `on_secondary_container` text. Unselected chips should be `surface_container_highest`.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical padding. Give the QR Preview panel significantly more breathing room than the settings sidebar.
*   **Do** use `primary_fixed` for small highlights (like a "New" badge) to draw the eye without overwhelming it.
*   **Do** utilize the `full` radius (9999px) for small action chips to create a "pill" aesthetic that contrasts against the `xl` radius of main containers.

### Don't:
*   **Don't** use 100% opaque `outline` colors. It kills the "premium" depth.
*   **Don't** use standard "Error Red." Use our `error` (#ffb4ab) which is tuned to be legible against the deep indigo background without feeling jarring.
*   **Don't** cram elements. If a screen feels busy, increase the background-tier contrast instead of adding lines.