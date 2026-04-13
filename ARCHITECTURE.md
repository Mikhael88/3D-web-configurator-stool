# Architettura — Atelier Maritime 3D Configurator

## Struttura file (solo file rilevanti)

```
project/
├── public/
│   └── stool.glb                        # Modello 3D sgabello (10 MB)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # RootLayout: font Google, metadata
│   │   ├── page.tsx                     # Pagina principale (l'intera app per ora)
│   │   ├── globals.css                  # Tailwind + stili custom configuratore
│   │   └── api/
│   │       └── glb-info/route.ts        # Utility debug: ispeziona mesh del GLB
│   │
│   ├── components/
│   │   └── configurator/
│   │       ├── Scene.tsx                # Scena Three.js (Canvas, modello, luci, interazione)
│   │       └── ConfigSidebar.tsx        # Sidebar UI configurazione
│   │
│   ├── stores/
│   │   └── configurator-store.ts        # Zustand store + definizione materiali
│   │
│   └── lib/
│       └── utils.ts                     # cn() helper (clsx + tailwind-merge)
│
├── CONTEXT.md
├── ARCHITECTURE.md
├── MODELS.md
├── package.json
└── tsconfig.json
```

## Flusso dati

```
ConfigSidebar
  └─[click swatch]─▶ useConfiguratorStore.setUpholstery(id)
                             │
                             ▼
                     configurator-store.ts
                     { upholsteryId, showArmrests, lightingMode }
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
        Scene.tsx                   ConfigSidebar.tsx
        StoolModel                  (re-render UI)
        useEffect ─▶ scene.traverse ─▶ mesh.material = upholsteryMat
```

## Componenti principali

### `src/stores/configurator-store.ts`
Unico store Zustand dell'app. Contiene:
- Stato: `upholsteryId`, `showArmrests`, `lightingMode`
- Actions: `setUpholstery`, `toggleArmrests`, `setLighting`
- Costante `UPHOLSTERY_MATERIALS`: array di `MaterialOption` con proprietà PBR per Three.js

### `src/components/configurator/Scene.tsx`
Caricato con `dynamic(..., { ssr: false })` per evitare problemi di SSR con WebGL.

Contiene questi sotto-componenti:

| Componente | Ruolo |
|------------|-------|
| `DaylightSetup` | Rig luci: ambient + 2 directional + hemisphere |
| `StudioSetup` | Rig luci: fill + key + 2 rim + ground glow + shadow catcher |
| `StoolModel` | Carica il GLB, applica materiali tappezzeria, gestisce visibilità braccioli |
| `StoolInteraction` | Raycasting per rotazione drag, OrbitControls |
| `SceneContent` | Assembla tutto: luci, ambiente IBL, modello, shadow |
| `ConfiguratorScene` | Il Canvas R3F esportato |

**Variabili module-level** (anti-pattern, ma funzionale per istanza singola):
```ts
let stoolSceneGroup: THREE.Object3D | null   // ref alla scena GLB
let rotatingBodyObj: THREE.Object3D | null   // ref al nodo "rotating-body"
```

### `src/components/configurator/ConfigSidebar.tsx`
Sidebar destra a larghezza fissa (420px). Contiene:
- `MaterialSwatch` — bottone circolare colorato per ogni materiale
- `SubCategoryLabel` — label sottocategoria (Fabrics / Leathers)
- `LightingButton` — bottone toggle illuminazione
- Bottom CTA: prezzo + "Finalize Order" (placeholder, senza handler)

### `src/app/page.tsx`
Layout full-screen:
```
┌─────────────────────────────────────────────┐
│ HEADER (fixed, gradiente)                   │
├───────────────────────────┬─────────────────┤
│                           │                 │
│   3D VIEWPORT             │  CONFIG SIDEBAR │
│   (flex-1)                │  (420px fixed)  │
│                           │                 │
├───────────────────────────┴─────────────────┤
│ FOOTER (max-lg:hidden)                      │
└─────────────────────────────────────────────┘
```

## Nota critica: applicazione materiali

Three.js conserva i punti nei nomi dei nodi (es. `"Cube.005"` rimane `"Cube.005"`).
I mesh target per la tappezzeria sono identificati dal **nome del node** (non del mesh).
Vedi `MODELS.md` per i nomi esatti.

## Routing

```
app/
├── page.tsx                         # Product selection homepage (C111 / C113 / C114)
└── configure/
    └── [model]/
        └── page.tsx                 # 3D configurator for the selected model
```

Models are defined in `src/models/index.ts` as `MODELS: ModelConfig[]`.
Each model with `glbPath: null` is shown as "Coming Soon" on the homepage.
Clicking C111 navigates to `/configure/c111`; the configurator reads `params.model`,
looks up the config, and passes `glbPath` to `ConfiguratorScene`.

## API route di debug

`GET /api/glb-info` — legge `public/stool.glb` e restituisce JSON con nodi, mesh e
materiali del file. Utile in sviluppo per verificare la struttura di un nuovo GLB prima
di configurare i mesh target nel codice.
