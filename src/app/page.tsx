'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useConfiguratorStore } from '@/stores/configurator-store'
import ConfigSidebar from '@/components/configurator/ConfigSidebar'

// Dynamic import for the 3D scene to avoid SSR issues
const ConfiguratorScene = dynamic(
  () => import('@/components/configurator/Scene'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#bcc7de', borderTopColor: 'transparent' }} />
          <span className="text-xs uppercase tracking-[0.3em]" style={{ color: '#909097' }}>Loading 3D Scene</span>
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
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#bcc7de', borderTopColor: 'transparent' }} />
      </div>
    </div>
  )
}

export default function Home() {
  const lightingMode = useConfiguratorStore(s => s.lightingMode)

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ backgroundColor: '#0c0e12' }}>
      {/* Top Bar */}
      <header
        className="fixed top-0 w-full z-50 flex justify-between items-center px-6 lg:px-12 py-6"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
        }}
      >
        <div className="flex items-center gap-4 lg:gap-8">
          <span
            className="text-xl lg:text-2xl font-bold tracking-[0.3em] uppercase"
            style={{ fontFamily: "'Noto Serif', serif", color: '#fff' }}
          >
            ATELIER MARITIME
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        <section className="flex-1 relative">
          {/* Subtle gradient overlay at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(12,14,18,0.6) 100%)',
            }}
          />

          {/* 3D Canvas */}
          <Suspense fallback={<LoadingScreen />}>
            <ConfiguratorScene />
          </Suspense>

          {/* Interaction Hints */}
          <div
            className="absolute bottom-8 left-8 z-20 flex flex-col gap-2 opacity-40"
          >
            <div className="flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c6c6cd" strokeWidth="1.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#c6c6cd', fontFamily: "'Manrope', sans-serif" }}>
                Orbit &amp; Pan
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c6c6cd" strokeWidth="1.5">
                <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                <path d="M2 2l7.586 7.586" />
              </svg>
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#c6c6cd', fontFamily: "'Manrope', sans-serif" }}>
                Click Stool to Swivel
              </span>
            </div>
          </div>

          {/* Lighting mode indicator */}
          <div className="absolute top-20 right-6 z-20">
            <span className="text-[9px] uppercase tracking-[0.5em] opacity-30" style={{ color: '#c6c6cd', fontFamily: "'Manrope', sans-serif" }}>
              {lightingMode === 'studio' ? 'Studio Lighting' : 'Daylight'}
            </span>
          </div>
        </section>

        {/* Sidebar */}
        <ConfigSidebar />
      </main>

      {/* Footer */}
      <footer
        className="px-6 lg:px-12 py-4 z-40 flex justify-between items-center pointer-events-none max-lg:hidden"
        style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center gap-6 opacity-40">
          <span className="text-[10px] uppercase tracking-[0.5em]" style={{ fontFamily: "'Manrope', sans-serif", color: '#c6c6cd' }}>
            limago studio
          </span>
          <div className="w-16 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <span className="text-[10px] uppercase tracking-[0.5em]" style={{ fontFamily: "'Manrope', sans-serif", color: '#c6c6cd' }}>
            Serial No. AM-2024-HZN
          </span>
        </div>
        <div className="flex gap-8 opacity-40">
          <a className="text-[9px] uppercase tracking-[0.3em] hover:opacity-100 transition-opacity" style={{ color: '#c6c6cd' }} href="#">Technical Specs</a>
          <a className="text-[9px] uppercase tracking-[0.3em] hover:opacity-100 transition-opacity" style={{ color: '#c6c6cd' }} href="#">Care Guide</a>
          <a className="text-[9px] uppercase tracking-[0.3em] hover:opacity-100 transition-opacity" style={{ color: '#c6c6cd' }} href="#">Contact Artisan</a>
        </div>
      </footer>
    </div>
  )
}
