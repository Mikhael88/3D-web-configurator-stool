# WebXR AR with Configured Material — Design Spec
Date: 2026-04-20

## Overview

Replace the Android Scene Viewer approach (static GLB, ignores material selection) with WebXR AR using the existing R3F scene. The configured material (Microfibra/Ecopelle texture + colour) renders directly in AR. iOS keeps the model-viewer AR Quick Look fallback.

## Architecture

### New file: `src/stores/ar-store.ts`
Singleton XR store created once at module level:
```ts
import { createXRStore } from '@react-three/xr'
export const xrStore = createXRStore({ features: ['hit-test'] })
```
Both `page.tsx` and `Scene.tsx` import this. No prop-drilling needed.

### `src/components/configurator/Scene.tsx` (modified)

**Canvas:**
- Add `gl={{ alpha: true }}` so the WebGL surface is transparent (camera feed shows through in AR)
- Wrap `<SceneContent>` with `<XR store={xrStore}>`

**SceneContent — dual mode:**

Uses `useXR()` to detect if a session is active.

| Element | Normal mode | AR mode |
|---|---|---|
| `<color>` white background | ✓ | ✗ (transparent) |
| Fog | ✓ | ✗ |
| `<StudioSetup>` (lights) | ✓ | ✗ (real-world light) |
| `<Environment>` HDR | ✓ | ✗ |
| `<ContactShadows>` | ✓ | ✗ |
| `<OrbitControls>` | ✓ | ✗ |
| `<StoolModel>` | at origin | inside `<ARPlacement>` |
| `<ARPlacement>` | ✗ | ✓ |
| `<StoolInteraction>` | ✓ | ✗ |
| `<CaptureHandler>` | ✓ | ✗ |

**`<ARPlacement>` component (new, inside Scene.tsx):**
- Uses `useXRHitTest` to continuously update reticle position on detected surfaces
- Reticle: flat ring mesh (torus geometry, ~0.15m radius), visible when hit results exist
- State: `placed: boolean` — false until first tap
- Tap detection: WebXR `select` event via `useXREvent('select', handler, { store })` — not pointer events
- On first select: set `placed = true`, freeze model position at last hit matrix
- Renders `<StoolModel>` at the anchored position

### `src/app/configure/[model]/page.tsx` (modified)

`handleAR`:
```ts
if (isAndroid) {
  xrStore.enterAR()   // triggers browser camera permission → WebXR session
  return
}
// iOS: model-viewer fallback (unchanged)
mv?.activateAR?.()
```

Remove `BASE_URL` constant and Scene Viewer intent URL logic. Keep model-viewer hidden element + Script for iOS only.

## AR UX Flow (Android)

1. User taps AR button
2. Browser prompts camera permission
3. Camera feed renders as Canvas background (transparent WebGL over camera)
4. Reticle ring appears on detected floor/surface (hit-test)
5. User taps → stool placed at reticle with configured material
6. User walks around; model stays anchored in world space
7. Exit: device back gesture or browser XR exit

## Dependencies

- `@react-three/xr` v6 — compatible with current `@react-three/fiber` v9
- No new backend, no USDZ conversion, no GLB export

## Constraints

- WebXR AR requires HTTPS ✓ (Vercel)
- WebXR AR requires ARCore on Android (Pixel 8 has it ✓)
- iOS Safari does not support WebXR immersive-ar — model-viewer fallback retained
- `gl={{ alpha: true }}` on Canvas has no visual impact in normal mode because `<color attach="background">` sets the Three.js clear colour to white
