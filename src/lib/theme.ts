export const THEME = {
  // Backgrounds
  bgPage:      '#f5f2ee',
  bgSidebar:   '#728473',  // sage green
  bgCard:      '#ffffff',
  bgCardImage: 'linear-gradient(160deg, #dde4de 0%, #c8d2c9 100%)',  // sage-tinted
  bgInput:     'rgba(255,255,255,0.10)',  // translucent white on sage sidebar

  // Text — for page / card backgrounds (cream / white)
  textPrimary:   '#2e3d2f',              // dark sage (was navy #2c3e50)
  textSecondary: 'rgba(46,61,47,0.65)',
  textMuted:     'rgba(46,61,47,0.35)',
  textInverse:   '#ffffff',

  // Text — for bgSidebar (#728473 sage)
  textOnSage:      'rgba(255,255,255,0.90)',
  textOnSageMuted: 'rgba(255,255,255,0.50)',

  // Accents
  accentNavy:    '#2e3d2f',   // dark sage — Save PDF button, swatch rings
  accentSand:    '#c9b99a',
  accentSlate:   '#a3b4a4',   // light sage (was slate blue #7a9bb5)

  // States
  accentSelected:       'rgba(46,61,47,0.15)',    // on white / cream bg
  accentSelectedOnSage: 'rgba(255,255,255,0.25)', // on sage bg

  // Borders — on page / card backgrounds
  borderSubtle: 'rgba(46,61,47,0.08)',
  borderMid:    'rgba(46,61,47,0.15)',
  borderStrong: 'rgba(46,61,47,0.25)',

  // Borders — on sage sidebar
  borderSageSubtle: 'rgba(255,255,255,0.12)',
  borderSageMid:    'rgba(255,255,255,0.22)',

  // Shadows
  shadowSheet: '0 -4px 24px rgba(0,0,0,0.08)',
  shadowTray:  '0 -8px 32px rgba(0,0,0,0.12)',
} as const
