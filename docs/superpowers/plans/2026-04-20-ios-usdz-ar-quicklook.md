# iOS USDZ AR Quick Look — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Export the configured Three.js stool scene as USDZ client-side so iOS AR Quick Look shows the exact selected Microfibra/Ecopelle material instead of the static GLB default.

**Architecture:** A module-level function ref (`usdz-export-ref.ts`, identical pattern to existing `capture-ref.ts`) is set by `StoolModel` after scene load and read by `page.tsx`. iOS AR tap calls the exporter async, stores the resulting blob URL, then shows a floating `<a rel="ar" href={blobUrl}>` overlay the user taps — necessary because iOS Safari blocks programmatic `<a>.click()` after `await`. Android path (WebXR) is unchanged.

**Tech Stack:** `three/examples/jsm/exporters/USDZExporter` (bundled with Three.js r183, already in project), Next.js 15, React 19, Zustand.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/usdz-export-ref.ts` | Create | Module-level function ref: `setUsdzExporter` / `getUsdzExporter` |
| `src/components/configurator/Scene.tsx` | Modify | Register USDZ exporter in `StoolModel` on scene load; static import of `USDZExporter` |
| `src/app/configure/[model]/page.tsx` | Modify | iOS AR path: export → loading state → `<a rel="ar">` overlay; remove model-viewer elements |

---

## Task 1: Create usdz-export-ref.ts

**Files:**
- Create: `src/lib/usdz-export-ref.ts`

- [ ] **Step 1: Create the file**

`src/lib/usdz-export-ref.ts`:
```typescript
export type UsdzExportFn = () => Promise<Blob>

let usdzExportFn: UsdzExportFn | null = null

export function setUsdzExporter(fn: UsdzExportFn | null): void {
  usdzExportFn = fn
}

export function getUsdzExporter(): UsdzExportFn | null {
  return usdzExportFn
}
```

- [ ] **Step 2: Verify TypeScript**

Run from `C:/Users/morga/project`:
```bash
./node_modules/.bin/tsc --noEmit
```
Expected: no errors (filter any pre-existing `skills/` errors).

---

## Task 2: Register USDZ exporter in Scene.tsx

**Files:**
- Modify: `src/components/configurator/Scene.tsx`

Context: `StoolModel` uses `useGLTF(glbPath)` which returns a cached `scene` (THREE.Group). A second `useEffect([scene, upholsteryMat, stitchMat])` traverses the scene and applies materials in-place. Since `scene` is mutated, calling `parseAsync(scene)` at any later point will use the current materials. We register the exporter once per scene load (deps: `[scene]`), after the scene is available.

The `USDZExporter` is imported statically — `Scene.tsx` is already client-only (loaded via `dynamic({ ssr: false })`).

- [ ] **Step 1: Add USDZExporter import**

In `src/components/configurator/Scene.tsx`, add to the existing import block at the top (after the existing imports, around line 12):

```typescript
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'
import { setUsdzExporter } from '@/lib/usdz-export-ref'
```

- [ ] **Step 2: Register exporter in StoolModel**

Inside `StoolModel`, add a new `useEffect` immediately after the existing first `useEffect` (the one starting at around line 394 that calls `setStoolScene(scene)` and handles shadow/material setup). Insert it between that effect and the material-application effect:

```typescript
  // Register USDZ exporter — scene is mutated in-place by material effects,
  // so parseAsync at call-time always reflects the current configured material.
  useEffect(() => {
    const exporter = new USDZExporter()
    setUsdzExporter(async () => {
      const arraybuffer = await exporter.parseAsync(scene)
      return new Blob([arraybuffer], { type: 'model/vnd.usdz+zip' })
    })
    return () => { setUsdzExporter(null) }
  }, [scene])
```

- [ ] **Step 3: Verify TypeScript**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no new errors.

---

## Task 3: Update page.tsx — iOS USDZ path

**Files:**
- Modify: `src/app/configure/[model]/page.tsx`

This task:
1. Removes the model-viewer Script tag and `<model-viewer>` element (no longer needed for iOS)
2. Removes `ModelViewerElement` import
3. Adds `arLoading` and `iosArUrl` state
4. iOS handler calls `getUsdzExporter()`, awaits blob, stores URL
5. Renders a floating `<a rel="ar">` overlay when `iosArUrl` is set (user taps it to open AR Quick Look)
6. Resets `iosArUrl` when material changes (Zustand subscription)

### Step 1: Update imports

Replace the current import block at the top of `src/app/configure/[model]/page.tsx`:

```tsx
'use client'

