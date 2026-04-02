import { Texture } from 'three'
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

export type LightingMode = 'daylight' | 'studio'

export interface ConfiguratorState {
  upholsteryId: string   // fabric or leather → seat + backrest only
  showArmrests: boolean
  lightingMode: LightingMode
  setUpholstery: (id: string) => void
  toggleArmrests: () => void
  setLighting: (mode: LightingMode) => void
}

export const UPHOLSTERY_MATERIALS: MaterialOption[] = [
  // Fabrics
  { id: 'navy-fabric', name: 'Navy Marine Fabric', category: 'fabric', color: '#1a2b45', colorHex: '#1a2b45', roughness: 0.3, metalness: 0.0},
  { id: 'sand-fabric', name: 'Sand Beige Fabric', category: 'fabric', color: '#c4a97d', colorHex: '#c4a97d', roughness: 0.35, metalness: 0.0},
  { id: 'charcoal-fabric', name: 'Charcoal Melange', category: 'fabric', color: '#3a3a3e', colorHex: '#3a3a3e', roughness: 0.25, metalness: 0.0},
  { id: 'ivory-fabric', name: 'Ivory Linen', category: 'fabric', color: '#e8e0d4', colorHex: '#e8e0d4', roughness: 0.4, metalness: 0.0},
  // Leathers
  { id: 'cognac-leather', name: 'Cognac Leather', category: 'leather', color: '#8b4513', colorHex: '#8b4513', roughness: 0.45, metalness: 0.0},
  { id: 'black-leather', name: 'Black Leather', category: 'leather', color: '#1a1a1a', colorHex: '#1a1a1a', roughness: 0.35, metalness: 0.0},
  { id: 'tan-leather', name: 'Natural Tan Leather', category: 'leather', color: '#c4956a', colorHex: '#c4956a', roughness: 0.60, metalness: 0.0},
  { id: 'burgundy-leather', name: 'Burgundy Leather', category: 'leather', color: '#5c1a1a', colorHex: '#5c1a1a', roughness: 0.58, metalness: 0.0},
]

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  upholsteryId: 'navy-fabric',
  showArmrests: true,
  lightingMode: 'studio',
  setUpholstery: (id) => set({ upholsteryId: id }),
  toggleArmrests: () => set((state) => ({ showArmrests: !state.showArmrests })),
  setLighting: (mode) => set({ lightingMode: mode }),
}))
