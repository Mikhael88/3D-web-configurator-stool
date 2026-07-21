// Client-side helper for handing a static, pre-exported model to Google
// Scene Viewer (Android). Both Scene Viewer and Apple AR Quick Look (iOS)
// fetch the model from a plain HTTPS URL — they cannot use blob: URLs (and
// Quick Look on recent iOS silently fails with them) — so AR variants are
// pre-exported per product/material into public/models/{glb,usdz}/ (see
// DevExportPanel's batch export + /api/dev-export) rather than built at
// request time: the app is deployed on Vercel, whose serverless functions
// cap request bodies at 4.5 MB (an exported GLB runs ~20+ MB) and have no
// shared filesystem across invocations, so runtime export+upload can't work.

// Build the Google Scene Viewer intent URL for a publicly fetchable GLB.
//
// Returned as a string (not navigated here) because Chrome blocks intent://
// for subframe navigations — this app runs inside a WordPress iframe — and
// user activation expires during the export/upload await. The caller must put
// it on an <a target="_blank"> the user taps: fresh gesture + top-level
// navigation, both required for the intent to resolve.
//
// Uses package=com.google.android.googlequicksearchbox (the Google app) rather
// than com.google.ar.core — the Google app is pre-installed on virtually all
// Android devices and bundles Scene Viewer, so the intent resolves even on
// devices without ARCore installed. com.google.ar.core silently fails on
// those devices (the fallback URL fires but the user sees nothing happen).
export function sceneViewerIntentUrl(glbUrl: string, title: string, fallbackUrl: string): string {
  const params =
    `file=${encodeURIComponent(glbUrl)}` +
    `&title=${encodeURIComponent(title)}` +
    `&mode=ar_preferred` +
    `&enable_vertical_placement=false`
  const fallback = encodeURIComponent(fallbackUrl)
  return (
    `intent://arvr.google.com/scene-viewer/1.0?${params}` +
    `#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;` +
    `S.browser_fallback_url=${fallback};end`
  )
}
