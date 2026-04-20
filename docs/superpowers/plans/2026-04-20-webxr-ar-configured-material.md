# WebXR AR with Configured Material — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Android Scene Viewer (static GLB) with WebXR AR that renders the exact configured material from the existing R3F scene.

**Architecture:** A singleton `xrStore` (from `@react-three/xr`) is shared between `page.tsx` (to call `enterAR()`) and `Scene.tsx` (to configure `<XR>`). `SceneContent` checks `useXR()` session state and switches between normal studio mode and AR mode. AR mode shows a hit-test reticle + tap-to-place `StoolModel` with the currently selected Zustand material. iOS keeps model-viewer fallback.

**Tech Stack:** `@react-three/xr` v6, `@react-three/fiber` v9 (existing), Three.js (existing), Zustand (existing), Next.js 15.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/stores/ar-store.ts` | Create | Singleton `xrStore` with hit-test feature |
| `src/components/configurator/Scene.tsx` | Modify | XR wrapper, dual-mode SceneContent, ARContent component |
| `src/app/configure/[model]/page.tsx` | Modify | Android: `xrStore.enterAR()` instead of Scene Viewer intent URL |

---

## Task 1: Install @react-three/xr and create ar-store

**Files:**
- Create: `src/stores/ar-store.ts`

- [ ] **Step 1: Install the package**

Run from `C:/Users/morga/project`:
```bash
bun add @react-three/xr
```
Expected: package added to `package.json`, no peer dependency errors.

- [ ] **Step 2: Create the XR store singleton**

Create `src/stores/ar-store.ts`:
```typescript
import { createXRStore } from '@react-three/xr'

