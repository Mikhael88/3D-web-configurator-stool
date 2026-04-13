# Mobile Responsive Redesign + Theme Tokens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add theme token system, remove lighting controls, make homepage and configurator fully responsive for mobile with a bottom-sheet sidebar and drop-up material tray.

**Architecture:** A new `src/lib/theme.ts` holds all color tokens; components import `THEME` instead of hardcoding hex values. On mobile the configurator page swaps the sidebar for a `BottomSheet` (fixed bottom, auto-collapses on canvas drag) + `MaterialTray` (drop-up swatch picker). Desktop layout is untouched except removing the lighting section and "The Maritime Series" label.

**Tech Stack:** Next.js 16, React 19, Zustand 5, Tailwind CSS 4, TypeScript. No test runner present — verification is `bun run dev` + visual check.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/theme.ts` | **Create** | All color/shadow tokens — single edit point for palette swaps |
| `src/lib/generate-pdf.ts` | **Create** | PDF generation logic extracted from ConfigSidebar (DRY — used by both desktop + mobile) |
| `src/app/globals.css` | **Edit** | CSS custom properties + updated body colors |
| `src/stores/configurator-store.ts` | **Edit** | Remove lighting state; add `isInteracting`; add 5th fabric + 5th leather |
| `src/components/configurator/Scene.tsx` | **Edit** | Delete `DaylightSetup`; hardcode studio values; remove `lightingMode` reads |
| `src/components/configurator/ConfigSidebar.tsx` | **Edit** | Remove "The Maritime Series" + Lighting section; import `generatePdf`; apply THEME tokens |
| `src/app/page.tsx` | **Edit** | `grid-cols-1 lg:grid-cols-4`; apply THEME tokens |
| `src/components/configurator/BottomSheet.tsx` | **Create** | Mobile-only fixed bottom sheet with collapse/expand logic |
| `src/components/configurator/MaterialTray.tsx` | **Create** | Mobile-only drop-up swatch tray (fabric or leather) |
| `src/app/configure/[model]/page.tsx` | **Edit** | Remove lightingMode; add `setInteracting` on canvas section; mobile overlay + BottomSheet + MaterialTray |

---

### Task 1: Create THEME token file

**Files:**
- Create: `src/lib/theme.ts`

- [ ] **Step 1: Create the file**

```ts
// src/lib/theme.ts
export const THEME = {
  // Backgrounds
  bgPage:      '#f5f2ee',
  bgSidebar:   '#ffffff',
  bgCard:      '#ffffff',
  bgCardImage: 'linear-gradient(160deg, #dde4ec 0%, #c8d2de 100%)',
  bgInput:     '#f9f8f6',

  // Text
  textPrimary:   '#2c3e50',
  textSecondary: 'rgba(44,62,80,0.65)',
  textMuted:     'rgba(44,62,80,0.35)',
  textInverse:   '#ffffff',

  // Accents
  accentNavy:    '#2c3e50',
  accentSand:    '#c9b99a',
  accentSlate:   '#7a9bb5',
  accentSelected: 'rgba(44,62,80,0.15)',

  // Borders
  borderSubtle: 'rgba(44,62,80,0.08)',
  borderMid:    'rgba(44,62,80,0.15)',
  borderStrong: 'rgba(44,62,80,0.25)',

  // Shadows
  shadowSheet: '0 -4px 24px rgba(0,0,0,0.08)',
  shadowTray:  '0 -8px 32px rgba(0,0,0,0.12)',
} as const
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:/Users/morga/project && bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/theme.ts
git commit -m "feat: add THEME token file (palette B — light coastal)"
```

---

### Task 2: Update globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace the entire file contents**

```css
@import "tailwindcss";
@import "tw-animate-css";

/* ── Design Tokens ── */
:root {
  --bg-page:      #f5f2ee;
  --bg-sidebar:   #ffffff;
  --bg-card:      #ffffff;
  --bg-input:     #f9f8f6;
  --text-primary:   #2c3e50;
  --text-secondary: rgba(44,62,80,0.65);
  --text-muted:     rgba(44,62,80,0.35);
  --text-inverse:   #ffffff;
  --accent-navy:    #2c3e50;
  --accent-sand:    #c9b99a;
  --accent-slate:   #7a9bb5;
  --border-subtle:  rgba(44,62,80,0.08);
  --border-mid:     rgba(44,62,80,0.15);
  --border-strong:  rgba(44,62,80,0.25);
}

