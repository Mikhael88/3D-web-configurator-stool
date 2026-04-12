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
  // Leathers (5)
  { id: 'cognac-leather',   name: 'Cognac',       category: 'leather', color: '#8b4513', colorHex: '#8b4513', roughness: 0.45, metalness: 0.0 },
  { id: 'black-leather',    name: 'Black',        category: 'leather', color: '#1a1a1a', colorHex: '#1a1a1a', roughness: 0.35, metalness: 0.0 },
  { id: 'tan-leather',      name: 'Natural Tan',  category: 'leather', color: '#c4956a', colorHex: '#c4956a', roughness: 0.60, metalness: 0.0 },
  { id: 'burgundy-leather', name: 'Burgundy',     category: 'leather', color: '#5c1a1a', colorHex: '#5c1a1a', roughness: 0.58, metalness: 0.0 },
  { id: 'blanc-leather',    name: 'Blanc',        category: 'leather', color: '#f0ece6', colorHex: '#f0ece6', roughness: 0.50, metalness: 0.0 },
]

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  upholsteryId: 'navy-fabric',
  isInteracting: false,
  setUpholstery: (id) => set({ upholsteryId: id }),
  setInteracting: (v) => set({ isInteracting: v }),
}))
