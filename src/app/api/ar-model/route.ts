import { NextRequest, NextResponse } from 'next/server'
import { AR_MODEL_CONTENT_TYPE, readArModel, saveArModel, type ArModelKind } from '@/lib/ar-model-store'

export const runtime = 'nodejs'

// Configured GLBs export at ~23 MB (the exporter re-embeds the original
// textures), so the cap needs real headroom above that.
const MAX_BYTES = 60_000_000 // 60 MB

function kindFromRequest(req: NextRequest): ArModelKind | null {
  const k = req.nextUrl.searchParams.get('kind')
  return k === 'glb' || k === 'usdz' ? k : null
}

// POST /api/ar-model?kind=glb|usdz — body is the raw model file.
// Returns { url } — a same-origin absolute URL the AR viewers can fetch.
export async function POST(req: NextRequest) {
  const kind = kindFromRequest(req)
  if (!kind) {
    return NextResponse.json({ error: 'missing or invalid kind' }, { status: 400 })
  }

  let data: Buffer
  try {
    data = Buffer.from(await req.arrayBuffer())
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 })
  }

  if (data.byteLength === 0 || data.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'invalid size' }, { status: 413 })
  }

  const id = await saveArModel(data, kind)
  return NextResponse.json({ url: `${req.nextUrl.origin}/api/ar-model/${id}?kind=${kind}` })
}
