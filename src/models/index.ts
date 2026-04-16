// src/models/index.ts

export interface ModelConfig {
  id: string           // URL slug used in /configure/[model]
  name: string         // Display name shown on the card
  glbPath: string | null  // null = not ready, card shown as "coming soon"
  imagePath: string | null // null = no image available
  description: string
}

export const MODELS: ModelConfig[] = [
  {
    id: 'c111',
    name: 'Maya',
    glbPath: '/C111.glb',
    imagePath: '/c111.webp',
    description: 'Sgabello essenziale e contemporaneo in acciaio inox AISI 316L lucido.\nSeduta imbottita con schienale minimale per un comfort equilibrato.\nMovimento girevole a 360° con ritorno automatico a secco, fluido e senza manutenzione.\nPoggiapiedi in legno naturale e diverse soluzioni di fissaggio.',
  },
  {
    id: 'c112',
    name: 'Zemira',
    glbPath: '/C112.glb',
    imagePath: '/c112.webp',
    description: 'Sgabello elegante e solido in acciaio inox AISI 316L lucido.\nSeduta imbottita con braccioli per un comfort superiore.\nRotazione a 360° con ritorno automatico a secco, precisa e durevole.\nPoggiapiedi in legno naturale e fissaggi versatili.',
  },
  {
    id: 'c113',
    name: 'Vittoria',
    glbPath: '/C113.glb',
    imagePath: '/c113.webp',
    description: 'Sgabello versatile in acciaio inox AISI 316L lucido.\nSeduta ergonomica per un comfort prolungato.\nRotazione a 360° senza ritorno e altezza regolabile (198 mm).\nStruttura stabile con fissaggio sicuro e poggiapiedi integrato.',
  },
  {
    id: 'c114',
    name: 'Isabel',
    glbPath: '/C114.glb',
    imagePath: '/c114.webp',
    description: 'Sgabello essenziale e minimale in acciaio inox AISI 316L lucido.\nSeduta imbottita compatta e confortevole.\nRotazione a 360° senza ritorno per massima libertà.',
  },
]
