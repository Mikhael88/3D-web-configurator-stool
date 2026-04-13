# Mobile Responsive Redesign + Theme Tokens
_Spec date: 2026-04-12_

## Scope

Four independent concerns shipped together:
1. **Theme token system** — single source of truth for all colors/palette
2. **Lighting simplification** — remove UI controls, hardcode dark studio
3. **Desktop sidebar cleanup** — remove two obsolete elements
4. **Mobile layout** — responsive homepage + bottom-sheet configurator

---

## 1. Theme Token System

### File: `src/lib/theme.ts`

Single exported `THEME` object. All hex values live here and nowhere else.

**Initial palette — B (Light & Coastal):**

```ts
export const THEME = {
  // Backgrounds
  bgPage:        '#f5f2ee',  // homepage + configurator page bg
  bgSidebar:     '#ffffff',  // sidebar / bottom sheet
  bgCard:        '#ffffff',  // product cards
  bgCardImage:   'linear-gradient(160deg, #dde4ec 0%, #c8d2de 100%)',
  bgInput:       '#f9f8f6',  // material buttons resting state

  // Text
  textPrimary:   '#2c3e50',  // headings, model name
  textSecondary: '#7a8fa0',  // body / description
  textMuted:     'rgba(44,62,80,0.35)', // labels, hints
  textInverse:   '#ffffff',  // text on dark buttons

  // Accents
  accentNavy:    '#2c3e50',  // primary button fill, active states
  accentSand:    '#c9b99a',  // secondary accent
  accentSlate:   '#7a9bb5',  // series label, highlights
  accentSelected:'rgba(44,62,80,0.15)', // swatch selection ring

  // Borders
  borderSubtle:  'rgba(44,62,80,0.08)',
  borderMid:     'rgba(44,62,80,0.15)',
  borderStrong:  'rgba(44,62,80,0.25)',

  // Shadows
  shadowSheet:   '0 -4px 24px rgba(0,0,0,0.08)',
  shadowTray:    '0 -8px 32px rgba(0,0,0,0.12)',
}
```

**How to use:** Replace every hardcoded hex/rgba string in components with `THEME.xxx`. Future palette swap = edit this file only.

**CSS custom properties** — also declare all tokens as CSS vars in `src/app/globals.css`:
```css
:root {
  --bg-page: #f5f2ee;
  --bg-sidebar: #ffffff;
  /* ... one var per THEME key */
}
```
This lets Tailwind `bg-[var(--bg-page)]` work if needed.

---

## 2. Lighting Simplification

### Remove from `src/stores/configurator-store.ts`
- `lightingMode` state
- `setLighting` action
- `LightingMode` type

### Remove from `src/components/configurator/ConfigSidebar.tsx`
- `LightingButton` component
- Entire "Lighting" section in the sidebar
- `lightingMode` / `setLighting` imports from store

### Update `src/components/configurator/Scene.tsx`
- Delete any conditional lighting logic based on `lightingMode`
- Hardcode the dark studio setup directly (the current "studio" preset values)
- No API change needed — Scene no longer reads from store for lighting

---

## 3. Desktop Sidebar Cleanup

**File: `src/components/configurator/ConfigSidebar.tsx`**

Two removals only — everything else stays identical:
- Remove the `<span>The Maritime Series</span>` label (line ~229)
- Remove the entire Lighting `<section>` block (already handled in §2)

Desktop sidebar final order (unchanged from before except removals):
1. Product `h1` (model ID) + description paragraph
2. Seat & Backrest — flat swatch grid (4 cols fabrics, 4 cols leathers)
3. Structure Finish — static "Brushed Steel 316" row
4. Save PDF + Contact buttons (bottom fixed area)

---

## 4. Mobile Layout

### 4a. Homepage — `src/app/page.tsx`

Grid becomes responsive:
```tsx
// Before
className="grid grid-cols-4 w-full"

// After
className="grid grid-cols-1 lg:grid-cols-4 w-full"
```

Page padding becomes responsive:
```tsx
// Before
style={{ padding: '32px 48px' }}

// After — move to Tailwind
className="px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8"
```

Card image area gets a minimum height for the taller mobile cards:
```tsx
style={{ minHeight: '160px' }}  // was implicitly small
```

### 4b. Configurator — new Zustand state

