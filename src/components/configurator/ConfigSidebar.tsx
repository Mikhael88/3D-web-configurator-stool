'use client'

import {
  useConfiguratorStore,
  UPHOLSTERY_MATERIALS,
  type MaterialOption,
  type MaterialCategory,
  type LightingMode,
} from '@/stores/configurator-store'

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
        borderColor: isSelected ? '#bcc7de' : 'rgba(255,255,255,0.1)',
        backgroundColor: material.color,
        boxShadow: isSelected ? '0 0 0 4px rgba(188,199,222,0.2)' : 'none',
      }}
      title={material.name}
    />
  )
}

function SubCategoryLabel({ label }: { label: string }) {
  return (
    <div
      className="text-[10px] uppercase tracking-[0.2em] font-medium"
      style={{ color: 'rgba(188,199,222,0.5)' }}
    >
      {label}
    </div>
  )
}

function LightingButton({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string
  icon: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between p-4 border cursor-pointer group transition-all duration-300"
      style={{
        borderColor: isActive ? 'rgba(188,199,222,0.4)' : 'rgba(255,255,255,0.1)',
        backgroundColor: isActive ? 'rgba(188,199,222,0.05)' : 'transparent',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: isActive ? '#bcc7de' : '#45464d' }}
        />
        <span
          className="text-xs uppercase tracking-widest font-medium transition-colors duration-300"
          style={{ color: isActive ? '#e2e2e8' : '#c6c6cd' }}
        >
          {label}
        </span>
      </div>
      <span className="text-[10px]" style={{ color: '#909097' }}>{icon}</span>
    </button>
  )
}

export default function ConfigSidebar() {
  const {
    upholsteryId,
    showArmrests,
    lightingMode,
    setUpholstery,
    toggleArmrests,
    setLighting,
  } = useConfiguratorStore()

  const currentUpholstery = UPHOLSTERY_MATERIALS.find(m => m.id === upholsteryId)

  const fabrics = UPHOLSTERY_MATERIALS.filter(m => m.category === 'fabric')
  const leathers = UPHOLSTERY_MATERIALS.filter(m => m.category === 'leather')

  return (
    <aside
      className="w-[420px] max-lg:w-full max-lg:h-auto max-lg:border-l-0 max-lg:border-t flex flex-col relative z-30 shadow-2xl overflow-hidden"
      style={{
        backgroundColor: '#1a1c20',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Product Header */}
      <div className="p-8 pb-6 max-lg:p-6 max-lg:pb-4">
        <span
          className="text-[11px] uppercase tracking-[0.4em] font-bold"
          style={{ color: '#e2c19d' }}
        >
          The Maritime Series
        </span>
        <h1
          className="text-4xl lg:text-5xl mt-3 leading-tight"
          style={{ fontFamily: "'Noto Serif', serif", color: '#e2e2e8' }}
        >
          Horizon Stool
        </h1>
        <p
          className="text-sm mt-5 leading-relaxed font-light max-w-sm"
          style={{ color: '#c6c6cd', fontFamily: "'Manrope', sans-serif" }}
        >
          A masterpiece of nautical engineering. Crafted with high-grade marine alloys
          and weather-resistant textiles designed to withstand the harshest ocean environments.
        </p>
      </div>

      {/* Scrollable Configuration Area */}
      <div className="flex-grow overflow-y-auto px-8 space-y-10 pb-8 config-sidebar max-lg:max-h-[50vh]">
        {/* ── Seat & Backrest Material ── */}
        <section>
          <div className="flex justify-between items-end mb-5">
            <h3
              className="text-[11px] uppercase tracking-[0.2em] font-bold"
              style={{ color: '#909097' }}
            >
              Seat &amp; Backrest
            </h3>
            <span
              className="text-[10px] uppercase tracking-widest"
              style={{ color: 'rgba(188,199,222,0.8)' }}
            >
              {currentUpholstery?.name}
            </span>
          </div>

          <div className="mb-5">
            <SubCategoryLabel label="Fabrics" />
            <div className="grid grid-cols-4 gap-3 mt-3">
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
            <SubCategoryLabel label="Leathers" />
            <div className="grid grid-cols-4 gap-3 mt-3">
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
            style={{ color: '#909097' }}
          >
            Structure Finish
          </h3>
          <div className="space-y-3">
            <div
              className="flex items-center justify-between p-4"
              style={{
                border: '1px solid rgba(188,199,222,0.4)',
                backgroundColor: 'rgba(188,199,222,0.05)',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#bcc7de' }} />
                <span className="text-xs uppercase tracking-widest font-medium">Brushed Steel 316</span>
              </div>
              <span className="text-[10px]" style={{ color: '#909097' }}>Included</span>
            </div>
          </div>
        </section>

        {/* ── Lighting ── */}
        <section>
          <h3
            className="text-[11px] uppercase tracking-[0.2em] font-bold mb-5"
            style={{ color: '#909097' }}
          >
            Lighting
          </h3>
          <div className="space-y-3">
            <LightingButton
              label="Dark Studio"
              icon="◉"
              isActive={lightingMode === 'studio'}
              onClick={() => setLighting('studio')}
            />
            <LightingButton
              label="Daylight"
              icon="☀"
              isActive={lightingMode === 'daylight'}
              onClick={() => setLighting('daylight')}
            />
          </div>
        </section>

        {/* ── Configuration Options ── */}
        <section>
          <h3
            className="text-[11px] uppercase tracking-[0.2em] font-bold mb-5"
            style={{ color: '#909097' }}
          >
            Configuration Options
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest font-medium">Integrated Armrests</div>
                <div className="text-[10px] mt-1 font-light italic" style={{ color: '#909097' }}>
                  Ergonomic side support
                </div>
              </div>
              <button
                onClick={toggleArmrests}
                className="w-10 h-5 rounded-full relative transition-colors duration-300"
                style={{
                  backgroundColor: showArmrests ? '#bcc7de' : 'rgba(255,255,255,0.1)',
                }}
              >
                <div
                  className="absolute top-1 w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: showArmrests ? '#263143' : '#6b7280',
                    left: showArmrests ? '1.25rem' : '0.25rem',
                  }}
                />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Fixed Bottom Action Area */}
      <div
        className="p-8 pt-6"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(26,28,32,0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex justify-between items-baseline mb-6">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: '#909097' }}>
            Estimated Price
          </span>
          <span
            className="text-3xl font-light"
            style={{ color: '#e2e2e8', fontFamily: "'Manrope', sans-serif" }}
          >
            $4,290.00
          </span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <button
            className="col-span-4 py-4 text-xs uppercase tracking-[0.3em] font-bold transition-all duration-300 shadow-xl hover:shadow-2xl"
            style={{ backgroundColor: '#bcc7de', color: '#263143' }}
          >
            Finalize Order
          </button>
          <button
            className="flex items-center justify-center transition-all duration-300 hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: '#c6c6cd' }}>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
