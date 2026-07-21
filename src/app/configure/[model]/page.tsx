'use client'

import React, { Suspense, use, useState, useEffect, useRef, useMemo, useSyncExternalStore } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { useConfiguratorStore, UPHOLSTERY_MATERIALS } from '@/stores/configurator-store'
import { getUsdzExporter } from '@/lib/usdz-export-ref'
import { getGlbExporter } from '@/lib/glb-export-ref'
import { sceneViewerIntentUrl } from '@/lib/ar-launch'
import ConfigSidebar from '@/components/configurator/ConfigSidebar'
import BottomSheet from '@/components/configurator/BottomSheet'
import { MODELS } from '@/models'
import { THEME } from '@/lib/theme'

const ConfiguratorScene = dynamic(
  () => import('@/components/configurator/Scene'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#728473', borderTopColor: 'transparent' }}
          />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: '#728473' }}>
            Caricamento scena 3D
          </span>
        </div>
      </div>
    ),
  }
)

function LoadingScreen() {
  return (
    <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="flex flex-col items-center gap-6">
        <span
          className="text-2xl font-bold tracking-[0.3em] uppercase"
          style={{ fontFamily: "'Source Sans 3', sans-serif", color: '#2e3d2f' }}
        >
          IAM
        </span>
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#728473', borderTopColor: 'transparent' }}
        />
      </div>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function DevExportPanel({ modelId, upholsteryId }: { modelId: string; upholsteryId: string }) {
  const [status, setStatus] = useState<string | null>(null)

  const slug = `${modelId}-${upholsteryId}`

  // Batch export: loop every material, export GLB+USDZ of the live configured
  // scene, POST each to /api/dev-export which writes public/models/{glb|usdz}/.
  // Auto-runs when the page is opened with ?batchexport (used to generate the
  // static AR variants). document.title doubles as a poll-able progress signal.
  const batchRunning = useRef(false)
  const runBatch = async () => {
    if (batchRunning.current) return
    batchRunning.current = true
    const setUpholstery = useConfiguratorStore.getState().setUpholstery
    const settle = () =>
      new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 250))))
    try {
      for (const [i, mat] of UPHOLSTERY_MATERIALS.entries()) {
        const name = `${modelId}-${mat.id}`
        document.title = `BATCH ${i + 1}/${UPHOLSTERY_MATERIALS.length} ${name}`
        setStatus(`Batch ${i + 1}/${UPHOLSTERY_MATERIALS.length}: ${name}`)
        setUpholstery(mat.id)
        await settle()
        for (const [kind, fn] of [['glb', getGlbExporter()], ['usdz', getUsdzExporter()]] as const) {
          if (!fn) throw new Error('exporter not ready')
          const blob = await fn()
          const res = await fetch(`/api/dev-export?name=${name}.${kind}`, { method: 'POST', body: blob })
          if (!res.ok) throw new Error(`save ${name}.${kind} failed (${res.status})`)
        }
      }
      document.title = `BATCH DONE ${modelId}`
      setStatus('Batch done')
    } catch (e) {
      document.title = `BATCH ERROR ${modelId}`
      setStatus(`Batch error: ${e}`)
    } finally {
      batchRunning.current = false
    }
  }

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('batchexport')) return
    // Wait for the exporters (registered once the GLB is loaded), then run.
    const t = setInterval(() => {
      if (getGlbExporter() && getUsdzExporter()) {
        clearInterval(t)
        runBatch()
      }
    }, 500)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const exportGlb = async () => {
    const fn = getGlbExporter()
    if (!fn) { setStatus('Scene not ready'); return }
    setStatus('Exporting GLB…')
    try {
      const blob = await fn()
      downloadBlob(blob, `${slug}.glb`)
      setStatus(`Saved: ${slug}.glb`)
    } catch (e) {
      setStatus(`GLB error: ${e}`)
    }
  }

  const exportUsdz = async () => {
    const fn = getUsdzExporter()
    if (!fn) { setStatus('Scene not ready'); return }
    setStatus('Exporting USDZ…')
    try {
      const blob = await fn()
      downloadBlob(blob, `${slug}.usdz`)
      setStatus(`Saved: ${slug}.usdz`)
    } catch (e) {
      setStatus(`USDZ error: ${e}`)
    }
  }

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, zIndex: 9999,
      backgroundColor: 'rgba(0,0,0,0.85)', color: '#fff',
      padding: '10px 14px', borderRadius: 8, fontFamily: 'monospace', fontSize: 12,
      display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220,
    }}>
      <div style={{ opacity: 0.5, marginBottom: 2 }}>DEV EXPORT</div>
      <div>{slug}</div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={exportGlb} style={btnStyle}>GLB</button>
        <button onClick={exportUsdz} style={btnStyle}>USDZ</button>
        <button onClick={runBatch} style={btnStyle}>ALL</button>
      </div>
      {status && <div style={{ opacity: 0.7, fontSize: 11 }}>{status}</div>}
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  flex: 1, padding: '4px 0', backgroundColor: '#728473', color: '#fff',
  border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12,
}

