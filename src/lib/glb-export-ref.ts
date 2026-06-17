export type GlbExportFn = () => Promise<Blob>

let glbExportFn: GlbExportFn | null = null

export function setGlbExporter(fn: GlbExportFn | null): void {
  glbExportFn = fn
}

export function getGlbExporter(): GlbExportFn | null {
  return glbExportFn
}