import { Suspense, use, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { getUsdzExporter } from '@/lib/usdz-export-ref'
import ConfigSidebar from '@/components/configurator/ConfigSidebar'
import BottomSheet from '@/components/configurator/BottomSheet'
import { MODELS } from '@/models'
import { THEME } from '@/lib/theme'
import { xrStore } from '@/stores/ar-store'
```

Note: `Script`, `ModelViewerElement` import, and `type { ModelViewerElement }` are all removed.

### Step 2: Update state and add Zustand subscription

- [ ] **Step 2: Update state declarations and add material-change effect**

Replace the existing state declarations block (currently `sheetExpanded` + `sceneReady`) with:

```tsx
  const [sheetExpanded, setSheetExpanded] = useState(true)
  const [arLoading, setArLoading] = useState(false)
  const [iosArUrl, setIosArUrl] = useState<string | null>(null)
  const upholsteryId = useConfiguratorStore(s => s.upholsteryId)

  // Reset iOS AR URL whenever material changes — next tap re-exports with new material.
  useEffect(() => {
    setIosArUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [upholsteryId])
```

### Step 3: Update handleAR

- [ ] **Step 3: Replace handleAR**

```tsx
  const handleAR = async () => {
    const isAndroid = /android/i.test(navigator.userAgent)

    if (isAndroid) {
      if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-ar').then(supported => {
          if (supported) {
            xrStore.enterAR().catch(err => console.error('[AR] enterAR failed:', err))
          } else {
            alert('AR non supportato su questo dispositivo.')
          }
        }).catch(err => console.error('[AR] isSessionSupported failed:', err))
      } else {
        alert('AR non supportato su questo browser.')
      }
      return
    }

    // iOS: export USDZ with configured material, then show AR Quick Look link.
    // Two-step (export → user taps link) is required because iOS Safari blocks
    // programmatic <a>.click() after async/await.
    const exportFn = getUsdzExporter()
    if (!exportFn) {
      alert('Scena 3D non ancora pronta. Riprova tra un momento.')
      return
    }

    setArLoading(true)
    try {
      const blob = await exportFn()
      const url = URL.createObjectURL(blob)
      setIosArUrl(url)
    } catch (err) {
      console.error('[AR] USDZ export failed:', err)
      alert('Errore nella preparazione dell\'AR.')
    } finally {
      setArLoading(false)
    }
  }
```

### Step 4: Update JSX — remove model-viewer, add AR overlay

- [ ] **Step 4: Remove the Script tag and model-viewer element**

Remove these two blocks from inside the canvas `<section>`:

```tsx
          {/* Remove this entire Script block */}
          <Script
            src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
            strategy="lazyOnload"
          />

          {/* Remove this entire model-viewer block */}
          <model-viewer
            id="ar-host"
            src={modelConfig.glbPath ?? ''}
            alt={`${modelConfig.name} modello 3D`}
            ar
            ar-modes="quick-look"
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              opacity: 0,
              pointerEvents: 'none',
            }}
          />
```

- [ ] **Step 5: Update the AR button to show loading state**

Replace the existing AR button with:

```tsx
          {/* AR button — mobile only, bottom-right */}
          <button
            onClick={handleAR}
            disabled={arLoading}
            className="lg:hidden absolute bottom-4 right-4 z-20 flex flex-col items-center justify-center gap-1 rounded-lg"
            style={{
              width: 52,
              height: 52,
              backgroundColor: THEME.accentNavy,
              color: THEME.textInverse,
              opacity: arLoading ? 0.6 : 1,
            }}
            aria-label="Visualizza in realtà aumentata"
          >
            {arLoading ? (
              <div
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: THEME.textInverse, borderTopColor: 'transparent' }}
              />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700 }}>
                  AR
                </span>
              </>
            )}
          </button>
```

- [ ] **Step 6: Add iOS AR Quick Look overlay**

Add this block immediately after the AR button (still inside the canvas `<section>`, before the closing `</section>`):

```tsx
          {/* iOS AR Quick Look overlay — shown after USDZ export completes */}
          {iosArUrl && (
            <div
              className="lg:hidden absolute inset-0 z-30 flex items-end justify-center pb-8"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setIosArUrl(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return null
              })}
            >
              <a
                href={iosArUrl}
                rel="ar"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl px-8 py-4"
                style={{
                  backgroundColor: THEME.accentNavy,
                  color: THEME.textInverse,
                  textDecoration: 'none',
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>
                  Apri in AR
                </span>
                <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                  Tocca per aprire AR Quick Look
                </span>
              </a>
            </div>
          )}
```

- [ ] **Step 7: Verify TypeScript**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no new errors. In particular, no `ModelViewerElement` or `model-viewer` JSX errors (those elements are removed).

---

## Manual Testing

**iOS Safari (iPhone):**
1. Open configurator, select "Clun 02" leather
2. Tap AR button (bottom-right)
3. Expected: button shows spinner ~1-3 seconds
4. Expected: dark overlay appears with "Apri in AR" link
5. Tap "Apri in AR"
6. Expected: AR Quick Look launches with the Clun leather texture visible on the stool
7. Dismiss AR, change material to "Teknofibra 01" fabric
8. Tap AR again
9. Expected: spinner again (re-exports with new material), then overlay
10. Tap "Apri in AR" — fabric texture visible in AR

**Android Chrome (Pixel 8):**
- AR path unchanged — WebXR session, no USDZ involved
- Verify AR button still works after iOS changes

**Desktop:**
- AR button still hidden (`lg:hidden`)
- No visible change

**TypeScript note:** Types for `USDZExporter` are in `@types/three/examples/jsm/exporters/USDZExporter.d.ts` (already installed). `parseAsync` returns `Promise<Uint8Array<ArrayBuffer>>` — passing a `Uint8Array` directly to the `Blob` constructor is valid. The static import `from 'three/examples/jsm/exporters/USDZExporter.js'` resolves correctly with the project's existing `@types/three` setup.