// Singleton shared between Scene.tsx (XR provider) and page.tsx (enterAR trigger).
// 'hit-test' feature enables surface detection for tap-to-place AR.
export const xrStore = createXRStore({ features: ['hit-test'] })
```

- [ ] **Step 3: Verify TypeScript**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no errors from the new file (pre-existing `skills/` errors are acceptable).

- [ ] **Step 4: Commit**

```bash
git add src/stores/ar-store.ts package.json bun.lockb
git commit -m "feat: add xrStore singleton with hit-test feature for WebXR AR"
```

---

## Task 2: Add XR provider + AR mode to Scene.tsx

**Files:**
- Modify: `src/components/configurator/Scene.tsx`

This task adds `@react-three/xr` imports, wraps the Canvas with `<XR>`, and introduces the `ARContent` component that runs in AR sessions. The existing `SceneContent` gains a session check to switch modes.

- [ ] **Step 1: Add imports at top of Scene.tsx**

Add these imports after the existing import block (after `import { useConfiguratorStore, UPHOLSTERY_MATERIALS } from '@/stores/configurator-store'`).

`XRHitTestResult` and `XRSession` come from the WebXR browser types — if TypeScript complains they are unknown, run `bun add -D @types/webxr` once and they will resolve globally.

```typescript
import { XR, useXR, useXRHitTest, useXREvent } from '@react-three/xr'
import { xrStore } from '@/stores/ar-store'
```

- [ ] **Step 2: Add ARContent component**

Insert this new component just before the `SceneContent` function (around line 512):

```tsx
// ──────────────────────────────────────
// AR Scene — hit-test reticle + tap-to-place model
// ──────────────────────────────────────
function ARContent({ glbPath, modelId }: { glbPath: string; modelId: string }) {
  const reticleRef = useRef<THREE.Mesh>(null)
  const modelGroupRef = useRef<THREE.Group>(null)
  const [placed, setPlaced] = useState(false)
  const hitMatrix = useRef(new THREE.Matrix4())

  useXRHitTest((results: XRHitTestResult[], getWorldMatrix: (target: THREE.Matrix4, result: XRHitTestResult) => void) => {
    if (!reticleRef.current || !modelGroupRef.current) return
    if (results.length === 0) {
      reticleRef.current.visible = false
      return
    }
    getWorldMatrix(hitMatrix.current, results[0])

    // Move reticle to hit point (hidden once placed)
    if (!placed) {
      reticleRef.current.visible = true
      reticleRef.current.matrix.copy(hitMatrix.current)
      reticleRef.current.matrixAutoUpdate = false

      // Preview: keep model following reticle before placement
      modelGroupRef.current.matrix.copy(hitMatrix.current)
      modelGroupRef.current.matrixAutoUpdate = false
    }
  })

  useXREvent('select', () => {
    if (!placed) setPlaced(true)
  })

  return (
    <>
      {/* Surface reticle — flat ring shown before model is placed */}
      <mesh ref={reticleRef} visible={false} matrixAutoUpdate={false}>
        <ringGeometry args={[0.07, 0.1, 32]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* Model group — follows reticle until tapped, then anchored */}
      <group ref={modelGroupRef} matrixAutoUpdate={false}>
        <StoolModel glbPath={glbPath} modelId={modelId} />
      </group>
    </>
  )
}
```

- [ ] **Step 3: Update SceneContent to be mode-aware**

Replace the existing `SceneContent` function:

```tsx
function SceneContent({ glbPath, modelId }: { glbPath: string; modelId: string }) {
  const session = useXR((state: { session: XRSession | null }) => state.session)
  const isAR = session !== null

  if (isAR) {
    return <ARContent glbPath={glbPath} modelId={modelId} />
  }

  return (
    <>
      <color attach="background" args={['#ffffff']} />
      <fog attach="fog" args={['#ffffff', 10, 25]} />

      <StudioSetup />

      <Environment files="/hdr-ambiente.exr" environmentIntensity={2.0} background={false} />

      <StoolModel glbPath={glbPath} modelId={modelId} />
      <StoolInteraction modelId={modelId} />
      <CaptureHandler />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.7}
        scale={10}
        blur={3}
        far={4}
        color="#1a1a1a"
      />
    </>
  )
}
```

- [ ] **Step 4: Wrap Canvas with XR and enable alpha**

Replace the exported `ConfiguratorScene` function:

```tsx
export default function ConfiguratorScene({ glbPath, modelId }: { glbPath: string; modelId: string }) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{
        position: [2.5, 1.2, 2.5],
        fov: 38,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.AgXToneMapping,
        toneMappingExposure: 0.9,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: '#ffffff' }}
    >
      <XR store={xrStore}>
        <SceneContent glbPath={glbPath} modelId={modelId} />
      </XR>
    </Canvas>
  )
}
```

- [ ] **Step 5: Verify TypeScript**

Run: `./node_modules/.bin/tsc --noEmit`

If `useXRHitTest` or `useXREvent` signatures differ from what TypeScript reports (the v6 API may vary slightly), adjust the callback signature to match. The `XRHitTestResult` type comes from the WebXR typings — if missing, add `bun add -D @types/webxr`.

Expected: no new errors in `Scene.tsx` or `ar-store.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/components/configurator/Scene.tsx
git commit -m "feat: add WebXR AR mode to Scene with hit-test reticle and tap-to-place"
```

---

## Task 3: Update page.tsx — Android uses xrStore.enterAR()

**Files:**
- Modify: `src/app/configure/[model]/page.tsx`

- [ ] **Step 1: Add xrStore import**

Add import alongside existing imports at the top of `page.tsx`:

```typescript
import { xrStore } from '@/stores/ar-store'
```

- [ ] **Step 2: Update handleAR to use enterAR for Android**

Replace the existing `handleAR` function and `BASE_URL` constant:

```typescript
const handleAR = () => {
  const isAndroid = /android/i.test(navigator.userAgent)

  if (isAndroid) {
    xrStore.enterAR()
    return
  }

  // iOS: model-viewer AR Quick Look fallback
  const mv = document.getElementById('ar-host') as (ModelViewerElement | null)
  mv?.activateAR?.()
}
```

- [ ] **Step 3: Verify TypeScript**

Run: `./node_modules/.bin/tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/configure/[model]/page.tsx
git commit -m "feat: Android AR uses xrStore.enterAR() for WebXR session"
```

---

## Manual Testing

**Android Chrome (Pixel 8):**
1. Open configurator, select a material (e.g. Clun leather)
2. Tap AR button
3. Expected: browser asks camera permission
4. After permission: camera feed visible, reticle ring appears on floor when pointing at surface
5. Tap screen: stool anchors at reticle position with the selected leather/fabric texture
6. Walk around model: stays in world position

**iOS Safari:**
1. Open configurator, tap AR button
2. Expected: AR Quick Look launches (Google USDZ conversion) — material will be default GLB material (known limitation, unchanged from before)

**Desktop:**
1. AR button hidden (`lg:hidden`) — no change

**TypeScript API note for implementer:**
If `useXRHitTest` / `useXREvent` signatures in the installed v6 package differ from what's shown above, check the package's TypeScript types (`node_modules/@react-three/xr/dist/index.d.ts`) for the exact API. Common variations: `useXRHitTest` may accept a store as first arg, `useXREvent` may require `{ store }` option.
