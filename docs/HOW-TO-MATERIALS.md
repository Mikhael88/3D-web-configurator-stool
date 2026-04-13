# How-To: Materials, Textures & New GLB Models

---

## Part 1 — How materials work today

### Current state: solid colours only

All upholstery materials are defined in `src/stores/configurator-store.ts` as `UPHOLSTERY_MATERIALS`. Each entry is built into a `THREE.MeshStandardMaterial` at render time (in `StoolModel` inside `Scene.tsx`) using only:

```ts
new THREE.MeshStandardMaterial({
  color:     new THREE.Color(m.colorHex),  // solid RGB colour
  roughness: m.roughness,                  // 0 = mirror, 1 = fully matte
  metalness: m.metalness,                  // always 0.0 for fabrics/leathers
})
```

**There are no texture maps loaded at all right now.** The material appearance is driven entirely by the colour hex and the roughness value.

### Which meshes get the material applied

In `Scene.tsx`, the function `isUpholsteryMesh(name)` identifies the two target meshes by node name:

```ts
const UPHOLSTERY_MESH_NAMES = new Set(['cube005', 'cube006'])
// cube005 = seat cushion, cube006 = backrest
```

The material is hot-swapped on every upholstery selection via `scene.traverse()` in a `useEffect`. Everything else in the GLB keeps its original Blender material.

---

## Part 2 — Adding textures (colour map + normal map)

### Step 1 — Prepare the texture files

Place all texture images in `public/textures/`. Recommended naming convention:

```
public/textures/
├── navy-fabric-color.jpg
├── navy-fabric-normal.jpg
├── cognac-leather-color.jpg
├── cognac-leather-normal.jpg
└── ...
```

- **Color map** (albedo): RGB image, `.jpg` is fine for performance.
- **Normal map**: RGB image where R=X, G=Y, B=Z surface normals. Export from Substance Painter, Blender, or any PBR tool. Must be in **OpenGL convention** (green channel up) — Three.js uses OpenGL convention by default.
- Optional: **roughness map** (greyscale, stored in the G channel of an ORM texture).

### Step 2 — Add texture paths to `MaterialOption`

In `src/stores/configurator-store.ts`, extend the interface:

```ts
export interface MaterialOption {
  id: string
  name: string
  category: MaterialCategory
  color: string        // fallback solid colour (still used if textures don't load)
  colorHex: string
  roughness: number
  metalness: number
  // Add these — both optional so existing entries don't break:
  colorMap?: string    // path relative to public/, e.g. '/textures/navy-fabric-color.jpg'
  normalMap?: string   // path relative to public/, e.g. '/textures/navy-fabric-normal.jpg'
  normalScale?: number // strength of the normal map, default 1.0
  roughnessMap?: string
}
```

Then add the paths to whichever materials have textures ready:

```ts
{ 
  id: 'navy-fabric',
  name: 'Navy Marine Fabric',
  category: 'fabric',
  color: '#1a2b45',
  colorHex: '#1a2b45',
  roughness: 0.30,
  metalness: 0.0,
  colorMap:   '/textures/navy-fabric-color.jpg',
  normalMap:  '/textures/navy-fabric-normal.jpg',
  normalScale: 1.2,
},
```

Materials without `colorMap`/`normalMap` will keep working as solid colours — no changes needed for those entries.

### Step 3 — Load textures in `StoolModel` (Scene.tsx)

Replace the current `useMemo` block that builds the material with one that also loads textures:

```tsx
// Scene.tsx — inside StoolModel()

// Collect the paths that are actually defined for the selected material
const m = UPHOLSTERY_MATERIALS.find(x => x.id === upholsteryId) ?? UPHOLSTERY_MATERIALS[0]

// useTexture (from @react-three/drei) accepts a map of optional paths.
// Pass only the keys that have a value to avoid loading undefined.
const texturePaths: Record<string, string> = {}
if (m.colorMap)      texturePaths.map           = m.colorMap
if (m.normalMap)     texturePaths.normalMap      = m.normalMap
if (m.roughnessMap)  texturePaths.roughnessMap   = m.roughnessMap

// useTexture returns an object with the same keys as the input.
// When texturePaths is empty it returns {}.
const textures = useTexture(texturePaths)

const upholsteryMat = useMemo(() => {
  const mat = new THREE.MeshStandardMaterial({
    color:     textures.map     ? undefined          : new THREE.Color(m.colorHex),
    roughness: m.roughness,
    metalness: m.metalness,
    envMapIntensity: 1.0,
  })

  if (textures.map) {
    textures.map.wrapS = textures.map.wrapT = THREE.RepeatWrapping
    textures.map.repeat.set(2, 2)   // tile the texture; adjust per material
    mat.map = textures.map
  }
  if (textures.normalMap) {
    textures.normalMap.wrapS = textures.normalMap.wrapT = THREE.RepeatWrapping
    textures.normalMap.repeat.set(2, 2)
    mat.normalMap = textures.normalMap
    mat.normalScale = new THREE.Vector2(m.normalScale ?? 1.0, m.normalScale ?? 1.0)
  }
  if (textures.roughnessMap) {
    textures.roughnessMap.wrapS = textures.roughnessMap.wrapT = THREE.RepeatWrapping
    textures.roughnessMap.repeat.set(2, 2)
    mat.roughnessMap = textures.roughnessMap
  }

  return mat
}, [upholsteryId, textures, m])
```

