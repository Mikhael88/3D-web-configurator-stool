'use client'

import { useEffect, useRef } from 'react'
import { UPHOLSTERY_MATERIALS, useConfiguratorStore } from '@/stores/configurator-store'
import { THEME } from '@/lib/theme'

interface Props {
  category: 'fabric' | 'leather' | null
  onClose: () => void
}

export default function MaterialTray({ category, onClose }: Props) {
  const { upholsteryId, setUpholstery } = useConfiguratorStore()
  const trayRef = useRef<HTMLDivElement>(null)

  const materials = UPHOLSTERY_MATERIALS.filter(m => m.category === category)
  const selectedMaterial = UPHOLSTERY_MATERIALS.find(m => m.id === upholsteryId)

  // Close on outside click
  useEffect(() => {
    if (!category) return
    const handler = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay to avoid the opening click triggering immediate close
    const timeout = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => {
      clearTimeout(timeout)
      document.removeEventListener('mousedown', handler)
    }
  }, [category, onClose])

  if (!category) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="lg:hidden fixed inset-0"
        style={{ zIndex: 48, background: 'transparent' }}
        onClick={onClose}
      />

      {/* Tray panel */}
      <div
        ref={trayRef}
        className="lg:hidden fixed bottom-0 left-0 right-0"
        style={{
          zIndex: 50,
          background: THEME.bgSidebar,
          borderTop: `1px solid ${THEME.borderSubtle}`,
          boxShadow: THEME.shadowTray,
          padding: '16px 24px 32px',
        }}
      >
        {/* Label row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: '0.6rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: THEME.textMuted,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {category === 'fabric' ? 'Fabric' : 'Leather'}
          </div>
          <div
            style={{
              fontSize: '0.65rem',
              color: THEME.textMuted,
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {selectedMaterial?.name ?? ''}
          </div>
        </div>

        {/* Swatch row */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          {materials.map(mat => (
            <button
              key={mat.id}
              onClick={() => { setUpholstery(mat.id); onClose() }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: mat.color,
                border: upholsteryId === mat.id
                  ? `3px solid ${THEME.accentNavy}`
                  : `2px solid ${THEME.borderMid}`,
                boxShadow: upholsteryId === mat.id
                  ? `0 0 0 3px ${THEME.accentSelected}`
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
    </>
  )
}
