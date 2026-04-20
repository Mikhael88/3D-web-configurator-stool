import type React from 'react'

export interface ModelViewerElement extends HTMLElement {
  activateAR(): void
  dismissAR(): void
  readonly isPresenting: boolean
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        alt?: string
        ar?: boolean
        'ar-modes'?: string
        'camera-controls'?: boolean
      }
    }
  }
}
