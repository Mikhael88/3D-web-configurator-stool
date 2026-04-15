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
    imagePath: '/c111.png',
    description: 'Sgabello dal design essenziale e contemporaneo, progettato per unire estetica, funzionalità e resistenza anche in contesti esigenti come l\'ambiente nautico.\n\nRealizzato in acciaio inox AISI 316L lucidato a specchio, garantisce elevata durabilità e un impatto visivo pulito e raffinato. La seduta imbottita, abbinata allo schienale minimale, offre comfort mantenendo una linea leggera ed equilibrata.\n\nIl sistema girevole a 180° con ritorno automatico, basato su ingranaggio a secco, assicura fluidità di movimento, affidabilità nel tempo e assenza di manutenzioni invasive. Il poggiapiedi in legno naturale introduce un dettaglio caldo e materico, creando un elegante contrasto con la struttura metallica.\n\nProgettato per la massima versatilità, è disponibile con diverse soluzioni di fissaggio, per adattarsi a ogni esigenza installativa.',
  },
  {
    id: 'c112',
    name: 'Zemira',
    glbPath: '/C112.glb',
    imagePath: '/c112.png',
    description: 'Sgabello dal carattere solido ed elegante, pensato per offrire comfort avanzato e affidabilità anche in ambienti ad alta esposizione come il settore nautico.\n\nLa struttura in acciaio inox AISI 316L lucidato a specchio garantisce resistenza nel tempo e una finitura di grande impatto estetico. La seduta imbottita, completata da braccioli integrati, migliora l\'ergonomia e rende l\'utilizzo ancora più confortevole, valorizzando al tempo stesso il design complessivo.\n\nIl movimento girevole a 180° con ritorno automatico, supportato da ingranaggio a secco, assicura precisione, fluidità e durata nel tempo, senza necessità di manutenzioni frequenti. Il poggiapiedi in legno naturale introduce un elemento caldo e distintivo, in armonia con la struttura metallica.\n\nGrazie alle diverse opzioni di fissaggio disponibili, lo sgabello si integra facilmente in molteplici contesti progettuali.',
  },
  {
    id: 'c113',
    name: 'Vittoria',
    glbPath: '/C113.glb',
    imagePath: '/c113.png',
    description: 'Sgabello dal design funzionale e versatile, progettato per offrire massima libertà di movimento e adattabilità in contesti sia nautici che d\'arredo.\n\nRealizzato in acciaio inox AISI 316L lucidato a specchio, garantisce elevata resistenza agli agenti esterni e una finitura di alto livello estetico. La seduta sagomata è studiata per seguire l\'ergonomia del corpo, assicurando comfort anche durante un utilizzo prolungato.\n\nIl sistema girevole a 360° senza ritorno consente una rotazione completa e fluida, ideale per ambienti dinamici. L\'altezza è regolabile tramite ammortizzatore a gas in acciaio inox, con una corsa di 198 mm, permettendo un adattamento preciso alle diverse esigenze di utilizzo.\n\nIl poggiapiedi completa la struttura offrendo supporto e stabilità, mentre la base è progettata per garantire un fissaggio sicuro in ogni contesto.',
  },
  {
    id: 'c114',
    name: 'Isabel',
    glbPath: '/C114.glb',
    imagePath: '/c114.png',
    description: 'Sgabello dal design essenziale e rigoroso, caratterizzato da linee pulite e proporzioni equilibrate, ideale per contesti sia nautici che d\'arredo contemporaneo.\n\nRealizzato in acciaio inox AISI 316L lucidato a specchio, offre elevata resistenza agli agenti esterni e una finitura di pregio, pensata per mantenere nel tempo brillantezza ed integrità. La seduta tonda imbottita, dal profilo semplice e compatto, garantisce comfort e continuità estetica.\n\nIl sistema girevole a 360° senza ritorno consente massima libertà di movimento, adattandosi perfettamente a utilizzi dinamici. Il poggiapiedi circolare integrato in acciaio inox rafforza l\'impronta minimal del prodotto, offrendo al tempo stesso stabilità e praticità d\'uso.',
  },
]
