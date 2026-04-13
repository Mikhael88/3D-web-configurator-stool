# Current Situation
_Last updated: 2026-04-09_

## What this project is

Atelier Maritime — a luxury nautical furniture 3D configurator. Built in Next.js 16 / React 19 / Three.js (R3F). The entire app lives inside an iframe embedded in a client's WordPress site. No headers, no footers, no standalone navigation.

Four products: **C111**, **C112**, **C113**, **C114** — all active, each with a dedicated GLB in `public/`.

---

## What was done in this session

All of the following is **written but not yet committed to git**.

### 1. Four products — homepage grid

- `src/models/index.ts`: C112 aggiunto, tutti e 4 i modelli puntano ai rispettivi GLB (`/C111.glb`, `/C112.glb`, `/C113.glb`, `/C114.glb`). `stool.glb` non referenziato.
- `src/app/page.tsx`: griglia `grid-cols-3` → `grid-cols-4`.

### 2. Armrests rimossi

- `src/stores/configurator-store.ts`: `showArmrests` e `toggleArmrests` rimossi.
- `src/components/configurator/Scene.tsx`: `isArmrest()` e logica visibilità braccioli rimossa.
- `src/components/configurator/ConfigSidebar.tsx`: sezione "Configuration Options" rimossa; titolo `h1` ora dinamico (`modelId.toUpperCase()`); riga "Armrests" rimossa dal PDF.

### 3. Mesh materials — nuovi nomi

I mesh nei GLB ora hanno nomi semantici. Mapping in `Scene.tsx`:

| Nome mesh | Comportamento |
|-----------|--------------|
| `tessuto` | upholstery — colore dal selettore |
| `cuciture` | stitching — colore derivato (scurito/schiarito) |
| `metallo` | `MeshPhysicalMaterial` fisso (acciaio 316 marino) |
| `POM-nero`, `legno`, `forex` | materiale GLB originale, non toccato |

### 4. Materiale acciaio migliorato

`METAL_MAT` — `MeshPhysicalMaterial`:
- `color: #c2cad4`, `metalness: 1.0`, `roughness: 0.20`
- `envMapIntensity: 3.6`, `clearcoat: 0.15`, `clearcoatRoughness: 0.10`

### 5. Shadow acne risolto

- Canvas: `PCFSoftShadowMap`
- Luci direzionali: `shadow-bias: -0.0005`, `shadow-normalBias: 0.02`
- Shadow map daylight: 1024 → 2048

### 6. HDR ambiente

- Rimossi preset drei condizionali (apartment/studio)
- `<Environment files="/hdr-ambiente.exr" environmentIntensity={1.0} background={false} />`
- File `public/hdr-ambiente.exr` caricato dal client

### 7. Tone mapping

`THREE.ACESFilmicToneMapping` → `THREE.AgXToneMapping` (Three.js r183, disponibile).

### 8. Interazioni seduta per modello

`src/components/configurator/Scene.tsx` — logica completamente rivista:

| Modello | Click su | Ruota | Spring-back | Altezza |
|---------|----------|-------|-------------|---------|
| C111 | `c111-seduta-tessuto` | `c111-seduta-tessuto` | ✅ | — |
| C112 | `c112-seduta-tessuto` | `c112-seduta-tessuto` | ✅ | — |
| C113 | `c113-seduta-acciaio` | `c113-seduta-acciaio` | ✗ | ✅ 0–198mm (drag verticale) |
| C114 | `c114-seduta-acciaio` | `c114-seduta-acciaio` | ✗ | — |

`modelId` passa per tutta la catena: `page.tsx` → `ConfiguratorScene` → `SceneContent` → `StoolModel` + `StoolInteraction`.

Drag orizzontale = rotazione (invertita rispetto al mouse). Drag verticale C113 = altezza (drag giù = abbassa).
Spring-back C111/C112: `seatTargetRotY *= Math.pow(0.001, delta)`.

---

## Known issues / things still to do

| Item | Notes |
|------|-------|
| **Nothing committed** | Tutto uncommitted. Committare in gruppi a scelta. |
| **Contact button** | Renders ma non fa nulla. Da collegare a mailto/tel/WhatsApp/form. |
| **Product photos** | Cards homepage mostrano SVG placeholder. Sostituire `<svg>` con `<img>` quando arrivano le foto. |
| **Textures tessuto** | Tutti i materiali sono colori piatti. Il client fornirà una texture singola a cui applicare tint hex. Aggiungere `map: textureLoader.load(...)` in `upholsteryMat` dentro `useMemo`. |
| **Mesh upholstery C113/C114** | Verificare con `/api/glb-info?file=C113.glb` se `tessuto`/`cuciture` sono presenti — se nomi diversi, aggiornare i set in `Scene.tsx`. |
| **`/api/glb-info` hardcoded** | Aggiungere `?file=` query param per ispezionare qualsiasi GLB. |
| **Sidebar title** | "The Maritime Series" è ancora statico. Rendere dinamico da `ModelConfig` se necessario. |

---

## Key file map

```
src/
├── app/
│   ├── page.tsx                        ← homepage 4 colonne
│   └── configure/[model]/page.tsx      ← configuratore, passa modelId
├── models/
│   └── index.ts                        ← 4 modelli attivi con GLB paths
├── lib/
│   ├── utils.ts
│   └── capture-ref.ts
├── components/configurator/
│   ├── Scene.tsx                       ← tutto il 3D: materiali, luci, HDR, interazioni seduta
│   └── ConfigSidebar.tsx               ← titolo dinamico, PDF senza armrests
└── stores/
    └── configurator-store.ts           ← solo upholstery + lighting (armrests rimossi)

public/
├── C111.glb, C112.glb, C113.glb, C114.glb
├── hdr-ambiente.exr                    ← HDR custom del client
└── stool.glb                           ← obsoleto, ignorato

docs/
├── current-situation.md                ← questo file
├── HOW-TO-LIGHTING.md
├── HOW-TO-MATERIALS.md
├── ARCHITECTURE.md
├── CONTEXT.md
└── MODELS.md
```