Add to `src/stores/configurator-store.ts`:
```ts
isInteracting: boolean       // true while user drags the 3D model
setInteracting: (v: boolean) => void
```

### 4c. Scene.tsx — emit interaction state

In the pointer event handlers inside `StoolInteraction` (or equivalent):
```ts
onPointerDown: () => useConfiguratorStore.getState().setInteracting(true)
onPointerUp:   () => useConfiguratorStore.getState().setInteracting(false)
// also on pointercancel / pointerleave for safety
```

### 4d. Configurator page layout — `src/app/configure/[model]/page.tsx`

**Desktop (≥ lg):** unchanged — canvas left, sidebar right, full height.

**Mobile (< lg):** flex column, canvas top, bottom sheet below.

Canvas area gets a product name overlay (mobile only):
```tsx
{/* Mobile canvas overlay — hidden on lg+ */}
<div className="absolute top-3 left-4 lg:hidden">
  <span style={{ fontFamily: "'Noto Serif', serif", fontSize: '1.25rem', color: THEME.textPrimary }}>
    {modelId.toUpperCase()}
  </span>
</div>
```

### 4e. Bottom sheet — new component `src/components/configurator/BottomSheet.tsx`

Wraps the mobile sidebar. Behavior:
- **Expanded**: `translateY(0)` — sheet visible, height ~55vh
- **Collapsed**: `translateY(calc(100% - 48px))` — only drag handle visible (48px peek)
- **Auto-collapse**: watches `isInteracting` from store; when `true` → collapsed
- **Manual expand**: user drags handle upward or taps it → expanded
- **Transition**: `transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)`

Drag handle: centered pill `36×4px`, `rgba(textPrimary, 0.2)`.

Sheet contains (mobile sidebar content, top to bottom):
1. Drag handle
2. **Seat & Backrest** — two buttons side by side: `FABRIC ▲` / `LEATHER ▲`
3. **Save PDF** + **Contact** (side by side)
4. **About** — product description (scrollable below)

Note: Structure Finish row omitted from mobile — not interactive, not needed on small screen.

### 4f. Material drop-up tray — new component `src/components/configurator/MaterialTray.tsx`

Triggered by tapping FABRIC or LEATHER button. Behavior:
- Fixed to bottom of viewport, overlays the canvas
- Slides up from below: `translateY(100%)` → `translateY(0)`
- Dismissed by: selecting a swatch, tapping outside, or tapping the same button again
- Only one tray open at a time (fabric XOR leather)

Tray content:
```
[label: "Fabric" or "Leather"]          [selected name]
○  ○  ○  ○  ○     ← 5 swatches in a row, 42×42px circles
```

Swatch selected state: `border: 3px solid THEME.accentNavy` + `box-shadow: 0 0 0 3px THEME.accentSelected`.

The tray reads from the same `upholsteryId` store state and calls `setUpholstery()` — no new store state needed.

**Desktop:** FABRIC/LEATHER buttons are not present on desktop (desktop keeps the existing swatch grid). Tray component is mobile-only rendered.

---

## File Change Summary

| File | Change type |
|------|-------------|
| `src/lib/theme.ts` | **New** — token definitions |
| `src/app/globals.css` | **Edit** — add CSS custom properties |
| `src/stores/configurator-store.ts` | **Edit** — remove lighting, add `isInteracting` |
| `src/components/configurator/ConfigSidebar.tsx` | **Edit** — remove maritime label + lighting section; apply THEME tokens |
| `src/components/configurator/Scene.tsx` | **Edit** — hardcode studio lighting, emit `isInteracting` on pointer events |
| `src/app/page.tsx` | **Edit** — responsive grid + THEME tokens |
| `src/app/configure/[model]/page.tsx` | **Edit** — mobile canvas overlay, wire BottomSheet |
| `src/components/configurator/BottomSheet.tsx` | **New** — mobile bottom sheet with collapse logic |
| `src/components/configurator/MaterialTray.tsx` | **New** — drop-up swatch tray |

---

## Out of Scope

- Texture images for swatches (client will provide — just add `map` in `upholsteryMat`)
- Product photos on homepage cards (still SVG placeholders)
- Contact button action (still wired up separately)
- C113/C114 upholstery mesh name verification