export default function ConfiguratorPage({
  params,
}: {
  params: Promise<{ model: string }>
}) {
  const { model: modelId } = use(params)
  const modelConfig = MODELS.find(m => m.id === modelId)
  const setInteracting = useConfiguratorStore(s => s.setInteracting)
  const [sheetExpanded, setSheetExpanded] = useState(true)
  const upholsteryId = useConfiguratorStore(s => s.upholsteryId)

  // AR link to a pre-exported static variant (public/models/{glb,usdz}/
  // <model>-<material>.<ext> — generated offline via DevExportPanel's batch
  // export, see /api/dev-export). No runtime export/upload, so the href is
  // known immediately and a single tap launches the viewer — this also
  // sidesteps Vercel's ~4.5MB request body cap, which the old runtime-export
  // + upload approach silently exceeded.
  // navigator/location are only available post-mount, so the link is derived
  // from a client/server snapshot flag rather than computed during SSR
  // (avoids a hydration mismatch on the anchor's href/target/rel).
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const ar = useMemo(() => {
    if (!mounted) return null
    const isAndroid = /android/i.test(navigator.userAgent)
    const slug = `${modelId}-${upholsteryId}`
    if (isAndroid) {
      const glbUrl = new URL(`/models/glb/${slug}.glb`, window.location.origin).toString()
      return { href: sceneViewerIntentUrl(glbUrl, modelConfig?.name ?? '', window.location.href), android: true }
    }
    return { href: `/models/usdz/${slug}.usdz`, android: false }
  }, [mounted, modelId, upholsteryId, modelConfig])

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
          {/* 3D Canvas */}
          <Suspense fallback={<LoadingScreen />}>
            <ConfiguratorScene glbPath={modelConfig.glbPath!} modelId={modelId} />
          </Suspense>

          {/* Interaction hints — desktop only */}
          <div className="absolute bottom-8 left-8 z-20 hidden lg:flex flex-col gap-2 opacity-40">
            <div className="flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#728473" strokeWidth="1.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: '#728473', fontFamily: "'Source Sans 3', sans-serif" }}
              >
                Orbita e panoramica
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#728473" strokeWidth="1.5">
                <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                <path d="M2 2l7.586 7.586" />
              </svg>
              <span
                className="text-[10px] uppercase tracking-[0.2em]"
                style={{ color: '#728473', fontFamily: "'Source Sans 3', sans-serif" }}
              >
                Clicca per ruotare
              </span>
            </div>
          </div>

          {/* Product name overlay — mobile only */}
          <div className="absolute top-3 right-4 z-20 lg:hidden">
            <span
              style={{
                fontFamily: "'Source Sans 3', sans-serif",
                fontSize: '1.25rem',
                color: '#2e3d2f',
                letterSpacing: '0.02em',
              }}
            >
              {modelConfig?.name ?? modelId.toUpperCase()}
            </span>
          </div>

          {/* AR button — mobile only, bottom-right. Links straight to a
              pre-exported static variant, so one tap launches the viewer.
              Android: target="_blank" gives the intent:// URL a top-level
              navigation — Chrome refuses intent navigations inside iframes
              (this app runs embedded in a WordPress iframe). iOS: rel="ar"
              needs an <img> as first child or Safari won't treat the anchor
              as a Quick Look launcher. */}
          <a
            href={ar?.href ?? '#'}
            {...(ar?.android ? { target: '_blank', rel: 'noopener' } : { rel: 'ar' })}
            onClick={(e) => { if (!ar) e.preventDefault() }}
            className="lg:hidden absolute bottom-4 right-4 z-20 flex flex-col items-center justify-center gap-1 rounded-lg"
            style={{
              width: 52,
              height: 52,
              backgroundColor: THEME.accentNavy,
              color: THEME.textInverse,
              opacity: ar ? 1 : 0.4,
              textDecoration: 'none',
              transition: 'opacity 0.3s ease',
            }}
            aria-label="Visualizza in realtà aumentata"
          >
            {ar && !ar.android && (
              <img
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                alt=""
                width={1}
                height={1}
                style={{ position: 'absolute', opacity: 0 }}
              />
            )}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700 }}>
              AR
            </span>
          </a>
        </section>

        {/* Desktop sidebar — has max-lg:hidden built in */}
        <ConfigSidebar />
      </main>

      {/* Dev export panel — only in development */}
      {process.env.NODE_ENV === 'development' && (
        <DevExportPanel modelId={modelId} upholsteryId={upholsteryId} />
      )}

      {/* Mobile bottom sheet — hidden on desktop */}
      <BottomSheet
        modelId={modelId}
        expanded={sheetExpanded}
        onToggle={() => setSheetExpanded(e => !e)}
        onCollapse={() => setSheetExpanded(false)}
      />
    </div>
  )
}