/* ── Base ── */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Manrope', sans-serif;
  background-color: var(--bg-page);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
  font-size: 20px;
  line-height: 1;
}

.serif-headline {
  font-family: 'Noto Serif', serif;
}

.config-sidebar::-webkit-scrollbar {
  width: 2px;
}

.config-sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.config-sidebar::-webkit-scrollbar-thumb {
  background: var(--border-mid);
  border-radius: 1px;
}

/* Canvas cursor */
canvas {
  cursor: grab;
  transition: background-color 0.8s ease;
}

canvas:active {
  cursor: grabbing;
}

/* Selection color */
::selection {
  background: var(--accent-selected, rgba(44,62,80,0.15));
  color: var(--text-primary);
}
```

- [ ] **Step 2: Run dev and confirm body background is linen (#f5f2ee), no console errors**

```bash
bun run dev
```
Open `http://localhost:3000`. Expected: light linen background.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add CSS custom properties and update body to light palette"
```

---

### Task 3: Update configurator store

**Files:**
- Modify: `src/stores/configurator-store.ts`

- [ ] **Step 1: Replace the entire file**

```ts
import { create } from 'zustand'

export type MaterialCategory = 'fabric' | 'leather'

export interface MaterialOption {
  id: string
  name: string
  category: MaterialCategory
  color: string
  colorHex: string
  roughness: number
  metalness: number
}

export interface ConfiguratorState {
  upholsteryId: string
  isInteracting: boolean
  setUpholstery: (id: string) => void
  setInteracting: (v: boolean) => void
}

export const UPHOLSTERY_MATERIALS: MaterialOption[] = [
  // Fabrics (5)
  { id: 'navy-fabric',     name: 'Navy Marine',   category: 'fabric',  color: '#1a2b45', colorHex: '#1a2b45', roughness: 0.30, metalness: 0.0 },
  { id: 'sand-fabric',     name: 'Sand Beige',    category: 'fabric',  color: '#c4a97d', colorHex: '#c4a97d', roughness: 0.35, metalness: 0.0 },
  { id: 'charcoal-fabric', name: 'Charcoal',      category: 'fabric',  color: '#3a3a3e', colorHex: '#3a3a3e', roughness: 0.25, metalness: 0.0 },
  { id: 'ivory-fabric',    name: 'Ivory Linen',   category: 'fabric',  color: '#e8e0d4', colorHex: '#e8e0d4', roughness: 0.40, metalness: 0.0 },
  { id: 'ocean-fabric',    name: 'Ocean Blue',    category: 'fabric',  color: '#4a6fa5', colorHex: '#4a6fa5', roughness: 0.30, metalness: 0.0 },
  // Leathers (5)
  { id: 'cognac-leather',   name: 'Cognac',       category: 'leather', color: '#8b4513', colorHex: '#8b4513', roughness: 0.45, metalness: 0.0 },
  { id: 'black-leather',    name: 'Black',        category: 'leather', color: '#1a1a1a', colorHex: '#1a1a1a', roughness: 0.35, metalness: 0.0 },
  { id: 'tan-leather',      name: 'Natural Tan',  category: 'leather', color: '#c4956a', colorHex: '#c4956a', roughness: 0.60, metalness: 0.0 },
  { id: 'burgundy-leather', name: 'Burgundy',     category: 'leather', color: '#5c1a1a', colorHex: '#5c1a1a', roughness: 0.58, metalness: 0.0 },
  { id: 'blanc-leather',    name: 'Blanc',        category: 'leather', color: '#f0ece6', colorHex: '#f0ece6', roughness: 0.50, metalness: 0.0 },
]

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  upholsteryId: 'navy-fabric',
  isInteracting: false,
  setUpholstery: (id) => set({ upholsteryId: id }),
  setInteracting: (v) => set({ isInteracting: v }),
}))
```

- [ ] **Step 2: Verify TypeScript**

```bash
bunx tsc --noEmit
```
Expected: TypeScript errors for `lightingMode` / `setLighting` references in other files — these will be fixed in subsequent tasks. If it's only those, proceed.

- [ ] **Step 3: Commit**

```bash
git add src/stores/configurator-store.ts
git commit -m "feat: remove lighting state, add isInteracting, expand materials to 5+5"
```

---

### Task 4: Simplify Scene.tsx — hardcode studio lighting

**Files:**
- Modify: `src/components/configurator/Scene.tsx`

- [ ] **Step 1: Delete `DaylightSetup` function (lines 69–87)**

Remove the entire `DaylightSetup` function:
```tsx
// DELETE this entire block:
function DaylightSetup() {
  return (
    <>
      <ambientLight intensity={0.6} color="#fff5e6" />
      <directionalLight ... />
      <directionalLight ... />
      <hemisphereLight ... />
    </>
  )
}
```

- [ ] **Step 2: Update `SceneContent` — remove `lightingMode`, hardcode studio**

Find and replace the entire `SceneContent` function body:

```tsx
function SceneContent({ glbPath, modelId }: { glbPath: string; modelId: string }) {
  return (
    <>
      <color attach="background" args={['#0d131f']} />
      <fog attach="fog" args={['#0d131f', 10, 25]} />

      <StudioSetup />

      <Environment files="/hdr-ambiente.exr" environmentIntensity={1.0} background={false} />

      <StoolModel glbPath={glbPath} modelId={modelId} />
      <StoolInteraction modelId={modelId} />
      <CaptureHandler />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.7}
        scale={10}
        blur={3}
        far={4}
        color="#0a1628"
      />
    </>
  )
}
```

- [ ] **Step 3: Update `ConfiguratorScene` — remove `lightingMode` reads**

Replace the `ConfiguratorScene` function:

```tsx
export default function ConfiguratorScene({ glbPath, modelId }: { glbPath: string; modelId: string }) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{
        position: [2.5, 2, 2.5],
        fov: 35,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.AgXToneMapping,
        toneMappingExposure: 0.9,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: '#0d131f' }}
    >
      <SceneContent glbPath={glbPath} modelId={modelId} />
    </Canvas>
  )
}
```

- [ ] **Step 4: Verify TypeScript**

```bash
bunx tsc --noEmit
```
Expected: no errors in Scene.tsx. Other files may still have `lightingMode` errors — addressed in later tasks.

- [ ] **Step 5: Commit**

```bash
git add src/components/configurator/Scene.tsx
git commit -m "feat: hardcode dark studio lighting, remove daylight mode from Scene"
```

---

### Task 5: Extract PDF generation to shared utility

**Files:**
- Create: `src/lib/generate-pdf.ts`

- [ ] **Step 1: Create the file**

```ts
import { getCaptureViews } from '@/lib/capture-ref'
import { UPHOLSTERY_MATERIALS } from '@/stores/configurator-store'

