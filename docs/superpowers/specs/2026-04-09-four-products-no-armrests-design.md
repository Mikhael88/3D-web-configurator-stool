# Design — Four products, remove armrests selector
_Date: 2026-04-09_

## Summary

Add C112 as a fourth product alongside C111/C113/C114. Each product now maps to its own dedicated GLB file. The homepage grid expands to 4 columns. The "armrests" toggle is removed from the configurator entirely — C111 (no armrests, lower backrest) and C112 (with armrests, higher backrest) are now distinct products, so the toggle is redundant. The sidebar product title becomes dynamic, showing the model ID. The PDF is updated accordingly.

---

## 1. Models registry — `src/models/index.ts`

Add C112 entry. Update GLB paths for all four models:

| id    | glbPath      | status      |
|-------|--------------|-------------|
| c111  | /C111.glb    | active      |
| c112  | /C112.glb    | active      |
| c113  | /C113.glb    | active      |
| c114  | /C114.glb    | active      |

`stool.glb` is no longer referenced by any model. The file can remain in `public/` but is unused.

---

## 2. Homepage — `src/app/page.tsx`

Change `grid-cols-3` to `grid-cols-4`. No other changes — the grid renders from `MODELS`, so the fourth card appears automatically.

---

## 3. Zustand store — `src/stores/configurator-store.ts`

Remove:
- `showArmrests: boolean` from `ConfiguratorState`
- `toggleArmrests: () => void` from `ConfiguratorState`
- Initial value `showArmrests: true`
- `toggleArmrests` implementation

Keep everything else unchanged.

---

## 4. Scene — `src/components/configurator/Scene.tsx`

Remove:
- `isArmrest()` helper function
- `showArmrests` from the `useConfiguratorStore()` destructure in `StoolModel`
- The armrest visibility block inside the `useEffect` that traverses the scene (`if (isArmrest(...)) { mesh.visible = showArmrests; return }`)
- `showArmrests` from the `useEffect` dependency array

Keep all other logic (upholstery materials, rotation, capture, lighting) unchanged.

---

## 5. Sidebar — `src/components/configurator/ConfigSidebar.tsx`

### 5a. Store imports
Remove `showArmrests` and `toggleArmrests` from the `useConfiguratorStore()` destructure.

### 5b. Dynamic title
Replace the hardcoded `<h1>Horizon Stool</h1>` with `<h1>{modelId.toUpperCase()}</h1>`. `modelId` is already read from `useParams()` on line 97.

### 5c. Remove armrests toggle section
Delete the entire "Configuration Options" `<section>` block (the toggle for "Integrated Armrests").

### 5d. PDF summary
In `summaryRows`, remove the `['Armrests', ...]` entry. The model ID is already present in the PDF header line (`${modelId.toUpperCase()} — Configuration Summary`), so no addition is needed. The summary will have two columns: Upholstery and Structure Finish.

---

## Files NOT changed

- `src/app/configure/[model]/page.tsx` — no changes needed
- `src/lib/capture-ref.ts` — no changes needed
- `next.config.ts` — no changes needed
