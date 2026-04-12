export const THEME = {
  // Backgrounds
  bgPage:      '#f5f2ee',
  bgSidebar:   '#ffffff',
  bgCard:      '#ffffff',
  bgCardImage: 'linear-gradient(160deg, #dde4ec 0%, #c8d2de 100%)',
  bgInput:     '#f9f8f6',

  // Text
  textPrimary:   '#2c3e50',  // intentional alias of accentNavy — split if text/accent diverge
  textSecondary: 'rgba(44,62,80,0.65)',
  textMuted:     'rgba(44,62,80,0.35)',
  textInverse:   '#ffffff',

  // Accents
  accentNavy:    '#2c3e50',  // intentional alias of textPrimary — split if text/accent diverge
  accentSand:    '#c9b99a',
  accentSlate:   '#7a9bb5',

  // States
  accentSelected: 'rgba(44,62,80,0.15)',  // swatch ring / selection tint — same value as borderMid, split if they diverge

  // Borders
  borderSubtle: 'rgba(44,62,80,0.08)',
  borderMid:    'rgba(44,62,80,0.15)',
  borderStrong: 'rgba(44,62,80,0.25)',

  // Shadows
  shadowSheet: '0 -4px 24px rgba(0,0,0,0.08)',
  shadowTray:  '0 -8px 32px rgba(0,0,0,0.12)',
} as const
