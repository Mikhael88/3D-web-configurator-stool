# How-To: Lighting & Environment

## How lighting currently works

Each scene renders two independent layers of light:

| Layer | What it does | Where it lives |
|-------|-------------|----------------|
| **IBL (Image-Based Lighting)** | Drives reflections on metal surfaces; adds soft ambient fill that matches the environment | `<Environment>` component in `SceneContent` — `Scene.tsx` |
| **Direct lights** | Hard shadows, rim highlights, key/fill balance | `DaylightSetup` and `StudioSetup` components — same file |

The two layers are additive. IBL is the most visually important one for metals; the direct lights shape the shadows and give the scene its "mood".

The user-facing toggle ("Dark Studio" / "Daylight") switches both layers simultaneously.

---

## Swapping the environment preset for a custom HDR

Right now the code uses built-in presets from `@react-three/drei`:

```tsx
// Scene.tsx — inside SceneContent()
{lightingMode === 'daylight' && (
  <Environment preset="apartment" environmentIntensity={0.4} />
)}
{lightingMode === 'studio' && (
  <Environment preset="studio" environmentIntensity={0.3} />
)}
```

**To replace either preset with your own `.hdr` file:**

1. Drop the file in `public/environments/` (create the folder if needed):
   ```
   public/
   └── environments/
       ├── studio.hdr
       └── outdoor.hdr
   ```

2. In `Scene.tsx`, replace `preset="..."` with `files="..."`:
   ```tsx
   {lightingMode === 'studio' && (
     <Environment files="/environments/studio.hdr" environmentIntensity={0.3} />
   )}
   ```

   The path is relative to `public/` — no leading `/public`.

3. `environmentIntensity` controls how strongly the HDR drives the reflections and ambient fill. Typical range: `0.1` (subtle) → `1.0` (fully IBL-driven). Start around `0.3–0.5` and adjust by eye.

> **Note:** `.exr` files also work — same syntax, just a different extension.

---

## Adjusting the direct lights without touching the HDR

`DaylightSetup` and `StudioSetup` in `Scene.tsx` are plain React components — just JSX with Three.js light primitives. You can edit them independently of the `<Environment>` block.

```tsx
// Example: make the studio key light warmer
<directionalLight
  position={[5, 5, 5]}
  intensity={1.5}
  color="#ffe8cc"   // ← was "#e8eeff" (cool blue); now warm amber
  castShadow
  ...
/>
```

Common adjustments:

| Goal | What to change |
|------|---------------|
| Brighter/dimmer overall | `intensity` on `ambientLight` |
| Softer shadows | `shadow-radius` on the key `directionalLight` (higher = softer) |
| Warmer/cooler scene | `color` on ambient and key lights |
| Reduce metal hotspots | Lower `environmentIntensity` on `<Environment>` |
| Remove all IBL (pure direct lighting) | Delete the `<Environment>` block entirely |

---

## Adding a third lighting mode

The lighting mode is stored in Zustand (`lightingMode: 'daylight' | 'studio'`). To add a third preset (e.g. `'coastal'`):

1. **Store** — extend the type in `src/stores/configurator-store.ts`:
   ```ts
   export type LightingMode = 'daylight' | 'studio' | 'coastal'
   ```

2. **Scene** — add a branch in `SceneContent`:
   ```tsx
   {lightingMode === 'coastal' ? <CoastalSetup /> : null}
   {lightingMode === 'coastal' && (
     <Environment files="/environments/coastal.hdr" environmentIntensity={0.5} />
   )}
   ```

3. **Sidebar** — add a `LightingButton` entry in `ConfigSidebar.tsx`.

---

## Background colour

The canvas background and fog colour are also tied to `lightingMode` in `SceneContent`:

```tsx
<color attach="background" args={[lightingMode === 'studio' ? '#0d131f' : '#1a1c20']} />
<fog attach="fog" args={[lightingMode === 'studio' ? '#0d131f' : '#1a1c20', 10, 25]} />
```

Change the hex strings here to adjust what the user sees behind the model. If you switch to an HDR that includes a visible sky, you can remove the `<color>` and `<fog>` lines and let the environment show through.

---

## Available built-in presets (no file needed)

`@react-three/drei` ships these presets out of the box:
`apartment`, `city`, `dawn`, `forest`, `lobby`, `night`, `park`, `studio`, `sunset`, `warehouse`

Swap `preset="studio"` for any of the above to quickly test different moods before committing to a custom HDR.