export async function generatePdf(modelId: string, upholsteryId: string): Promise<void> {
  const captureViews = getCaptureViews()
  if (!captureViews) return

  const { front, side, top, aspectRatio } = await captureViews()
  const { jsPDF } = await import('jspdf')

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = 297
  const pageH = 210
  const margin = 14

  // ── Header ──
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(8)
  pdf.setTextColor(40, 40, 40)
  pdf.text('ATELIER MARITIME', margin, margin)

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7.5)
  pdf.setTextColor(130, 130, 130)
  pdf.text(dateStr, pageW - margin, margin, { align: 'right' })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13)
  pdf.setTextColor(30, 30, 30)
  pdf.text(`${modelId.toUpperCase()} — Configuration Summary`, margin, margin + 7)

  pdf.setDrawColor(210, 210, 210)
  pdf.setLineWidth(0.25)
  pdf.line(margin, margin + 11, pageW - margin, margin + 11)

  // ── Three images ──
  const imgTop = margin + 15
  const imgW = (pageW - margin * 2 - 8) / 3
  const imgH = imgW / aspectRatio
  const imgLabels = ['Front View', 'Side View', 'Top View']
  const imgData = [front, side, top]

  for (let i = 0; i < 3; i++) {
    const x = margin + i * (imgW + 4)
    pdf.addImage(imgData[i], 'JPEG', x, imgTop, imgW, imgH)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.5)
    pdf.setTextColor(140, 140, 140)
    pdf.text(imgLabels[i], x + imgW / 2, imgTop + imgH + 4, { align: 'center' })
  }

  // ── Config summary ──
  const summaryTop = imgTop + imgH + 10
  pdf.setDrawColor(210, 210, 210)
  pdf.setLineWidth(0.2)
  pdf.line(margin, summaryTop, pageW - margin, summaryTop)

  const upholstery = UPHOLSTERY_MATERIALS.find(m => m.id === upholsteryId) ?? UPHOLSTERY_MATERIALS[0]
  const colW = (pageW - margin * 2) / 3

  const summaryRows: Array<[string, string]> = [
    ['Upholstery', `${upholstery.name} — ${upholstery.category.charAt(0).toUpperCase()}${upholstery.category.slice(1)}`],
    ['Structure Finish', 'Brushed Steel 316'],
  ]

  for (let i = 0; i < summaryRows.length; i++) {
    const [label, value] = summaryRows[i]
    const x = margin + i * colW
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(6.5)
    pdf.setTextColor(150, 150, 150)
    pdf.text(label.toUpperCase(), x, summaryTop + 6)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(35, 35, 35)
    pdf.text(value, x, summaryTop + 12)
  }

  // Color swatch under upholstery column
  const swatchY = summaryTop + 16
  const hex = upholstery.colorHex.replace('#', '')
  pdf.setFillColor(
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  )
  pdf.setDrawColor(180, 180, 180)
  pdf.setLineWidth(0.2)
  pdf.rect(margin, swatchY, 10, 5, 'FD')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(7)
  pdf.setTextColor(110, 110, 110)
  pdf.text(`#${hex.toUpperCase()}`, margin + 13, swatchY + 3.5)

  // ── Footer ──
  pdf.setDrawColor(210, 210, 210)
  pdf.setLineWidth(0.2)
  pdf.line(margin, pageH - 10, pageW - margin, pageH - 10)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  pdf.setTextColor(170, 170, 170)
  pdf.text('Generated by Atelier Maritime 3D Configurator', margin, pageH - 6)
  pdf.text(dateStr, pageW - margin, pageH - 6, { align: 'right' })

  pdf.save(`atelier-maritime-${modelId}-${new Date().toISOString().slice(0, 10)}.pdf`)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/generate-pdf.ts
