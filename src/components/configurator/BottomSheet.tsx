'use client'

import { useEffect, useState } from 'react'
import { useConfiguratorStore, UPHOLSTERY_MATERIALS } from '@/stores/configurator-store'
import { generatePdf } from '@/lib/generate-pdf'
import { THEME } from '@/lib/theme'
import { MODELS } from '@/models'

interface Props {
  modelId: string
  expanded: boolean
  onToggle: () => void
  onCollapse: () => void
}

export default function BottomSheet({ modelId, expanded, onToggle, onCollapse }: Props) {
  const { upholsteryId, setUpholstery, isInteracting } = useConfiguratorStore()
  const description = MODELS.find(m => m.id === modelId)?.description ?? ''
  const [activeCategory, setActiveCategory] = useState<'fabric' | 'leather' | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Auto-collapse while user drags the model
  useEffect(() => {
    if (isInteracting) onCollapse()
  }, [isInteracting, onCollapse])

  const handleSavePdf = async () => {
    setIsGenerating(true)
    try {
      await generatePdf(modelId, upholsteryId)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCategory = (cat: 'fabric' | 'leather') => {
    setActiveCategory(prev => prev === cat ? null : cat)
  }

  const fabrics = UPHOLSTERY_MATERIALS.filter(m => m.category === 'fabric')
  const leathers = UPHOLSTERY_MATERIALS.filter(m => m.category === 'leather')
  const visibleSwatches = activeCategory === 'fabric' ? fabrics : activeCategory === 'leather' ? leathers : []
  const currentUpholstery = UPHOLSTERY_MATERIALS.find(m => m.id === upholsteryId)

  return (
    <div
      className="lg:hidden flex-shrink-0 overflow-hidden flex flex-col"
      style={{
        height: expanded ? '40vh' : '100px',
        transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        background: THEME.bgSidebar,
        borderTop: `1px solid ${THEME.borderSageSubtle}`,
        boxShadow: THEME.shadowSheet,
      }}
    >
      {/* Drag handle — tap to toggle */}
      <div
        role="button"
        aria-label={expanded ? 'Comprimi pannello' : 'Espandi pannello'}
        onClick={onToggle}
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
            background: THEME.borderSageMid,
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
          gap: 12,
          paddingBottom: 24,
        }}
      >
        {/* Material section */}
        <div>
          {/* Label row with current selection */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <div
              style={{
                fontSize: '0.6rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: THEME.textOnSageMuted,
                fontFamily: "'Source Sans 3', sans-serif",
              }}
            >
              Seduta e schienale
            </div>
            {currentUpholstery && (
              <div style={{
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                color: THEME.textOnSage,
                fontFamily: "'Source Sans 3', sans-serif",
              }}>
                {currentUpholstery.name}
              </div>
            )}
          </div>

          {/* Category toggle buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => toggleCategory('fabric')}
              style={{
                flex: 1,
                padding: '10px 0',
                border: `1px solid ${activeCategory === 'fabric' ? THEME.accentNavy : THEME.borderSageMid}`,
                background: activeCategory === 'fabric' ? THEME.accentNavy : THEME.bgInput,
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: activeCategory === 'fabric' ? THEME.textInverse : THEME.textOnSage,
                cursor: 'pointer',
                fontFamily: "'Source Sans 3', sans-serif",
                transition: 'all 0.2s ease',
              }}
            >
              TESSUTO {activeCategory === 'fabric' ? '▼' : '▲'}
            </button>
            <button
              onClick={() => toggleCategory('leather')}
              style={{
                flex: 1,
                padding: '10px 0',
                border: `1px solid ${activeCategory === 'leather' ? THEME.accentNavy : THEME.borderSageMid}`,
                background: activeCategory === 'leather' ? THEME.accentNavy : THEME.bgInput,
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                fontWeight: 700,
                color: activeCategory === 'leather' ? THEME.textInverse : THEME.textOnSage,
                cursor: 'pointer',
                fontFamily: "'Source Sans 3', sans-serif",
                transition: 'all 0.2s ease',
              }}
            >
              PELLE {activeCategory === 'leather' ? '▼' : '▲'}
            </button>
          </div>

          {/* Inline swatches — slide open/closed */}
          <div
            style={{
              maxHeight: activeCategory ? '72px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.25s ease',
            }}
          >
            <div style={{
              display: 'flex',
              gap: 12,
              paddingTop: 12,
              paddingBottom: 4,
              justifyContent: 'center',
            }}>
              {visibleSwatches.map(mat => (
                <button
                  key={mat.id}
                  onClick={() => setUpholstery(mat.id)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: mat.texturePath ? undefined : mat.color,
                    backgroundImage: mat.texturePath ? `url(${mat.texturePath})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: upholsteryId === mat.id
                      ? `3px solid ${THEME.accentNavy}`
                      : `2px solid ${THEME.borderSageMid}`,
                    boxShadow: upholsteryId === mat.id
                      ? `0 0 0 3px ${THEME.accentSelectedOnSage}`
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
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            {isGenerating ? 'Generazione…' : 'SALVA PDF'}
          </button>
          <a
            href="mailto:info@iam-arredo.it"
            style={{
              flex: 1,
              padding: '12px 0',
              border: `1px solid ${THEME.borderSageMid}`,
              background: 'transparent',
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              color: THEME.textOnSage,
              cursor: 'pointer',
              fontFamily: "'Source Sans 3', sans-serif",
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            CONTATTO
          </a>
        </div>

        {/* Description */}
        <div style={{ borderTop: `1px solid ${THEME.borderSageSubtle}`, paddingTop: 14 }}>
          <div
            style={{
              fontSize: '0.55rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: THEME.textOnSageMuted,
              marginBottom: 8,
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            Descrizione
          </div>
          <p
            style={{
              fontSize: '0.75rem',
              lineHeight: 1.6,
              color: THEME.textOnSage,
              margin: 0,
              fontFamily: "'Source Sans 3', sans-serif",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
