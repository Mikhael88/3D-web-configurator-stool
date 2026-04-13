# Homepage Product Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a product selection homepage at `/`, move the 3D configurator to `/configure/[model]`, remove header/footer everywhere, and enable cross-origin iframe embedding.

**Architecture:** New `/` homepage renders three product cards (C111, C113, C114); C111 navigates to `/configure/c111`, C113/C114 show a "Coming Soon" overlay. A central `src/models/index.ts` defines per-model config. `Scene.tsx` accepts a `glbPath` prop instead of a hardcoded constant. `next.config.ts` adds a `Content-Security-Policy: frame-ancestors *` header to enable cross-origin iframe embedding.

**Tech Stack:** Next.js 16 App Router, React 19, Zustand 5, Three.js / R3F, Tailwind CSS v4, TypeScript 5, Bun

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Create | `src/models/index.ts` | `ModelConfig` interface + `MODELS` array |
| Modify | `next.config.ts` | Add `headers()` for iframe framing |
| Modify | `src/components/configurator/Scene.tsx` | Accept `glbPath` prop, remove module-level constant |
| Create | `src/app/configure/[model]/page.tsx` | Configurator page (current page.tsx minus header/footer) |
| Replace | `src/app/page.tsx` | Product selection homepage |

---

## Task 1: Create `src/models/index.ts`

**Files:**
- Create: `src/models/index.ts`

- [ ] **Step 1: Create the file**

```ts
// src/models/index.ts

export interface ModelConfig {
  id: string           // URL slug used in /configure/[model]
  name: string         // Display name shown on the card
  glbPath: string | null  // null = not ready, card shown as "coming soon"
}

export const MODELS: ModelConfig[] = [
  {
    id: 'c111',
    name: 'C111',
    glbPath: '/stool.glb',
  },
  {
    id: 'c113',
    name: 'C113',
    glbPath: null,
  },
  {
    id: 'c114',
    name: 'C114',
    glbPath: null,
  },
]
```

- [ ] **Step 2: Verify the file exists**

```bash
ls src/models/index.ts
```

Expected: file listed.

- [ ] **Step 3: Commit**

```bash
git add src/models/index.ts
git commit -m "feat: add ModelConfig and MODELS array for product catalogue"
```

---

## Task 2: Allow cross-origin iframe embedding in `next.config.ts`

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add `headers()` to the config**

Replace the entire file with:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ['*'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow this app to be embedded as an iframe from any origin
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
    ]
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify the dev server accepts the change**

```bash
bun run dev
```