git commit -m "refactor: extract PDF generation to shared utility"
```

---

### Task 6: Update ConfigSidebar — desktop cleanup + THEME tokens

**Files:**
- Modify: `src/components/configurator/ConfigSidebar.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  useConfiguratorStore,
  UPHOLSTERY_MATERIALS,
  type MaterialOption,
  type MaterialCategory,
} from '@/stores/configurator-store'
import { generatePdf } from '@/lib/generate-pdf'
import { THEME } from '@/lib/theme'

function MaterialSwatch({
  material,
  isSelected,
  onClick,
}: {
  material: MaterialOption
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-full border-2 transition-all duration-300 hover:scale-105"
      style={{
        borderColor: isSelected ? THEME.accentNavy : THEME.borderMid,
        backgroundColor: material.color,
        boxShadow: isSelected ? `0 0 0 4px ${THEME.accentSelected}` : 'none',
      }}
      title={material.name}
    />
  )
}

function SubCategoryLabel({ label }: { label: string }) {
  return (
    <div
      className="text-[10px] uppercase tracking-[0.2em] font-medium"
      style={{ color: THEME.textMuted }}
    >
      {label}
    </div>
  )
}

export default function ConfigSidebar() {
  const { upholsteryId, setUpholstery } = useConfiguratorStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const params = useParams()
  const modelId = (params?.model as string) ?? 'c111'

  const handleSavePdf = async () => {
    setIsGenerating(true)
    try {
      await generatePdf(modelId, upholsteryId)
    } finally {
      setIsGenerating(false)
    }
  }

  const currentUpholstery = UPHOLSTERY_MATERIALS.find(m => m.id === upholsteryId)
  const fabrics = UPHOLSTERY_MATERIALS.filter(m => m.category === 'fabric')
  const leathers = UPHOLSTERY_MATERIALS.filter(m => m.category === 'leather')

  return (
    <aside
      className="w-[420px] max-lg:hidden flex flex-col relative z-30 shadow-2xl overflow-hidden"
      style={{
        backgroundColor: THEME.bgSidebar,
        borderLeft: `1px solid ${THEME.borderSubtle}`,
      }}
    >
      {/* Product Header */}
      <div className="p-8 pb-6">
        <h1
          className="text-4xl lg:text-5xl leading-tight"
          style={{ fontFamily: "'Noto Serif', serif", color: THEME.textPrimary }}
        >
          {modelId.toUpperCase()}
        </h1>
        <p
          className="text-sm mt-5 leading-relaxed font-light max-w-sm"
          style={{ color: THEME.textSecondary, fontFamily: "'Manrope', sans-serif" }}
        >
          A masterpiece of nautical engineering. Crafted with high-grade marine alloys
          and weather-resistant textiles designed to withstand the harshest ocean environments.
        </p>
      </div>

      {/* Scrollable Configuration Area */}
      <div className="flex-grow overflow-y-auto px-8 space-y-10 pb-8 config-sidebar">

        {/* ── Seat & Backrest Material ── */}
        <section>
          <div className="flex justify-between items-end mb-5">
            <h3
              className="text-[11px] uppercase tracking-[0.2em] font-bold"
              style={{ color: THEME.textMuted }}
            >
              Seat &amp; Backrest
            </h3>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: THEME.accentSlate }}
            >
              {currentUpholstery?.name}
            </span>
          </div>

          <div className="mb-5">
            <SubCategoryLabel label="Fabrics" />
            <div className="grid grid-cols-5 gap-3 mt-3">
              {fabrics.map(mat => (
                <MaterialSwatch
                  key={mat.id}
                  material={mat}
                  isSelected={upholsteryId === mat.id}
                  onClick={() => setUpholstery(mat.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <SubCategoryLabel label="Leathers" />
            <div className="grid grid-cols-5 gap-3 mt-3">
              {leathers.map(mat => (
                <MaterialSwatch
                  key={mat.id}
                  material={mat}
                  isSelected={upholsteryId === mat.id}
                  onClick={() => setUpholstery(mat.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Structure Finish (display only) ── */}
        <section>
          <h3
            className="text-[11px] uppercase tracking-[0.2em] font-bold mb-5"
            style={{ color: THEME.textMuted }}
          >
            Structure Finish
          </h3>
          <div className="space-y-3">
            <div
              className="flex items-center justify-between p-4"
              style={{
                border: `1px solid ${THEME.borderMid}`,
                backgroundColor: THEME.bgInput,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.accentNavy }} />
                <span
                  className="text-xs uppercase tracking-widest font-medium"
                  style={{ color: THEME.textPrimary }}
                >
                  Brushed Steel 316
                </span>
              </div>
              <span className="text-[10px]" style={{ color: THEME.textMuted }}>Included</span>
            </div>
          </div>
        </section>

      </div>

      {/* Fixed Bottom Action Area */}
      <div
        className="p-8 pt-6"
        style={{
          borderTop: `1px solid ${THEME.borderSubtle}`,
          backgroundColor: THEME.bgSidebar,
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Save PDF */}
          <button
            onClick={handleSavePdf}
            disabled={isGenerating}
            className="py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] font-bold transition-all duration-300"
            style={{
              backgroundColor: isGenerating ? THEME.borderStrong : THEME.accentNavy,
              color: THEME.textInverse,
              cursor: isGenerating ? 'wait' : 'pointer',
            }}
          >
            {isGenerating ? (
              <span>Generating…</span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <polyline points="9 14 12 17 15 14" />
                </svg>
                Save PDF
              </>
            )}
          </button>

          {/* Contact */}
          <button
            className="py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] font-medium transition-all duration-300"
            style={{
              border: `1px solid ${THEME.borderMid}`,
              color: THEME.textPrimary,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = THEME.bgInput)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Contact
          </button>
        </div>
      </div>
    </aside>
  )
}
```

Note: swatch grid changed from `grid-cols-4` to `grid-cols-5` to fit 5 items.

- [ ] **Step 2: Verify TypeScript**

```bash
bunx tsc --noEmit
```
Expected: no errors in ConfigSidebar.tsx.

- [ ] **Step 3: Run dev and verify desktop sidebar**

```bash
bun run dev
```
Navigate to `http://localhost:3000/configure/c111`. Confirm:
- Light background on sidebar
- No "The Maritime Series" label
- No Lighting section
- 5 fabric swatches + 5 leather swatches in a row
- Save PDF and Contact buttons visible

- [ ] **Step 4: Commit**

```bash
git add src/components/configurator/ConfigSidebar.tsx
git commit -m "feat: apply THEME tokens to sidebar, remove maritime label + lighting, 5x5 swatches"
```

---

### Task 7: Responsive homepage

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MODELS, type ModelConfig } from '@/models'
import { THEME } from '@/lib/theme'

function ProductCard({ model }: { model: ModelConfig }) {
  const router = useRouter()
  const [showCS, setShowCS] = useState(false)
  const isReady = model.glbPath !== null

  const handleClick = () => {
    if (!isReady) { setShowCS(true); return }
    router.push(`/configure/${model.id}`)
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => { if (!isReady) setShowCS(true) }}
      onMouseLeave={() => setShowCS(false)}
      className="relative flex flex-col overflow-hidden transition-all duration-300"
      style={{
        background: THEME.bgCard,
        border: `1px solid ${isReady ? THEME.borderSubtle : 'rgba(44,62,80,0.04)'}`,
        cursor: isReady ? 'pointer' : 'default',
        opacity: isReady ? 1 : 0.45,
      }}
    >
      {/* Image area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ background: THEME.bgCardImage, minHeight: '160px' }}
      >
        <div style={{ opacity: 0.2 }}>
          <svg width="56" height="80" viewBox="0 0 56 80" fill="none">
            <rect x="10" y="6" width="36" height="14" rx="2" fill={THEME.accentNavy}/>
            <rect x="22" y="20" width="12" height="38" rx="1" fill={THEME.accentSlate}/>
            <ellipse cx="28" cy="62" rx="20" ry="5" fill={THEME.accentSand}/>
            <rect x="8" y="66" width="40" height="6" rx="1" fill={THEME.accentNavy}/>
          </svg>
        </div>

        {/* Coming Soon overlay */}
        {!isReady && showCS && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(245,242,238,0.88)' }}
          >
            <div style={{ width: 24, height: 1, background: THEME.borderMid }} />
            <span
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: THEME.textMuted,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Coming Soon
            </span>
            <div style={{ width: 24, height: 1, background: THEME.borderMid }} />
          </div>
        )}

        {/* Subtle glow on hover */}
        {isReady && (
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 40%, ${THEME.accentSelected} 0%, transparent 70%)`,
            }}
          />
        )}
      </div>

      {/* Card footer */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderTop: `1px solid ${THEME.borderSubtle}` }}
      >
        <span
          className="text-sm font-light tracking-[0.08em]"
          style={{ fontFamily: "'Noto Serif', serif", color: THEME.textPrimary }}
        >
          {model.name}
        </span>
        {isReady && (
          <span
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              color: THEME.textMuted,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Configure →
          </span>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div
      className="min-h-screen lg:h-screen lg:overflow-hidden w-screen flex flex-col items-center justify-center px-4 py-6 lg:px-12 lg:py-8"
      style={{ backgroundColor: THEME.bgPage }}
    >
      {/* Brand signature */}
      <span
        className="mb-6 block"
        style={{
          fontFamily: "'Manrope', sans-serif",
          fontSize: '0.6rem',
          letterSpacing: '0.55em',
          textTransform: 'uppercase',
          color: THEME.textMuted,
          fontWeight: 300,
        }}
      >
        Atelier Maritime
      </span>

      {/* Product grid — 1 col mobile, 4 col desktop */}
      <div
        className="grid grid-cols-1 lg:grid-cols-4 w-full"
        style={{ gap: '16px' }}
      >
        {MODELS.map(model => (
          <ProductCard key={model.id} model={model} />
        ))}
      </div>

      {/* Bottom hint */}
      <span
        className="mt-5 block"
        style={{
          fontSize: '0.6rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: THEME.textMuted,
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        Select a model to begin configuration
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Verify dev — homepage**

Open `http://localhost:3000`. Confirm:
- Desktop: 4 columns
- Mobile (resize browser to < 1024px): 4 stacked rows
- Light linen background, navy text

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: responsive homepage grid (1-col mobile, 4-col desktop) + THEME tokens"
```

---

### Task 8: Create BottomSheet component

**Files:**
- Create: `src/components/configurator/BottomSheet.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { generatePdf } from '@/lib/generate-pdf'
import { THEME } from '@/lib/theme'

interface Props {
  modelId: string
  onOpenTray: (category: 'fabric' | 'leather') => void
}

const DESCRIPTION = 'A masterpiece of nautical engineering. Crafted with high-grade marine alloys and weather-resistant textiles designed to withstand the harshest ocean environments.'

export default function BottomSheet({ modelId, onOpenTray }: Props) {
  const { upholsteryId, isInteracting } = useConfiguratorStore()
  const [expanded, setExpanded] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  // Auto-collapse while user drags the model
  useEffect(() => {
    if (isInteracting) setExpanded(false)
  }, [isInteracting])

  const handleSavePdf = async () => {
    setIsGenerating(true)
    try {
      await generatePdf(modelId, upholsteryId)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0"
      style={{
        zIndex: 40,
        background: THEME.bgSidebar,
        borderTop: `1px solid ${THEME.borderSubtle}`,
        boxShadow: THEME.shadowSheet,
        height: '55vh',
        transform: expanded ? 'translateY(0)' : 'translateY(calc(100% - 48px))',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Drag handle — tap to toggle */}
      <div
        role="button"
        aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '14px 0 10px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: THEME.borderMid,
          }}
        />
      </div>

      {/* Scrollable content */}
      <div
        style={{
          padding: '0 20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          paddingBottom: 24,
        }}
      >
        {/* Material buttons */}
        <div>
          <div
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: THEME.textMuted,
              marginBottom: 8,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Seat &amp; Backrest
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setExpanded(true); onOpenTray('fabric') }}
              style={{
                flex: 1,
                padding: '12px 0',
                border: `1px solid ${THEME.borderMid}`,
                background: THEME.bgInput,
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: THEME.textPrimary,
                cursor: 'pointer',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              FABRIC ▲
            </button>
            <button
              onClick={() => { setExpanded(true); onOpenTray('leather') }}
              style={{
                flex: 1,
                padding: '12px 0',
                border: `1px solid ${THEME.borderMid}`,
                background: THEME.bgInput,
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: THEME.textPrimary,
                cursor: 'pointer',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              LEATHER ▲
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSavePdf}
            disabled={isGenerating}
            style={{
              flex: 1,
              padding: '12px 0',
              background: isGenerating ? THEME.borderStrong : THEME.accentNavy,
              color: THEME.textInverse,
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              fontWeight: 700,
              border: 'none',
              cursor: isGenerating ? 'wait' : 'pointer',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {isGenerating ? 'Generating…' : 'SAVE PDF'}
          </button>
          <button
            style={{
              flex: 1,
              padding: '12px 0',
              border: `1px solid ${THEME.borderMid}`,
              background: 'transparent',
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              color: THEME.textPrimary,
              cursor: 'pointer',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            CONTACT
          </button>
        </div>

        {/* Description */}
        <div style={{ borderTop: `1px solid ${THEME.borderSubtle}`, paddingTop: 14 }}>
          <div
            style={{
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: THEME.textMuted,
              marginBottom: 8,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            About
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              lineHeight: 1.6,
              color: THEME.textSecondary,
              margin: 0,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {DESCRIPTION}
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
bunx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/configurator/BottomSheet.tsx
git commit -m "feat: add BottomSheet mobile component with auto-collapse on model interaction"
```

---

### Task 9: Create MaterialTray component

**Files:**
- Create: `src/components/configurator/MaterialTray.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { UPHOLSTERY_MATERIALS, useConfiguratorStore } from '@/stores/configurator-store'
import { THEME } from '@/lib/theme'

interface Props {
  category: 'fabric' | 'leather' | null
  onClose: () => void
}

export default function MaterialTray({ category, onClose }: Props) {
  const { upholsteryId, setUpholstery } = useConfiguratorStore()
  const trayRef = useRef<HTMLDivElement>(null)

  const materials = UPHOLSTERY_MATERIALS.filter(m => m.category === category)
  const selectedMaterial = UPHOLSTERY_MATERIALS.find(m => m.id === upholsteryId)

  // Close on outside click
  useEffect(() => {
    if (!category) return
    const handler = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid the opening click triggering immediate close
    const timeout = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handler)
    }
  }, [category, onClose])

  if (!category) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="lg:hidden fixed inset-0"
        style={{ zIndex: 48, background: 'transparent' }}
        onClick={onClose}
      />

      {/* Tray panel */}
      <div
        ref={trayRef}
        className="lg:hidden fixed bottom-0 left-0 right-0"
        style={{
          zIndex: 50,
          background: THEME.bgSidebar,
          borderTop: `1px solid ${THEME.borderSubtle}`,
          boxShadow: THEME.shadowTray,
          padding: '16px 24px 32px',
        }}
      >
        {/* Label row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: THEME.textMuted,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {category === 'fabric' ? 'Fabric' : 'Leather'}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: THEME.textMuted,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {selectedMaterial?.name ?? ''}
          </div>
        </div>

        {/* Swatch row */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          {materials.map(mat => (
            <button
              key={mat.id}
              onClick={() => { setUpholstery(mat.id); onClose() }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: mat.color,
                border: upholsteryId === mat.id
                  ? `3px solid ${THEME.accentNavy}`
                  : `2px solid ${THEME.borderMid}`,
                boxShadow: upholsteryId === mat.id
                  ? `0 0 0 3px ${THEME.accentSelected}`
                  : 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'transform 0.15s ease',
                flexShrink: 0,
              }}
              title={mat.name}
            />
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/configurator/MaterialTray.tsx
git commit -m "feat: add MaterialTray drop-up swatch picker for mobile"
```

---

### Task 10: Wire mobile layout in configurator page

**Files:**
- Modify: `src/app/configure/[model]/page.tsx`

- [ ] **Step 1: Replace the entire file**

```tsx
'use client'

import { Suspense, use, useState } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { useConfiguratorStore } from '@/stores/configurator-store'
import ConfigSidebar from '@/components/configurator/ConfigSidebar'
import BottomSheet from '@/components/configurator/BottomSheet'
import MaterialTray from '@/components/configurator/MaterialTray'
import { MODELS } from '@/models'
import { THEME } from '@/lib/theme'

const ConfiguratorScene = dynamic(
  () => import('@/components/configurator/Scene'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0d131f' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#8a9bb5', borderTopColor: 'transparent' }}
          />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: '#8a9bb5' }}>
            Loading 3D Scene
          </span>
        </div>
      </div>
    ),
  }
)

function LoadingScreen() {
  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#0d131f' }}>
      <div className="flex flex-col items-center gap-6">
        <span
          className="text-2xl font-bold tracking-[0.3em] uppercase"
          style={{ fontFamily: "'Noto Serif', serif", color: '#e2e2e8' }}
        >
          ATELIER MARITIME
        </span>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#8a9bb5', borderTopColor: 'transparent' }}
        />
      </div>
    </div>
  )
}

export default function ConfiguratorPage({
  params,
}: {
  params: Promise<{ model: string }>
}) {
  const { model: modelId } = use(params)
  const modelConfig = MODELS.find(m => m.id === modelId)
  const setInteracting = useConfiguratorStore(s => s.setInteracting)
  const [activeTray, setActiveTray] = useState<'fabric' | 'leather' | null>(null)

  if (!modelConfig?.glbPath) notFound()

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: THEME.bgPage }}
    >
      <main className="flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        <section
          className="flex-1 relative"
          onPointerDown={() => setInteracting(true)}
          onPointerUp={() => setInteracting(false)}
          onPointerCancel={() => setInteracting(false)}
        >
          {/* Bottom gradient — aids canvas readability at the fold */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(13,19,31,0.6) 100%)',
            }}
          />

          {/* 3D Canvas */}
          <Suspense fallback={<LoadingScreen />}>
            <ConfiguratorScene glbPath={modelConfig.glbPath!} modelId={modelId} />
          </Suspense>

          {/* Interaction hints — desktop only */}
          <div className="absolute bottom-8 left-8 z-20 hidden lg:flex flex-col gap-2 opacity-40">
            <div className="flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c6c6cd" strokeWidth="1.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: '#c6c6cd', fontFamily: "'Manrope', sans-serif" }}
              >
                Orbit &amp; Pan
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c6c6cd" strokeWidth="1.5">
                <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                <path d="M2 2l7.586 7.586" />
              </svg>
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: '#c6c6cd', fontFamily: "'Manrope', sans-serif" }}
              >
                Click Stool to Swivel
              </span>
            </div>
          </div>

          {/* Product name overlay — mobile only, on dark canvas so use light text */}
          <div className="absolute top-3 left-4 z-20 lg:hidden">
            <span
              style={{
                fontFamily: "'Noto Serif', serif",
                fontSize: '1.25rem',
                color: '#e2e2e8',
                letterSpacing: '0.02em',
              }}
            >
              {modelId.toUpperCase()}
            </span>
          </div>
        </section>

        {/* Desktop sidebar — has max-lg:hidden built in */}
        <ConfigSidebar />
      </main>

      {/* Mobile UI — hidden on desktop */}
      <BottomSheet modelId={modelId} onOpenTray={setActiveTray} />
      <MaterialTray category={activeTray} onClose={() => setActiveTray(null)} />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript — all errors resolved**

```bash
bunx tsc --noEmit
```
Expected: zero errors.

- [ ] **Step 3: Run dev — full mobile test**

```bash
bun run dev
```

Open `http://localhost:3000/configure/c111` in browser, resize to mobile width (< 1024px). Confirm:
- Product name "C111" visible top-left on dark canvas
- BottomSheet visible at bottom with drag handle
- Dragging the 3D model collapses the sheet; handle stays visible
- Tapping handle expands sheet
- Tapping FABRIC ▲ opens the fabric tray with 5 swatches over the canvas
- Selecting a swatch changes the model material and closes tray
- Tapping LEATHER ▲ opens leather tray with 5 swatches
- SAVE PDF generates and downloads correctly
- Desktop (≥ 1024px): regular sidebar visible, no BottomSheet

- [ ] **Step 4: Commit**

```bash
git add src/app/configure/\[model\]/page.tsx
git commit -m "feat: mobile configurator layout — BottomSheet + MaterialTray + canvas overlay"
```
