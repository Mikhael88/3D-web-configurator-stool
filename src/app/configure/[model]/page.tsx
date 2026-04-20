'use client'

import { Suspense, use, useState, useEffect } from 'react'
import Script from 'next/script'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { useConfiguratorStore } from '@/stores/configurator-store'
import type { ModelViewerElement } from '@/types/model-viewer'
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

export default function ConfiguratorPage({
  params,
}: {
  params: Promise<{ model: string }>
}) {
  const { model: modelId } = use(params)
  const modelConfig = MODELS.find(m => m.id === modelId)
  const setInteracting = useConfiguratorStore(s => s.setInteracting)
  const [sheetExpanded, setSheetExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [arReady, setArReady] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      setArReady(false)
      return
    }
    customElements.whenDefined('model-viewer').then(() => setArReady(true))
  }, [isMobile])

  if (!modelConfig?.glbPath) notFound()

  const handleAR = () => {
    const mv = document.getElementById('ar-host') as (ModelViewerElement | null)
    mv?.activateAR?.()
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
          {isMobile && (
            <>
              <Script
                src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"
                strategy="lazyOnload"
              />
              <model-viewer
                id="ar-host"
                src={modelConfig.glbPath ?? ''}
                alt={`${modelConfig.name} modello 3D`}
                ar
                ar-modes="scene-viewer quick-look webxr"
                style={{
                  position: 'absolute',
                  width: 1,
                  height: 1,
                  opacity: 0,
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

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
            disabled={!arReady}
            className="lg:hidden absolute bottom-4 right-4 z-20 flex flex-col items-center justify-center gap-1 rounded-lg"
            style={{
              width: 52,
              height: 52,
              backgroundColor: THEME.accentNavy,
              color: THEME.textInverse,
            }}
            aria-label="Visualizza in realtà aumentata"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span style={{ fontSize: '0.5rem', letterSpacing: '0.15em', fontFamily: "'Source Sans 3', sans-serif", fontWeight: 700 }}>
              AR
            </span>
          </button>
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