> **Import note:** add `useTexture` to the `@react-three/drei` import at the top of `Scene.tsx`:
> ```ts
> import { useGLTF, Environment, ContactShadows, OrbitControls, useTexture } from '@react-three/drei'
> ```

### Tiling

The `texture.repeat.set(2, 2)` line controls how many times the texture tiles across the UV space. For tight weave fabrics you might want `(4, 4)` or higher; for leather with large grain you might want `(1.5, 1.5)`. Different materials can have different values — add a `textureRepeat?: number` field to `MaterialOption` if you need per-material control.

### Normal map strength

`normalScale` controls the "depth" of the surface detail. `1.0` is physically neutral. Going above `2.0` usually looks artificial. Start at `1.0` and bump up slightly until the weave reads clearly in both lighting modes.

---

## Part 3 — Adding a new GLB model (C113, C114)

### Step 1 — Drop the file in `public/`

```
public/
├── stool.glb       ← C111 (existing)
├── c113.glb        ← new
└── c114.glb        ← new
```

### Step 2 — Inspect the mesh names

Run the dev server and visit:

```
GET http://localhost:3000/api/glb-info
```

This endpoint reads `public/stool.glb` and returns all node/mesh names as JSON. To inspect a different file, temporarily edit `src/app/api/glb-info/route.ts` — change the filename at the top:

```ts
const filePath = path.join(process.cwd(), 'public', 'c113.glb')  // ← change here
```

Look for the nodes that correspond to:
- **Upholstery** (seat + backrest cushions) — typically `Cube.XXX` nodes
- **Armrests** — look for group nodes named `bracciolo-*` or similar
- **Rotating body** — the group that should spin with drag interaction

### Step 3 — Update `src/models/index.ts`

Set `glbPath` for the model:

```ts
{
  id: 'c113',
  name: 'C113',
  glbPath: '/c113.glb',
},
```

### Step 4 — Add mesh name configuration

The mesh detection functions in `Scene.tsx` (`isUpholsteryMesh`, `isArmrest`, `isRotatingBody`) are currently hardcoded for C111's node names. When C113/C114 have different mesh names, you will need to either:

**Option A (quick):** update the sets/functions to also include the new names:
```ts
const UPHOLSTERY_MESH_NAMES = new Set(['cube005', 'cube006', 'seat_c113', 'back_c113'])
```

**Option B (clean, recommended for multiple models):** extend `ModelConfig` with per-model mesh name arrays and pass them as props through to `Scene.tsx`. The architecture for this is already sketched in `ARCHITECTURE.md` under the routing section.

### Step 5 — The model appears in the homepage automatically

Once `glbPath` is non-null in `MODELS`, the homepage card for that model becomes active and links to `/configure/c113`. No other changes needed.

---

## Quick-reference: `MeshStandardMaterial` texture slots

| Slot | Property | Notes |
|------|----------|-------|
| Colour/albedo | `mat.map` | Multiplied with `mat.color`; set `mat.color = 0xffffff` when using a map |
| Normal | `mat.normalMap` + `mat.normalScale` | OpenGL convention |
| Roughness | `mat.roughnessMap` | Sampled from G channel by default |
| Metalness | `mat.metalnessMap` | Sampled from B channel by default |
| AO | `mat.aoMap` | Requires a second UV set (`uv2`) on the geometry |
| Emissive | `mat.emissiveMap` + `mat.emissive` | Not relevant for upholstery |

All of these are part of Three.js's standard PBR material — no custom shaders needed.
