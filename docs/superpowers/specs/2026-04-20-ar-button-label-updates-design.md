# AR Button + Label Updates — Design Spec
Date: 2026-04-20

## Overview

Two client changes: terminology updates for material categories, and a mobile AR view button in the 3D canvas.

## 1. Label Changes

| Location | Old | New |
|---|---|---|
| `ConfigSidebar.tsx` — SubCategoryLabel | "Tessuti" | "Microfibra" |
| `ConfigSidebar.tsx` — SubCategoryLabel | "Pelli" | "Ecopelle" |
| `BottomSheet.tsx` — category toggle button | "TESSUTO" | "MICROFIBRA" |
| `BottomSheet.tsx` — category toggle button | "PELLE" | "ECOPELLE" |

## 2. AR View Button

### Approach
Use Google's `<model-viewer>` web component loaded via CDN. A hidden 1×1px `<model-viewer>` element sits in the canvas DOM fed the active model's GLB path. A custom-styled AR button triggers `activateAR()` on the element.

### Platform behavior
- **Android Chrome**: opens Google Scene Viewer with GLB natively
- **iOS Safari**: opens AR Quick Look — Google's service converts GLB→USDZ on the fly
- **Desktop / unsupported**: button hidden (`lg:hidden`); model-viewer handles graceful failure

### No USDZ files required. No backend. No conversion pipeline.

### Components

**`src/types/model-viewer.d.ts`** (new)
TypeScript `declare global` augmenting `JSX.IntrinsicElements` with `model-viewer` custom element.

**`src/app/configure/[model]/page.tsx`** (modified)
- Add `<Script>` tag loading model-viewer from Google CDN (`type="module"`)
- Add hidden `<model-viewer>` element inside canvas section with `src`, `ar`, `ar-modes="scene-viewer quick-look webxr"`
- Add AR button: `absolute bottom-4 right-4 z-20 lg:hidden`, styled in app sage/navy theme, with AR icon + "AR" label
- On click handler: `(document.querySelector('model-viewer') as any).activateAR()`

### AR button style
- Rounded square ~52×52px
- Background: `THEME.accentNavy` (`#2e3d2f`)
- Icon: AR/cube SVG, white stroke
- Label: "AR", white, 8px, tracking wide
- Matches existing UI button aesthetic
