import { NextRequest, NextResponse } from 'next/server'
import { AR_MODEL_CONTENT_TYPE, readArModel, type ArModelKind } from '@/lib/ar-model-store'

export const runtime = 'nodejs'

// GET /api/ar-model/[id]?kind=glb|usdz — serves a previously saved model.
// Consumed by Google Scene Viewer (glb) and Apple AR Quick Look (usdz),
// which fetch the URL server-side, so it must be same-origin and absolute.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const kindParam = req.nextUrl.searchParams.get('kind')
  const kind: ArModelKind = kindParam === 'usdz' ? 'usdz' : 'glb'

  const data = await readArModel(id, kind)
  if (!data) {
    return new NextResponse('not found or expired', { status: 404 })
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': AR_MODEL_CONTENT_TYPE[kind],
      'Content-Length': String(data.byteLength),
      // AR viewers fetch cross-origin from their own process — allow it.
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  })
}
