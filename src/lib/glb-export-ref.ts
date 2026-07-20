export type GlbExportFn = () => Promise<Blob>

let glbExportFn: GlbExportFn | null = null
const listeners = new Set<(ready: boolean) => void>()

export function setGlbExporter(fn: GlbExportFn | null): void {
  glbExportFn = fn
  const ready = fn !== null
  listeners.forEach(l => l(ready))
}

export function getGlbExporter(): GlbExportFn | null {
  return glbExportFn
}

/** Subscribe to exporter readiness. Called immediately with current state, then on every change. Returns an unsubscribe function. */
export function onGlbExporterReady(fn: (ready: boolean) => void): () => void {
  listeners.add(fn)
  fn(glbExportFn !== null)
  return () => { listeners.delete(fn) }
}
