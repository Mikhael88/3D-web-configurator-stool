export type UsdzExportFn = () => Promise<Blob>

let usdzExportFn: UsdzExportFn | null = null
const listeners = new Set<(ready: boolean) => void>()

export function setUsdzExporter(fn: UsdzExportFn | null): void {
  usdzExportFn = fn
  const ready = fn !== null
  listeners.forEach(l => l(ready))
}

export function getUsdzExporter(): UsdzExportFn | null {
  return usdzExportFn
}

/** Subscribe to exporter readiness. Called immediately with current state, then on every change. Returns an unsubscribe function. */
export function onUsdzExporterReady(fn: (ready: boolean) => void): () => void {
  listeners.add(fn)
  fn(usdzExportFn !== null)
  return () => { listeners.delete(fn) }
}
