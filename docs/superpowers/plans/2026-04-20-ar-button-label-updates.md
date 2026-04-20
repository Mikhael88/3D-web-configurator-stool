# AR Button + Label Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace "Tessuto/Pelle" UI labels with "Microfibra/Ecopelle" and add a mobile-only AR view button (bottom-right of 3D canvas) using model-viewer web component.

**Architecture:** Hidden `<model-viewer>` element in canvas DOM receives the active GLB path; custom button triggers `activateAR()` on it. model-viewer handles platform dispatch (Android Scene Viewer / iOS AR Quick Look with server-side USDZ conversion). No USDZ files or backend required.

**Tech Stack:** Next.js 15, React 19, TypeScript, `@google/model-viewer` CDN (ESM), Tailwind CSS, THEME tokens from `src/lib/theme.ts`.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types/model-viewer.d.ts` | Create | TypeScript JSX declaration for `<model-viewer>` custom element |
| `src/app/configure/[model]/page.tsx` | Modify | Add Script tag, hidden model-viewer element, AR button |
| `src/components/configurator/ConfigSidebar.tsx` | Modify | "Tessuti"→"Microfibra", "Pelli"→"Ecopelle" |
| `src/components/configurator/BottomSheet.tsx` | Modify | "TESSUTO"→"MICROFIBRA", "PELLE"→"ECOPELLE" |

---

## Task 1: TypeScript declaration for model-viewer

**Files:**
- Create: `src/types/model-viewer.d.ts`

- [ ] **Step 1: Create the type declaration file**

```typescript
// src/types/model-viewer.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string
      ar?: boolean | string
      'ar-modes'?: string
      'camera-controls'?: boolean | string
      style?: React.CSSProperties
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript accepts it**

Run: `npx tsc --noEmit`
Expected: no errors referencing `model-viewer`

- [ ] **Step 3: Commit**

```bash
git add src/types/model-viewer.d.ts
git commit -m "chore: add TypeScript declaration for model-viewer custom element"
```

---

## Task 2: Label changes — ConfigSidebar

**Files:**
- Modify: `src/components/configurator/ConfigSidebar.tsx:117,131`

- [ ] **Step 1: Change "Tessuti" → "Microfibra"**

In `ConfigSidebar.tsx`, find:
```tsx
<SubCategoryLabel label="Tessuti" />
```
Replace with:
```tsx
<SubCategoryLabel label="Microfibra" />
```

- [ ] **Step 2: Change "Pelli" → "Ecopelle"**

In `ConfigSidebar.tsx`, find:
```tsx
<SubCategoryLabel label="Pelli" />
```
Replace with:
```tsx
<SubCategoryLabel label="Ecopelle" />
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/configurator/ConfigSidebar.tsx
git commit -m "feat: rename Tessuti→Microfibra, Pelli→Ecopelle in sidebar"
```

---

## Task 3: Label changes — BottomSheet

**Files:**
- Modify: `src/components/configurator/BottomSheet.tsx:117,135`

- [ ] **Step 1: Change "TESSUTO" → "MICROFIBRA"**

In `BottomSheet.tsx`, find:
```tsx
TESSUTO {activeCategory === 'fabric' ? '▼' : '▲'}
```
Replace with:
```tsx
MICROFIBRA {activeCategory === 'fabric' ? '▼' : '▲'}
```

- [ ] **Step 2: Change "PELLE" → "ECOPELLE"**

In `BottomSheet.tsx`, find:
```tsx
PELLE {activeCategory === 'leather' ? '▼' : '▲'}
```
Replace with:
```tsx
ECOPELLE {activeCategory === 'leather' ? '▼' : '▲'}
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/configurator/BottomSheet.tsx
git commit -m "feat: rename TESSUTO→MICROFIBRA, PELLE→ECOPELLE in bottom sheet"
```

---

## Task 4: AR button + model-viewer in configurator page

**Files:**
- Modify: `src/app/configure/[model]/page.tsx`

- [ ] **Step 1: Add Script import**

At the top of `src/app/configure/[model]/page.tsx`, add `Script` to the imports:

```tsx
'use client'

import { Suspense, use, useState } from 'react'
import Script from 'next/script'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { useConfiguratorStore } from '@/stores/configurator-store'
import ConfigSidebar from '@/components/configurator/ConfigSidebar'
import BottomSheet from '@/components/configurator/BottomSheet'
import { MODELS } from '@/models'
import { THEME } from '@/lib/theme'
```

