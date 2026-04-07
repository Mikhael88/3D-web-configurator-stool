# Atelier Maritime — 3D Configurator

## Cos'è

Configuratore 3D interattivo per mobili nautici di lusso del brand fittizio **Atelier Maritime**.
L'utente seleziona un modello di prodotto, lo personalizza (materiali, accessori, illuminazione) e
può finalizzare l'ordine.

## Stato attuale (Aprile 2026)

Implementato: configuratore per un singolo prodotto — lo **Horizon Stool** (sgabello da barca,
serie 39019/39020/39022). L'app è full-screen, dark luxury theme, senza routing.

**Funzionalità disponibili:**
- Scambio materiale seduta + schienale (4 tessuti, 4 pelli) via swatches
- Toggle braccioli integrati
- Cambio illuminazione: Dark Studio / Daylight
- Rotazione del corpo superiore dello sgabello via drag
- OrbitControls (orbit, pan, zoom)

## Roadmap pianificata

### Prossimo step: Model Selection Screen
Schermata iniziale in cui l'utente sceglie uno dei prodotti disponibili prima di entrare nel
configuratore 3D. Le implicazioni architetturali di questo step:

- **Routing**: ogni prodotto avrà una route dedicata, es. `/configure/[model]`
- **GLB multipli**: ogni prodotto ha il proprio file `.glb` con mesh target specifici
- **Config per-modello**: materiali disponibili, opzioni e preset variano per prodotto
- **Animazione di transizione**: dall'anteprima del modello alla scena 3D full-screen

### Prodotti futuri previsti
Oltre allo Horizon Stool, verranno aggiunti altri prodotti nautici (sedili, tavoli, ecc.),
ciascuno con il proprio GLB e la propria configurazione di mesh target.

## Design system

Dark luxury nautical theme. Hardcoded via inline styles (non usa il sistema di variabili CSS di shadcn/ui).

| Token | Valore | Uso |
|-------|--------|-----|
| Background | `#0c0e12` | Sfondo app |
| Background viewport | `#0d131f` (studio) / `#1a1c20` (daylight) | Canvas |
| Primary accent | `#bcc7de` | Bordi selezione, bottone principale |
| Tertiary accent | `#e2c19d` | Etichetta sottocategoria |
| Text primary | `#e2e2e8` | Titoli, body |
| Text secondary | `#c6c6cd` | Hint, label secondari |
| Text muted | `#909097` | Label sezioni |
| Font titoli | Noto Serif (Google Fonts) | H1, brand name |
| Font UI | Manrope (Google Fonts) | Tutto il resto |

## Tech stack

| Layer | Tecnologia |
|-------|-----------|
| Framework | Next.js 16, App Router |
| UI | React 19, Tailwind CSS v4, inline styles |
| 3D | Three.js 0.183, @react-three/fiber 9, @react-three/drei 10 |
| State | Zustand 5 |
| Linguaggio | TypeScript 5 |
| Runtime / PM | Bun |
| Deploy | Standalone Next.js (`bun .next/standalone/server.js`) |
