// src/models/index.ts

export interface ModelConfig {
  id: string           // URL slug used in /configure/[model]
  name: string         // Display name shown on the card
  glbPath: string | null  // null = not ready, card shown as "coming soon"
}

export const MODELS: ModelConfig[] = [
  {
    id: 'c111',
    name: 'Maya',
    glbPath: '/C111.glb',
  },
  {
    id: 'c112',
    name: 'Zemira',
    glbPath: '/C112.glb',
  },
  {
    id: 'c113',
    name: 'Vittoria',
    glbPath: '/C113.glb',
  },
  {
    id: 'c114',
    name: 'Isabel',
    glbPath: '/C114.glb',
  },
]
