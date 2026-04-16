'use client'

import { Suspense, use, useState } from 'react'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { useConfiguratorStore } from '@/stores/configurator-store'
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

  if (!modelConfig?.glbPath) notFound()

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ backgroundColor: THEME.bgPage }}
    >
      <main className="flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        <section
          className={`flex-1 relative canvas-section${sheetExpanded ? ' sheet-open' : ''}`}
          onPointerDown={() => setInteracting(true)}
          onPointerUp={() => setInteracting(false)}
          onPointerCancel={() => setInteracting(false)}
        >
          {/* 3D Canvas */}
          <Suspense fallback={<LoadingScreen />}>
            <ConfiguratorScene glbPath={modelConfig.glbPath!} modelId={modelId} />
          </Suspense>

          {/* Logo overlay — top left, clicks back to homepage */}
          <a href="/" className="absolute top-3 left-3 z-20" style={{ display: 'block', cursor: 'pointer' }}>
            <img src="/logo.png" alt="IAM" style={{ height: 108, width: 'auto', display: 'block' }} />
          </a>

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
