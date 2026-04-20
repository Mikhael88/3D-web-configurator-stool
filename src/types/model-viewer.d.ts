// src/types/model-viewer.d.ts
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string
      ar?: boolean | string
      'ar-modes'?: string
      'camera-controls'?: boolean | string
      style?: React.CSSProperties
    }
  }
}
