'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  useConfiguratorStore,
  UPHOLSTERY_MATERIALS,
  type MaterialOption,
} from '@/stores/configurator-store'
import { generatePdf } from '@/lib/generate-pdf'
import { THEME } from '@/lib/theme'
import { MODELS } from '@/models'

function MaterialSwatch({
  material,
  isSelected,
  onClick,
}: {
  material: MaterialOption
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-full border-2 transition-all duration-300 hover:scale-105"
      style={{
        borderColor: isSelected ? THEME.accentNavy : THEME.borderSageMid,
        backgroundColor: material.texturePath ? undefined : material.color,
        backgroundImage: material.texturePath ? `url(${material.texturePath})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: isSelected ? `0 0 0 4px ${THEME.accentSelectedOnSage}` : 'none',
      }}
      title={material.name}
    />
  )
}

function SubCategoryLabel({ label }: { label: string }) {
  return (
    <div
      className="text-[10px] uppercase tracking-[0.2em] font-medium"
      style={{ color: THEME.textOnSageMuted }}
    >
      {label}
    </div>
  )
}

export default function ConfigSidebar() {
  const { upholsteryId, setUpholstery } = useConfiguratorStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const params = useParams()
  const modelId = (params?.model as string) ?? 'c111'
  const modelConfig = MODELS.find(m => m.id === modelId)
  const modelName = modelConfig?.name ?? modelId.toUpperCase()

  const handleSavePdf = async () => {
    setIsGenerating(true)
    try {
      await generatePdf(modelId, upholsteryId)
    } finally {
      setIsGenerating(false)
    }
  }

  const currentUpholstery = UPHOLSTERY_MATERIALS.find(m => m.id === upholsteryId)
  const fabrics = UPHOLSTERY_MATERIALS.filter(m => m.category === 'fabric')
  const leathers = UPHOLSTERY_MATERIALS.filter(m => m.category === 'leather')

  return (
    <aside
      className="w-[420px] max-lg:hidden flex flex-col relative z-30 shadow-2xl overflow-hidden"
      style={{
        backgroundColor: THEME.bgSidebar,
        borderLeft: `1px solid ${THEME.borderSageSubtle}`,
      }}
    >
      {/* Product Header */}
      <div className="p-8 pb-6">
        <h1
          className="text-4xl lg:text-5xl leading-tight"
          style={{ fontFamily: "'Noto Serif', serif", color: THEME.textOnSage }}
        >
          {modelName}
        </h1>
        <p
          className="text-sm mt-5 leading-relaxed font-light max-w-sm"
          style={{ color: THEME.textOnSage, fontFamily: "'Manrope', sans-serif" }}
        >
          {modelConfig?.description ?? ''}
        </p>
      </div>

      {/* Scrollable Configuration Area */}
      <div className="flex-grow overflow-y-auto px-8 space-y-10 pb-8 config-sidebar">

        {/* ── Seat & Backrest Material ── */}
        <section>
          <div className="flex justify-between items-end mb-5">
            <h3
              className="text-[11px] uppercase tracking-[0.2em] font-bold"
              style={{ color: THEME.textOnSageMuted }}
            >
              Seduta e schienale
            </h3>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: THEME.textOnSage }}
            >
              {currentUpholstery?.name}
            </span>
          </div>

          <div className="mb-5">
            <SubCategoryLabel label="Tessuti" />
            <div className="grid grid-cols-5 gap-3 mt-3">
              {fabrics.map(mat => (
                <MaterialSwatch
                  key={mat.id}
                  material={mat}
                  isSelected={upholsteryId === mat.id}
                  onClick={() => setUpholstery(mat.id)}
                />
              ))}
            </div>
          </div>

          <div>
            <SubCategoryLabel label="Pelli" />
            <div className="grid grid-cols-5 gap-3 mt-3">
              {leathers.map(mat => (
                <MaterialSwatch
                  key={mat.id}
                  material={mat}
                  isSelected={upholsteryId === mat.id}
                  onClick={() => setUpholstery(mat.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── Structure Finish (display only) ── */}
        <section>
          <h3
            className="text-[11px] uppercase tracking-[0.2em] font-bold mb-5"
            style={{ color: THEME.textOnSageMuted }}
          >
            Finitura struttura
          </h3>
          <div className="space-y-3">
            <div
              className="flex items-center justify-between p-4"
              style={{
                border: `1px solid ${THEME.borderSageMid}`,
                backgroundColor: THEME.bgInput,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME.accentNavy }} />
                <span
                  className="text-xs uppercase tracking-widest font-medium"
                  style={{ color: THEME.textOnSage }}
                >
                  Acciaio inox 316L
                </span>
              </div>
              <span className="text-[10px]" style={{ color: THEME.textOnSageMuted }}>Incluso</span>
            </div>
          </div>
        </section>

      </div>

      {/* Fixed Bottom Action Area */}
      <div
        className="p-8 pt-6"
        style={{
          borderTop: `1px solid ${THEME.borderSageSubtle}`,
          backgroundColor: THEME.bgSidebar,
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Save PDF */}
          <button
            onClick={handleSavePdf}
            disabled={isGenerating}
            className="py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] font-bold transition-all duration-300"
            style={{
              backgroundColor: isGenerating ? THEME.borderStrong : THEME.accentNavy,
              color: THEME.textInverse,
              cursor: isGenerating ? 'wait' : 'pointer',
            }}
          >
            {isGenerating ? (
              <span>Generazione…</span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <polyline points="9 14 12 17 15 14" />
                </svg>
                Salva PDF
              </>
            )}
          </button>

          {/* Contact */}
          <button
            className="py-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] font-medium transition-all duration-300"
            style={{
              border: `1px solid ${THEME.borderSageMid}`,
              color: THEME.textOnSage,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = THEME.bgInput)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Contatto
          </button>
        </div>
      </div>
    </aside>
  )
}
