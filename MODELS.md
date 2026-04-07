# Modelli 3D — Atelier Maritime

## Modello attivo: Horizon Stool

**File GLB:** `public/stool.glb` (10.1 MB)  
**Sorgente originale:** `upload/sgabello-RT-SCENA SEPARATA.glb` (11 MB)

---

## Gerarchia nodi Three.js

```
stool                               ← radice, mesh: "39020_TUBO_A_AF1" (base fissa)
├── [hardware base]
│     39019_DADO_M6_AF0 ... 39020_VITE_TCEI_... (viti, dadi, flange, ralle, molle)
│
└── rotating-body                   ← NODO ROTANTE (Y), mesh: "39020_TUBO_B_AF1"
      ├── Cube.003                  ← struttura seduta
      ├── Cube.004                  ← struttura seduta
      ├── Cube.005  ◀──────────── SEDUTA (cuscino) — mesh GLB: "Cube.002"
      ├── Cube.006  ◀──────────── SCHIENALE — mesh GLB: "Cube.005"
      ├── bracciolo-dx              ← bracciolo destro (Group)
      │     ├── 39022_BRACCIOLO_APPOGGIO_V3.001
      │     ├── 39022_BRACCIOLO_APPOGGIO_V3.002
      │     └── 39022_AUTOFIL_3-5X13_DIN7982.003/.004/.005
      ├── bracciolo-sx              ← bracciolo sinistro (Group)
      │     ├── 39022_BRACCIOLO_APPOGGIO_V3
      │     ├── 39022_BRACCIOLO_APPOGGIO_V3.003
      │     └── 39022_AUTOFIL_3-5X13_DIN7982 / .001 / .002
      └── [hardware corpo rotante]
            39022_DADO_CIECO_M6 ... 39022_VITE-TSEI-M6X16 ... ecc.
```

> **Importante:** Three.js (GLTFLoader) usa il nome del **node**, non del mesh.
> I punti vengono preservati. `"Cube.005"` rimane `"Cube.005"`, non `"Cube005"`.

---

## Mesh target del configuratore

### Tappezzeria (seduta + schienale)

| Node name | Mesh name nel GLB | Three.js `object.name` | Chiave nel codice |
|-----------|-------------------|------------------------|-------------------|
| `Cube.005` | `Cube.002` | `"Cube005"` (punti rimossi) | `'cube005'` |
| `Cube.006` | `Cube.005` | `"Cube006"` (punti rimossi) | `'cube006'` |

Three.js GLTFLoader rimuove i punti dai nomi degli oggetti (`"Cube.005"` → `"Cube005"`).

Riconoscimento in `Scene.tsx`:
```ts
const UPHOLSTERY_MESH_NAMES = new Set(['cube005', 'cube006'])
function isUpholsteryMesh(name: string) {
  return UPHOLSTERY_MESH_NAMES.has(name.toLowerCase())
}
```

### Braccioli

| Node name | Tipo | Chiave nel codice |
|-----------|------|-------------------|
| `bracciolo-dx` | Group | `'bracciolodx'` (dopo strip `-`) |
| `bracciolo-sx` | Group | `'bracciolosx'` (dopo strip `-`) |

Riconoscimento:
```ts
function isArmrest(name: string) {
  const n = name.toLowerCase().replace(/[_\-\s]/g, '')
  return n === 'bracciolosx' || n === 'bracciolodx'
}
```

La visibilità viene impostata sui **mesh figli diretti** del Group bracciolo.
I nipoti (viti autofil) non vengono nascosti — comportamento accettabile esteticamente.

### Corpo rotante

| Node name | Tipo | Note |
|-----------|------|------|
| `rotating-body` | Object3D/Group | Ruota sull'asse Y via drag |

Riconoscimento:
```ts
function isRotatingBody(name: string) {
  const n = name.toLowerCase().replace(/[_\-\s]/g, '')
  return n === 'rotatingbody'
}
```

---

## Materiali nel GLB (16 totali)

| # | Nome | Tipo | Color base | Roughness | Note |
|---|------|------|------------|-----------|------|
| 0 | Level 12 | acciaio scuro | `#030303` | 0.24 | |
| 1 | Level 1 | acciaio chiaro | `#BABABA` | 0.11 | |
| 2 | Level 5 | metallo cromato | (texture) | 0.07 | |
| 3 | Level 11 | acciaio medio | `#7A7A7A` | 0.12 | |
| 4 | Level 2 | acciaio neutro | `#757575` | 0.11 | |
| 5 | Level 4 | metallo | (texture) | 0.21 | |
| 6 | Level 8 | acciaio lucido | (texture) | 0.05 | |
| 7 | Level 9 | metallo nero | (texture) | — | metalness=0 |
| 8 | Level 10 | quasi-nero | `#060606` | 0.17 | |
| 9 | Level 16 | **PLACEHOLDER** | ciano `[0,1,1]` | 0.50 | ⚠️ debug Blender |
| 10 | Wood | teak | (texture) | 0.32 | schienale teak |
| 11 | Level 6 | acciaio | `#ABABAB` | 0.12 | |
| 12 | Level 15 | **PLACEHOLDER** | magenta `[1,.6,1]` | 0.50 | ⚠️ debug Blender |
| 13 | Cuciture | tessuto | (texture) | 0.41 | dettaglio cuciture |
| 14 | Wood.001 | teak variante | (texture) | 0.32 | |
| 15 | tessuto | **tappezzeria** | (texture) | 0.35 | seduta + schienale |

I materiali `Level 15` (magenta) e `Level 16` (ciano) sono probabilmente placeholder
rimasti da Blender. Da pulire nella prossima versione del GLB.

---

## Materiali configurabili (store)

Definiti in `src/stores/configurator-store.ts` come `UPHOLSTERY_MATERIALS`.
Vengono applicati come `MeshStandardMaterial` su `Cube.005` e `Cube.006`,
sovrascrivendo il materiale `tessuto` originale del GLB.

### Tessuti

| ID | Nome | Hex | Roughness | Metalness |
|----|------|-----|-----------|-----------|
| `navy-fabric` | Navy Marine Fabric | `#1a2b45` | 0.30 | 0.0 |
| `sand-fabric` | Sand Beige Fabric | `#c4a97d` | 0.35 | 0.0 |
| `charcoal-fabric` | Charcoal Melange | `#3a3a3e` | 0.25 | 0.0 |
| `ivory-fabric` | Ivory Linen | `#e8e0d4` | 0.40 | 0.0 |

### Pelli

| ID | Nome | Hex | Roughness | Metalness |
|----|------|-----|-----------|-----------|
| `cognac-leather` | Cognac Leather | `#8b4513` | 0.45 | 0.0 |
| `black-leather` | Black Leather | `#1a1a1a` | 0.35 | 0.0 |
| `tan-leather` | Natural Tan Leather | `#c4956a` | 0.60 | 0.0 |
| `burgundy-leather` | Burgundy Leather | `#5c1a1a` | 0.58 | 0.0 |

**Default:** `navy-fabric`

---

## Aggiungere un nuovo modello

1. Esporta il GLB da Blender (o altro tool) in `public/<nome>.glb`
2. Ispeziona i nomi dei nodi: `GET /api/glb-info` (aggiornare il path nella route se serve)
3. Documenta la gerarchia qui sopra in una nuova sezione
4. Crea una `ModelConfig` con i mesh target specifici (vedi `ARCHITECTURE.md`)
5. Aggiorna lo store Zustand per gestire il `modelId` corrente
