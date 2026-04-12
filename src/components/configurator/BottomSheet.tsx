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
