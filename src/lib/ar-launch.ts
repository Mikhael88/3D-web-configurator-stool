// Client-side helpers for handing the *configured* model to native AR viewers.
//
// Both Google Scene Viewer (Android) and Apple AR Quick Look (iOS) fetch the
// model from a plain HTTPS URL — they cannot use blob: URLs (and Quick Look
// on recent iOS versions silently fails with them). So the configured model
// is exported in-browser, uploaded to /api/ar-model, and the viewer is
// pointed at the returned same-origin URL.

export type ArModelKind = 'glb' | 'usdz'

export async function uploadArModel(blob: Blob, kind: ArModelKind): Promise<string> {
  const res = await fetch(`/api/ar-model?kind=${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: blob,
  })
  if (!res.ok) throw new Error(`AR model upload failed (${res.status})`)
  const { url } = (await res.json()) as { url: string }
  return url
}

// Launch Google Scene Viewer with a publicly fetchable GLB URL.
export function launchSceneViewer(glbUrl: string, title: string, fallbackUrl: string): void {
  const params = `file=${encodeURIComponent(glbUrl)}&mode=ar_preferred&title=${encodeURIComponent(title)}`
  const fallback = encodeURIComponent(fallbackUrl)
  window.location.href =
    `intent://arvr.google.com/scene-viewer/1.0?${params}` +
    `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;` +
    `S.browser_fallback_url=${fallback};end`
}
