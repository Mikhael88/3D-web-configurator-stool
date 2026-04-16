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
  // Fabrics (5) — Teknofibra textured
  { id: 'teknofibra-03', name: 'Teknofibra 03', category: 'fabric', color: '#d8d4ce', colorHex: '#d8d4ce', roughness: 0.70, metalness: 0.0, texturePath: '/textures/fabric/teknofibra-03-diffuse.png', normalPath: '/textures/fabric/teknofibra-normal.png' },
  { id: 'teknofibra-17', name: 'Teknofibra 17', category: 'fabric', color: '#8a8a85', colorHex: '#8a8a85', roughness: 0.70, metalness: 0.0, texturePath: '/textures/fabric/teknofibra-17-diffuse.png', normalPath: '/textures/fabric/teknofibra-normal.png' },
  { id: 'teknofibra-20', name: 'Teknofibra 20', category: 'fabric', color: '#5c6655', colorHex: '#5c6655', roughness: 0.70, metalness: 0.0, texturePath: '/textures/fabric/teknofibra-20-diffuse.png', normalPath: '/textures/fabric/teknofibra-normal.png' },
  { id: 'teknofibra-25', name: 'Teknofibra 25', category: 'fabric', color: '#c4b898', colorHex: '#c4b898', roughness: 0.70, metalness: 0.0, texturePath: '/textures/fabric/teknofibra-25-diffuse.png', normalPath: '/textures/fabric/teknofibra-normal.png' },
  { id: 'teknofibra-40', name: 'Teknofibra 40', category: 'fabric', color: '#1e1e1e', colorHex: '#1e1e1e', roughness: 0.70, metalness: 0.0, texturePath: '/textures/fabric/teknofibra-40-diffuse.png', normalPath: '/textures/fabric/teknofibra-normal.png' },
  // Leathers (5) — Clun textured
  { id: 'clun-280', name: 'Clun 280', category: 'leather', color: '#7a5c40', colorHex: '#7a5c40', roughness: 0.22, metalness: 0.0, texturePath: '/textures/leather/clun-280-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
  { id: 'clun-284', name: 'Clun 284', category: 'leather', color: '#3d2b1f', colorHex: '#3d2b1f', roughness: 0.22, metalness: 0.0, texturePath: '/textures/leather/clun-284-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
  { id: 'clun-287', name: 'Clun 287', category: 'leather', color: '#b08060', colorHex: '#b08060', roughness: 0.22, metalness: 0.0, texturePath: '/textures/leather/clun-287-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
  { id: 'clun-289', name: 'Clun 289', category: 'leather', color: '#d4b898', colorHex: '#d4b898', roughness: 0.22, metalness: 0.0, texturePath: '/textures/leather/clun-289-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
  { id: 'clun-291', name: 'Clun 291', category: 'leather', color: '#1e1410', colorHex: '#1e1410', roughness: 0.22, metalness: 0.0, texturePath: '/textures/leather/clun-291-tileable-diffuse.png', normalPath: '/textures/leather/clun-tileable-nornal.png' },
]

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  upholsteryId: 'teknofibra-03',
  isInteracting: false,
  setUpholstery: (id) => set({ upholsteryId: id }),
  setInteracting: (v) => set({ isInteracting: v }),
}))