Expected: server starts without errors. Open http://localhost:3000 and check DevTools → Network → response headers for the `Content-Security-Policy: frame-ancestors *` header.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: allow cross-origin iframe embedding via CSP frame-ancestors"
```

---

## Task 3: Make `Scene.tsx` accept a `glbPath` prop

**Files:**
- Modify: `src/components/configurator/Scene.tsx`

The current file has `const MODEL_PATH = '/stool.glb'` hardcoded at the top and `StoolModel` uses it directly. We thread `glbPath` as a prop through `ConfiguratorScene` → `SceneContent` → `StoolModel`.

- [ ] **Step 1: Remove the hardcoded constant and add props**

Make these four targeted changes to `Scene.tsx`:

**Change A** — Remove the module-level constant (line 9):
```
// DELETE this line:
const MODEL_PATH = '/stool.glb'
```

**Change B** — Update `StoolModel` to accept a prop:
```tsx
// BEFORE:
function StoolModel() {
  const { scene } = useGLTF(MODEL_PATH)

// AFTER:
function StoolModel({ glbPath }: { glbPath: string }) {
  const { scene } = useGLTF(glbPath)
```

**Change C** — Update `SceneContent` to accept and forward the prop:
```tsx
// BEFORE:
function SceneContent() {
  const { lightingMode } = useConfiguratorStore()
  // ...
      <StoolModel />

// AFTER:
function SceneContent({ glbPath }: { glbPath: string }) {
  const { lightingMode } = useConfiguratorStore()
  // ...
      <StoolModel glbPath={glbPath} />
```

**Change D** — Update the exported `ConfiguratorScene` to accept and forward the prop:
```tsx
// BEFORE:
export default function ConfiguratorScene() {
  // ...
      <SceneContent />

// AFTER:
export default function ConfiguratorScene({ glbPath }: { glbPath: string }) {
  // ...
      <SceneContent glbPath={glbPath} />
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
bun run build 2>&1 | head -30
```

Expected: build completes (TypeScript errors are ignored per config, but no import errors should appear).

- [ ] **Step 3: Commit**

```bash
git add src/components/configurator/Scene.tsx
git commit -m "refactor: make ConfiguratorScene accept glbPath prop instead of hardcoded constant"
```

---

## Task 4: Create `/configure/[model]/page.tsx`

**Files:**
- Create: `src/app/configure/[model]/page.tsx`

This is the current `src/app/page.tsx` content with: header removed, footer removed, `glbPath` sourced from `MODELS`, and params read via the `use()` hook.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p src/app/configure/\[model\]
```

- [ ] **Step 2: Write the file**

```tsx
// src/app/configure/[model]/page.tsx
'use client'

import { Suspense, use } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { useConfiguratorStore } from '@/stores/configurator-store'
import ConfigSidebar from '@/components/configurator/ConfigSidebar'
import { MODELS } from '@/models'

const ConfiguratorScene = dynamic(
  () => import('@/components/configurator/Scene'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#bcc7de', borderTopColor: 'transparent' }}
          />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: '#909097' }}>
            Loading 3D Scene
          </span>
        </div>
      </div>
    ),
  }
)

function LoadingScreen() {
  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#0c0e12' }}>
      <div className="flex flex-col items-center gap-6">
        <span
          className="text-2xl font-bold tracking-[0.3em] uppercase"
          style={{ fontFamily: "'Noto Serif', serif", color: '#e2e2e8' }}
        >
          ATELIER MARITIME
        </span>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#bcc7de', borderTopColor: 'transparent' }}
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
  const lightingMode = useConfiguratorStore(s => s.lightingMode)

  if (!modelConfig?.glbPath) notFound()

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: '#0c0e12' }}
    >
      <main className="flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        <section className="flex-1 relative">
          {/* Bottom gradient overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(12,14,18,0.6) 100%)',
            }}
          />

          {/* 3D Canvas */}
          <Suspense fallback={<LoadingScreen />}>
            <ConfiguratorScene glbPath={modelConfig.glbPath!} />
          </Suspense>

          {/* Interaction hints */}
          <div className="absolute bottom-8 left-8 z-20 flex flex-col gap-2 opacity-40">
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

          {/* Lighting mode indicator */}
          <div className="absolute top-6 right-6 z-20">
            <span
              className="text-[9px] uppercase tracking-[0.5em] opacity-30"
              style={{ color: '#c6c6cd', fontFamily: "'Manrope', sans-serif" }}
            >
              {lightingMode === 'studio' ? 'Studio Lighting' : 'Daylight'}
            </span>
          </div>
        </section>

        {/* Configuration sidebar */}
        <ConfigSidebar />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify the configurator route loads**

Start dev server (`bun run dev`) and open http://localhost:3000/configure/c111 — the 3D scene should load exactly as it did at `/` before.

- [ ] **Step 4: Commit**

```bash
git add src/app/configure/
git commit -m "feat: add /configure/[model] route — configurator without header/footer"
```

---

## Task 5: Replace `src/app/page.tsx` with the product selection homepage

**Files:**
- Replace: `src/app/page.tsx`

- [ ] **Step 1: Write the new homepage**

```tsx
// src/app/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MODELS, type ModelConfig } from '@/models'

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
        background: '#14161c',
        border: `1px solid ${isReady ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)'}`,
        cursor: isReady ? 'pointer' : 'default',
        opacity: isReady ? 1 : 0.45,
      }}
    >
      {/* Image area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1a1f2e 0%, #0d1118 100%)', minHeight: 0 }}
      >
        {/* Placeholder silhouette — swap src for a real <img> when product photos are ready */}
        <div style={{ opacity: 0.15 }}>
          <svg width="56" height="80" viewBox="0 0 56 80" fill="none">
            <rect x="10" y="6" width="36" height="14" rx="2" fill="#bcc7de"/>
            <rect x="22" y="20" width="12" height="38" rx="1" fill="#8899aa"/>
            <ellipse cx="28" cy="62" rx="20" ry="5" fill="#5a6a7a"/>
            <rect x="8" y="66" width="40" height="6" rx="1" fill="#445566"/>
          </svg>
        </div>

        {/* Coming Soon overlay */}
        {!isReady && showCS && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: 'rgba(12,14,18,0.82)' }}
          >
            <div style={{ width: 24, height: 1, background: 'rgba(188,199,222,0.3)' }} />
            <span
              style={{
                fontSize: '0.55rem',
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: '#bcc7de',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Coming Soon
            </span>
            <div style={{ width: 24, height: 1, background: 'rgba(188,199,222,0.3)' }} />
          </div>
        )}

        {/* Hover glow for active cards */}
        {isReady && (
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 40%, rgba(188,199,222,0.06) 0%, transparent 70%)',
            }}
          />
        )}
      </div>

      {/* Card footer strip */}
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span
          className="text-sm font-light tracking-[0.08em]"
          style={{ fontFamily: "'Noto Serif', serif", color: '#c6c6cd' }}
        >
          {model.name}
        </span>
        {isReady && (
          <span
            className="text-[0.6rem] tracking-[0.1em] transition-opacity duration-300"
            style={{ color: 'rgba(188,199,222,0.5)', fontFamily: "'Manrope', sans-serif" }}
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
      className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ backgroundColor: '#0c0e12', padding: '32px 48px' }}
    >
      {/* Brand signature */}
      <span
        className="mb-6 block"
        style={{
          fontFamily: "'Noto Serif', serif",
          fontSize: '0.6rem',
          letterSpacing: '0.55em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.18)',
          fontWeight: 300,
        }}
      >
        Atelier Maritime
      </span>

      {/* Product grid */}
      <div
        className="grid grid-cols-3 w-full"
        style={{ gap: '16px', flex: 1, maxHeight: '72vh' }}
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
          color: 'rgba(255,255,255,0.1)',
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        Select a model to begin configuration
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Verify homepage loads**

