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
      className="relative flex flex-col overflow-hidden transition-all duration-300 lg:flex-1"
      style={{
        background: THEME.bgCard,
        borderRight: `1px solid ${THEME.borderSubtle}`,
        borderBottom: `1px solid ${isReady ? THEME.borderSubtle : 'rgba(44,62,80,0.04)'}`,
        cursor: isReady ? 'pointer' : 'default',
        opacity: isReady ? 1 : 0.45,
      }}
    >
      {/* Image area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden"
        style={{ background: THEME.bgCardImage, minHeight: '160px' }}
      >
        {model.imagePath ? (
          <img
            src={model.imagePath}
            alt={model.name}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 15%',
            }}
          />
        ) : (
          <div style={{ opacity: 0.2 }}>
            <svg width="56" height="80" viewBox="0 0 56 80" fill="none">
              <rect x="10" y="6" width="36" height="14" rx="2" fill={THEME.accentNavy}/>
              <rect x="22" y="20" width="12" height="38" rx="1" fill={THEME.accentSlate}/>
              <ellipse cx="28" cy="62" rx="20" ry="5" fill={THEME.accentSand}/>
              <rect x="8" y="66" width="40" height="6" rx="1" fill={THEME.accentNavy}/>
            </svg>
          </div>
        )}

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
              Prossimamente
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
            Configura →
          </span>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <div
      className="w-screen flex flex-col min-h-screen lg:h-screen lg:overflow-hidden"
      style={{ backgroundColor: THEME.bgPage }}
    >
      {/* Brand signature — mobile only (desktop shows it inside the grid) */}
      <div className="flex flex-col items-center px-4 py-6 lg:hidden">
        <span
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
      </div>

      {/* Product grid — 1 col scrollable mobile, 4 col full-height desktop */}
      <div className="flex flex-col lg:flex-row lg:flex-1 lg:h-full">
        {MODELS.map(model => (
          <ProductCard key={model.id} model={model} />
        ))}
      </div>

      {/* Bottom hint — mobile only */}
      <div className="flex justify-center px-4 py-5 lg:hidden">
        <span
          style={{
            fontSize: '0.6rem',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: THEME.textMuted,
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          Seleziona un modello per iniziare la configurazione
        </span>
      </div>
    </div>
  )
}
