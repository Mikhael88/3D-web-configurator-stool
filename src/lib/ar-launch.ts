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
//
// Uses package=com.google.android.googlequicksearchbox (the Google app) rather
// than com.google.ar.core — the Google app is pre-installed on virtually all
// Android devices and bundles Scene Viewer, so the intent resolves even on
// devices without ARCore installed. com.google.ar.core silently fails on
// those devices (the fallback URL fires but the user sees nothing happen).
export function launchSceneViewer(glbUrl: string, title: string, fallbackUrl: string): void {
  const params =
    `file=${encodeURIComponent(glbUrl)}` +
    `&title=${encodeURIComponent(title)}` +
    `&mode=ar_preferred` +
    `&enable_vertical_placement=false`
  const fallback = encodeURIComponent(fallbackUrl)
  window.location.href =
    `intent://arvr.google.com/scene-viewer/1.0?${params}` +
    `#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;` +
    `S.browser_fallback_url=${fallback};end`
}
