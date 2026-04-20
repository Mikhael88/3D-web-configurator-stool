'use client'

import { Suspense, use, useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { useConfiguratorStore } from '@/stores/configurator-store'
import { getUsdzExporter } from '@/lib/usdz-export-ref'
import ConfigSidebar from '@/components/configurator/ConfigSidebar'
import BottomSheet from '@/components/configurator/BottomSheet'
import { MODELS } from '@/models'
import { THEME } from '@/lib/theme'
import { xrStore } from '@/stores/ar-store'

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

export default function ConfiguratorPage({
  params,
}: {
  params: Promise<{ model: string }>
}) {
  const { model: modelId } = use(params)
  const modelConfig = MODELS.find(m => m.id === modelId)
  const setInteracting = useConfiguratorStore(s => s.setInteracting)
  const [sheetExpanded, setSheetExpanded] = useState(true)
  const [arLoading, setArLoading] = useState(false)
  const [iosArUrl, setIosArUrl] = useState<string | null>(null)
  const upholsteryId = useConfiguratorStore(s => s.upholsteryId)
  const exportCancelRef = useRef(false)

  // Reset iOS AR URL whenever material changes — next tap re-exports with new material.
  useEffect(() => {
    exportCancelRef.current = true
    setIosArUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [upholsteryId])

  // Revoke blob URL on unmount to avoid memory leaks.
  useEffect(() => {
    return () => {
      setIosArUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  if (!modelConfig?.glbPath) notFound()

  const handleAR = async () => {
    const isAndroid = /android/i.test(navigator.userAgent)

    if (isAndroid) {
      if (navigator.xr) {
        navigator.xr.isSessionSupported('immersive-ar').then(supported => {
          if (supported) {
            xrStore.enterAR().catch(err => console.error('[AR] enterAR failed:', err))
          } else {
            alert('AR non supportato su questo dispositivo.')
          }
        }).catch(err => console.error('[AR] isSessionSupported failed:', err))
      } else {
        alert('AR non supportato su questo browser.')
      }
      return
    }

    // iOS: export USDZ with configured material, then show AR Quick Look link.
    // Two-step (export → user taps link) is required because iOS Safari blocks
    // programmatic <a>.click() after async/await.
    const exportFn = getUsdzExporter()
    if (!exportFn) {
      alert('Scena 3D non ancora pronta. Riprova tra un momento.')
      return
    }

    exportCancelRef.current = false
    setArLoading(true)
    try {
      const blob = await exportFn()
      if (exportCancelRef.current) return // material changed mid-export, discard
      const url = URL.createObjectURL(blob)
      setIosArUrl(url)
    } catch (err) {
      if (!exportCancelRef.current) {
        console.error('[AR] USDZ export failed:', err)
        alert('Errore nella preparazione dell\'AR.')
      }
    } finally {
      setArLoading(false)
    }
  }

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

          {/* AR button — mobile only, bottom-right */}
          <button
            onClick={handleAR}
            disabled={arLoading}
            className="lg:hidden absolute bottom-4 right-4 z-20 flex flex-col items-center justify-center gap-1 rounded-lg"
            style={{
              width: 52,
              height: 52,
              backgroundColor: THEME.accentNavy,
              color: THEME.textInverse,
              opacity: arLoading ? 0.6 : 1,
            }}
            aria-label="Visualizza in realtà aumentata"
          >
            {arLoading ? (
              <div
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: THEME.textInverse, borderTopColor: 'transparent' }}
              />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700 }}>
                  AR
                </span>
              </>
            )}
          </button>

          {/* iOS AR Quick Look overlay — shown after USDZ export completes */}
          {iosArUrl && (
            <div
              className="lg:hidden absolute inset-0 z-30 flex items-end justify-center pb-8"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
              onClick={() => setIosArUrl(prev => {
                if (prev) URL.revokeObjectURL(prev)
                return null
              })}
            >
              <a
                href={iosArUrl}
                rel="ar"
                onClick={(e) => e.stopPropagation()}
                className="flex flex-col items-center justify-center gap-2 rounded-xl px-8 py-4"
                style={{
                  backgroundColor: THEME.accentNavy,
                  color: THEME.textInverse,
                  textDecoration: 'none',
                  fontFamily: "'Source Sans 3', sans-serif",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>
                  Apri in AR
                </span>
                <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                  Tocca per aprire AR Quick Look
                </span>
              </a>
            </div>
          )}
        </section>

        {/* Desktop sidebar — has max-lg:hidden built in */}
        <ConfigSidebar />
      </main>

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
