export type UsdzExportFn = () => Promise<Blob>

let usdzExportFn: UsdzExportFn | null = null

export function setUsdzExporter(fn: UsdzExportFn | null): void {
  usdzExportFn = fn
}

export function getUsdzExporter(): UsdzExportFn | null {
  return usdzExportFn
}
