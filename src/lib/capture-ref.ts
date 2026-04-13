export type CaptureViewsFn = () => Promise<{
  front: string
  side: string
  top: string
  aspectRatio: number  // canvas width / height — used to size images correctly in the PDF
}>

let captureViewsFn: CaptureViewsFn | null = null

export function setCaptureViews(fn: CaptureViewsFn | null): void {
  captureViewsFn = fn
}

export function getCaptureViews(): CaptureViewsFn | null {
  return captureViewsFn
}
