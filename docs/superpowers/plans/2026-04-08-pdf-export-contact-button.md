# PDF Export & Contact Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the price + "Finalize Order" bottom section of the configurator sidebar with a PDF export button (three 3D views + config summary) and a placeholder Contact button.

**Architecture:** A shared `src/lib/capture-ref.ts` module holds a function reference that `Scene.tsx` registers (via a `CaptureHandler` component inside the R3F Canvas) and `ConfigSidebar.tsx` calls. ConfigSidebar generates the PDF client-side using `jspdf` with a dynamic import, passing the three JPEG captures plus config store values.

**Tech Stack:** Next.js 16, React 19, Three.js / R3F (`useThree`), jsPDF 2.x, Zustand 5, TypeScript 5

---

## File Map

| Action | File | What changes |
|--------|------|-------------|
| Install | — | Add `jspdf` package |
| Create | `src/lib/capture-ref.ts` | Shared mutable ref for the capture function |
| Modify | `src/components/configurator/Scene.tsx` | Add `CaptureHandler` component; render it inside `SceneContent` |
| Modify | `src/components/configurator/ConfigSidebar.tsx` | Remove price block; add PDF + Contact buttons; add `handleSavePdf` |

---

## Task 1: Install jspdf

**Files:** `package.json` / `bun.lock` (auto-updated)

- [ ] **Step 1: Install the package**

```bash
bun add jspdf
```

Expected output: `jspdf` appears in `package.json` dependencies.

- [ ] **Step 2: Verify the import resolves**

```bash
bun run build 2>&1 | grep -i "jspdf" | head -5
```

Expected: no "module not found" errors for jspdf.

---

## Task 2: Create `src/lib/capture-ref.ts`

**Files:**
- Create: `src/lib/capture-ref.ts`

This module is the only shared state between `Scene.tsx` (which registers the function) and `ConfigSidebar.tsx` (which calls it). Keeping it in its own file avoids a circular import and keeps both components independent.

- [ ] **Step 1: Create the file**

```ts
// src/lib/capture-ref.ts

export type CaptureViewsFn = () => Promise<{
  front: string
  side: string
  top: string
}>

let captureViewsFn: CaptureViewsFn | null = null

export function setCaptureViews(fn: CaptureViewsFn | null): void {
  captureViewsFn = fn
}

export function getCaptureViews(): CaptureViewsFn | null {
  return captureViewsFn
}
```

- [ ] **Step 2: Verify the file exists**

```bash
ls src/lib/capture-ref.ts
```

Expected: file listed.

---

## Task 3: Add `CaptureHandler` to `Scene.tsx`

**Files:**
- Modify: `src/components/configurator/Scene.tsx`

Two changes: (A) import `setCaptureViews` and add the `CaptureHandler` component, (B) render `<CaptureHandler />` inside `SceneContent`.

- [ ] **Step 1: Add the import at the top of Scene.tsx**

After the existing imports, add:

```ts
import { setCaptureViews } from '@/lib/capture-ref'
```

- [ ] **Step 2: Add the `CaptureHandler` component**

Add this component directly before the `SceneContent` function definition:

```tsx
// ──────────────────────────────────────
// PDF Capture Handler
// ──────────────────────────────────────
function CaptureHandler() {
  const { gl, camera, scene } = useThree()

  useEffect(() => {
    setCaptureViews(async () => {
      const savedPos = camera.position.clone()
      const savedQuat = camera.quaternion.clone()
      const lookTarget = new THREE.Vector3(0, 0.7, 0)

      // front / right-side / top
      const positions: Array<[number, number, number]> = [
        [0,   1.2, 4.0],
        [4.0, 1.2, 0  ],
        [0,   5.5, 0.01],
      ]

      const images: string[] = []
      for (const pos of positions) {
        camera.position.set(...pos)
        camera.lookAt(lookTarget)
        camera.updateMatrixWorld()
        gl.render(scene, camera)
        images.push(gl.domElement.toDataURL('image/jpeg', 0.92))
      }

      // Restore camera
      camera.position.copy(savedPos)
      camera.quaternion.copy(savedQuat)
      camera.updateMatrixWorld()
      gl.render(scene, camera)

      return { front: images[0], side: images[1], top: images[2] }
    })

    return () => { setCaptureViews(null) }
  }, [gl, camera, scene])

  return null
}
```

- [ ] **Step 3: Render `<CaptureHandler />` inside `SceneContent`**

In `SceneContent`, add `<CaptureHandler />` right before the closing `</>`:

```tsx
function SceneContent({ glbPath }: { glbPath: string }) {
  // ... existing code unchanged ...
  return (
    <>
      {/* ... all existing JSX unchanged ... */}
      <CaptureHandler />
    </>
  )
}
```

- [ ] **Step 4: Verify dev server still loads the configurator**

Open http://localhost:3000/configure/c111 — 3D scene should load exactly as before. No console errors.

---

## Task 4: Update `ConfigSidebar.tsx`

**Files:**
- Modify: `src/components/configurator/ConfigSidebar.tsx`

Four changes: (A) new imports, (B) add `isGenerating` state + `handleSavePdf` handler to `ConfigSidebar`, (C) remove the price block, (D) replace the button grid.

- [ ] **Step 1: Add imports at the top of ConfigSidebar.tsx**

After the existing import block, add:

```ts
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { getCaptureViews } from '@/lib/capture-ref'
```

- [ ] **Step 2: Add state and handler inside `ConfigSidebar()`**

Add these lines right after the destructuring of `useConfiguratorStore()` (after line 90 in the original file):

```ts
const [isGenerating, setIsGenerating] = useState(false)
const params = useParams()
const modelId = (params?.model as string) ?? 'c111'

const handleSavePdf = async () => {
  const captureViews = getCaptureViews()
  if (!captureViews) return

  setIsGenerating(true)
  try {
    const { front, side, top } = await captureViews()
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
    const imgH = imgW * 0.65
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
      ['Armrests', showArmrests ? 'Included' : 'Not included'],
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

    // Color swatch under the upholstery column
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
  } finally {
    setIsGenerating(false)
  }
}
```

- [ ] **Step 3: Replace the entire "Fixed Bottom Action Area" `<div>` block**

Find and replace this entire block (from `{/* Fixed Bottom Action Area */}` to its closing `</div>`):

**REMOVE this block (lines 262–299 in original):**
```tsx
      {/* Fixed Bottom Action Area */}
      <div
        className="p-8 pt-6"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(26,28,32,0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex justify-between items-baseline mb-6">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: '#909097' }}>
            Estimated Price
          </span>
          <span
            className="text-3xl font-light"
            style={{ color: '#e2e2e8', fontFamily: "'Manrope', sans-serif" }}
          >
            $4,290.00
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <button
            className="col-span-4 py-4 text-xs uppercase tracking-[0.3em] font-bold transition-all duration-300 shadow-xl hover:shadow-2xl"
            style={{ backgroundColor: '#bcc7de', color: '#263143' }}
          >
            Finalize Order
          </button>
          <button
            className="flex items-center justify-center transition-all duration-300 hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#c6c6cd' }}>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>
```

**REPLACE with:**
```tsx
      {/* Fixed Bottom Action Area */}
      <div
        className="p-8 pt-6"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(26,28,32,0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Save PDF */}
          <button
            onClick={handleSavePdf}
            disabled={isGenerating}
            className="py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] font-bold transition-all duration-300"
            style={{
              backgroundColor: isGenerating ? 'rgba(188,199,222,0.45)' : '#bcc7de',
              color: '#263143',
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

          {/* Contact — placeholder, action to be decided by client */}
          <button
            className="py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] font-medium transition-all duration-300 hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#c6c6cd' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: '#c6c6cd' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Contact
          </button>
        </div>
      </div>
```

- [ ] **Step 4: Verify in browser**

Open http://localhost:3000/configure/c111:
- Bottom area shows two equal buttons: "Save PDF" (light solid) and "Contact" (outlined)
- No price or "Finalize Order" text visible
- Click "Save PDF" — button shows "Generating…", then a PDF downloads
- PDF opens with three views side by side, config summary, and color swatch
- Click "Contact" — nothing happens (expected placeholder)

---

## Self-Review

**Spec coverage:**
- Remove price section ✓ Task 4 step 3
- PDF with front/side/top 3D views ✓ Task 3 (capture) + Task 4 step 2 (addImage)
- Config text summary ✓ Task 4 step 2 (summaryRows)
- Finish color with hex swatch ✓ Task 4 step 2 (swatch block)
- Contact placeholder button ✓ Task 4 step 3

**Placeholder scan:** No TBDs. All code blocks are complete.

**Type consistency:**
- `CaptureViewsFn` defined in Task 2, used in Tasks 3 and 4 ✓
- `setCaptureViews` / `getCaptureViews` defined in Task 2, imported in Tasks 3 and 4 ✓
- `isGenerating` declared in Task 4 step 2, used in Task 4 step 3 ✓
- `handleSavePdf` declared in Task 4 step 2, used in Task 4 step 3 ✓
- `modelId` declared in Task 4 step 2, used in `pdf.save()` call ✓