- [ ] **Step 2: Add AR handler function**

Inside `ConfiguratorPage`, before the `return`, add:

```tsx
const handleAR = () => {
  const mv = document.querySelector('model-viewer') as HTMLElement & { activateAR: () => void }
  mv?.activateAR()
}
```

- [ ] **Step 3: Add Script tag, hidden model-viewer, and AR button**

Replace the existing canvas `<section>` block with:

```tsx
{/* 3D Viewport */}
<section
  className="flex-1 relative"
  onPointerDown={() => setInteracting(true)}
  onPointerUp={() => setInteracting(false)}
  onPointerCancel={() => setInteracting(false)}
>
  {/* model-viewer CDN script — mobile AR */}
  <Script
    src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
    strategy="lazyOnload"
    type="module"
  />

  {/* Hidden model-viewer for AR activation — mobile only */}
  <model-viewer
    src={modelConfig.glbPath ?? ''}
    ar
    ar-modes="scene-viewer quick-look webxr"
    style={{
      position: 'absolute',
      width: 1,
      height: 1,
      opacity: 0,
      pointerEvents: 'none',
    }}
  />

  {/* 3D Canvas */}
  <Suspense fallback={<LoadingScreen />}>
    <ConfiguratorScene glbPath={modelConfig.glbPath!} modelId={modelId} />
  </Suspense>

  {/* Interaction hints — desktop only */}
  <div className="absolute bottom-8 left-8 z-20 hidden lg:flex flex-col gap-2 opacity-40">
    <div className="flex items-center gap-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#728473" strokeWidth="1.5">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        <polyline points="21 3 21 9 15 9" />
      </svg>
      <span
        className="text-[10px] uppercase tracking-[0.2em]"
        style={{ color: '#728473', fontFamily: "'Source Sans 3', sans-serif" }}
      >
        Orbita e panoramica
      </span>
    </div>
    <div className="flex items-center gap-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#728473" strokeWidth="1.5">
        <path d="M15 15l-2 5L9 9l11 4-5 2z" />
        <path d="M2 2l7.586 7.586" />
      </svg>
      <span
        className="text-[10px] uppercase tracking-[0.2em]"
        style={{ color: '#728473', fontFamily: "'Source Sans 3', sans-serif" }}
      >
        Clicca per ruotare
      </span>
    </div>
  </div>

  {/* Product name overlay — mobile only */}
  <div className="absolute top-3 right-4 z-20 lg:hidden">
    <span
      style={{
        fontFamily: "'Source Sans 3', sans-serif",
        fontSize: '1.25rem',
        color: '#2e3d2f',
        letterSpacing: '0.02em',
      }}
    >
      {modelConfig?.name ?? modelId.toUpperCase()}
    </span>
  </div>

  {/* AR button — mobile only, bottom-right */}
  <button
    onClick={handleAR}
    className="lg:hidden absolute bottom-4 right-4 z-20 flex flex-col items-center justify-center gap-1 rounded-lg"
    style={{
      width: 52,
      height: 52,
      backgroundColor: THEME.accentNavy,
      color: THEME.textInverse,
    }}
    aria-label="Visualizza in realtà aumentata"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
    <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700 }}>
      AR
    </span>
  </button>
</section>
```

- [ ] **Step 4: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Run dev server and verify visually**

Run: `npm run dev`

Check on mobile viewport (Chrome DevTools, iPhone simulation):
- AR button visible in bottom-right of canvas
- Labels in bottom sheet read "MICROFIBRA" and "ECOPELLE"
- Button does NOT appear on desktop (hidden via `lg:hidden`)

Check on desktop:
- Sidebar labels read "Microfibra" and "Ecopelle"
- No AR button visible

- [ ] **Step 6: Commit**

```bash
git add src/app/configure/[model]/page.tsx
git commit -m "feat: add mobile AR view button with model-viewer integration"
```

---

## Manual AR Testing

On a real device (not DevTools simulation):

**Android (Chrome):**
1. Open configurator on any model
2. Tap AR button (bottom-right)
3. Expected: Google Scene Viewer launches with the 3D model in AR

**iOS (Safari):**
1. Open configurator on any model
2. Tap AR button (bottom-right)
3. Expected: AR Quick Look launches (may take a few seconds for USDZ conversion)

**Note:** AR will NOT work in DevTools mobile simulation — it requires a real device with ARCore (Android) or ARKit (iOS).
