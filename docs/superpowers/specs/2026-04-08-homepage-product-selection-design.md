# Homepage Product Selection Screen — Design Spec
_Date: 2026-04-08_

## Overview

Add a product selection homepage at `/` that lets users pick one of three products before entering the 3D configurator. The entire app is deployed as an iframe embedded in a WordPress site. No header or footer anywhere. The configurator moves from `/` to `/configure/[model]`.

---

## Goals

- Users land on a selection screen showing C111, C113, C114
- Clicking C111 navigates directly to `/configure/c111` (the 3D configurator)
- C113 and C114 are "coming soon" — dimmed, non-navigable, show an overlay on hover/click
- All routes are embeddable cross-origin as iframes in WordPress
- No header or footer on any page

---

## Routing Architecture

```
/                          → Product selection homepage   (new)
/configure/[model]         → 3D configurator              (moved from /)
```

The `[model]` param is the product ID string: `c111`, `c113`, `c114`.

Navigating to an unknown model (e.g. `/configure/c999`) renders a minimal "not found" state.

---

## New Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Replaced with selection homepage |
| `src/app/configure/[model]/page.tsx` | Configurator (current page.tsx content, header/footer removed) |
| `src/models/index.ts` | Central `ModelConfig[]` array |

## Modified Files

| File | Change |
|------|--------|
| `next.config.ts` | Remove `X-Frame-Options` / allow cross-origin framing |
| `src/stores/configurator-store.ts` | No change needed — store is scoped to the configurator route |

---

## Model Configuration (`src/models/index.ts`)

```ts
export interface ModelConfig {
  id: string           // URL slug: 'c111', 'c113', 'c114'
  name: string         // Display name: 'C111'
  glbPath: string | null  // null = not ready yet
  upholsteryMeshNames: string[]
  armrestNodeNames: string[]
  rotatingBodyName: string
}
```

C111 maps to the existing `stool.glb` with its known mesh names. C113 and C114 have `glbPath: null` — the configurator page will guard against this and show a placeholder if needed (though in practice these won't be linked from the homepage yet).

---

## Homepage Design (`/`)

- **Background**: `#0c0e12` (matches configurator)
- **Layout**: full-viewport, flex column, centered content
- **3-column grid**: equal-width cards, `gap: 16-24px`, padded from viewport edges
- **Brand signature**: small serif text above the columns, very low opacity (matches existing footer treatment)
- **Below columns**: a single muted hint line ("Select a model to begin configuration")

### Product Card (C111 — active)

- Background: `#14161c`
- Border: `1px solid rgba(255,255,255,0.06)`, on-hover → `rgba(188,199,222,0.35)`
- Top image area: full-width, flex-grow, dark gradient background, image placeholder (replaced with real photo later)
- Footer strip: product name in Noto Serif (light weight) + "Configure →" label
- Cursor: pointer
- `onClick`: `router.push('/configure/c111')`

### Product Card (C113, C114 — coming soon)

- Same structure but `opacity: 0.5`, `cursor: default`
- On hover and on click: absolute overlay appears over the image area
  - Background: `rgba(12,14,18,0.82)`
  - Content: decorative line + "Coming Soon" in small uppercase tracking
  - On mouse leave: overlay hides (desktop); on mobile tap: toggle
- Footer strip: product name only, no arrow

---

## Configurator Page (`/configure/[model]`)

Current `page.tsx` content moved here with two changes:
1. `<header>` block removed entirely
2. `<footer>` block removed entirely
3. Uses `params.model` to look up the `ModelConfig` and pass it to the scene/store

The `LoadingScreen` component keeps its current dark full-screen treatment.

---

## iframe Framing (`next.config.ts`)

Remove the default `X-Frame-Options: SAMEORIGIN` header so WordPress can embed any route:

```ts
headers: async () => [{
  source: '/(.*)',
  headers: [{ key: 'X-Frame-Options', value: '' }]  // remove restriction
}]
```

Or more correctly, omit the header entirely and ensure no `Content-Security-Policy: frame-ancestors 'self'` is set. Cross-origin embedding will then work from any WordPress domain.

---

## Out of Scope

- Transition animation between selection and configurator (can be added later)
- C113/C114 configurator implementation (depends on GLB availability)
- Real product images (image slot wired up, assets dropped in later)
- "Finalize Order" / pricing logic (already placeholder in current sidebar)

---

## Non-Goals

- The app will never run outside an iframe in production, but the code makes no assumption about this — it works standalone too.