Open http://localhost:3000 — should show the dark 3-column selection screen with C111 active and C113/C114 dimmed. Hover C113/C114 → "Coming Soon" overlay appears. Click C111 → navigates to http://localhost:3000/configure/c111.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: replace homepage with dark product selection screen (C111/C113/C114)"
```

---

## Task 6: Final verification and cleanup

- [ ] **Step 1: Confirm the old `/` URL no longer shows the configurator**

http://localhost:3000 → product selection screen (not the 3D scene).

- [ ] **Step 2: Confirm the configurator still works**

http://localhost:3000/configure/c111 → 3D scene loads, upholstery swatches work, armrest toggle works, lighting toggle works.

- [ ] **Step 3: Confirm iframe framing headers are present**

Open DevTools → Network → click the `c111` document → Response Headers. Confirm: `content-security-policy: frame-ancestors *`.

- [ ] **Step 4: Confirm unknown model returns 404**

http://localhost:3000/configure/xyz → Next.js 404 page (not a crash).

- [ ] **Step 5: Final commit if any loose files remain**

```bash
git status
# If anything unstaged:
git add -p
git commit -m "chore: final cleanup for homepage + configurator routing"
```

- [ ] **Step 6: Update ARCHITECTURE.md**

In `ARCHITECTURE.md`, update the "Espansione futura: Model Selection Screen" section — this is no longer future work. Replace that section with:

```markdown
## Routing

```
app/
├── page.tsx                         # Product selection homepage
└── configure/
    └── [model]/
        └── page.tsx                 # 3D configurator for a given model
```

Models are defined in `src/models/index.ts` as `MODELS: ModelConfig[]`.
Each model with `glbPath: null` is shown as "Coming Soon" on the homepage.
```

```bash
git add ARCHITECTURE.md
git commit -m "docs: update architecture to reflect completed model selection routing"
```
