import { create } from 'zustand'

export type MaterialCategory = 'fabric' | 'leather'

export interface MaterialOption {
  id: string
  name: string
  category: MaterialCategory
  color: string
  colorHex: string
  roughness: number
  metalness: number
  texturePath?: string
  normalPath?: string
}

export interface ConfiguratorState {
  upholsteryId: string
  isInteracting: boolean
  setUpholstery: (id: string) => void
  setInteracting: (v: boolean) => void
}

export const UPHOLSTERY_MATERIALS: MaterialOption[] = [
  // Fabrics (5)
  { id: 'navy-fabric',     name: 'Navy Marine',   category: 'fabric',  color: '#1a2b45', colorHex: '#1a2b45', roughness: 0.30, metalness: 0.0 },
  { id: 'sand-fabric',     name: 'Sand Beige',    category: 'fabric',  color: '#c4a97d', colorHex: '#c4a97d', roughness: 0.35, metalness: 0.0 },
  { id: 'charcoal-fabric', name: 'Charcoal',      category: 'fabric',  color: '#3a3a3e', colorHex: '#3a3a3e', roughness: 0.25, metalness: 0.0 },
  { id: 'ivory-fabric',    name: 'Ivory Linen',   category: 'fabric',  color: '#e8e0d4', colorHex: '#e8e0d4', roughness: 0.40, metalness: 0.0 },
  { id: 'ocean-fabric',    name: 'Ocean Blue',    category: 'fabric',  color: '#4a6fa5', colorHex: '#4a6fa5', roughness: 0.30, metalness: 0.0 },
  // Leathers (5) — Clun textured
  { id: 'clun-280', name: 'Clun 280', category: 'leather', color: '#7a5c40', colorHex: '#7a5c40', roughness: 0.55, metalness: 0.0, texturePath: '/textures/leather/clun-280-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
  { id: 'clun-284', name: 'Clun 284', category: 'leather', color: '#3d2b1f', colorHex: '#3d2b1f', roughness: 0.50, metalness: 0.0, texturePath: '/textures/leather/clun-284-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
  { id: 'clun-287', name: 'Clun 287', category: 'leather', color: '#b08060', colorHex: '#b08060', roughness: 0.55, metalness: 0.0, texturePath: '/textures/leather/clun-287-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
  { id: 'clun-289', name: 'Clun 289', category: 'leather', color: '#d4b898', colorHex: '#d4b898', roughness: 0.55, metalness: 0.0, texturePath: '/textures/leather/clun-289-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
  { id: 'clun-291', name: 'Clun 291', category: 'leather', color: '#1e1410', colorHex: '#1e1410', roughness: 0.50, metalness: 0.0, texturePath: '/textures/leather/clun-291-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
]

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  upholsteryId: 'navy-fabric',
  isInteracting: false,
  setUpholstery: (id) => set({ upholsteryId: id }),
  setInteracting: (v) => set({ isInteracting: v }),
}))
