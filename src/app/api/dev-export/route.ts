import { NextRequest, NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

// POST /api/dev-export?name=c111-teknofibra-03.glb — dev-only helper used by
// DevExportPanel's batch export: writes the posted model file straight into
// public/models/{glb|usdz}/ so static AR variants land in the repo without
// 100 manual downloads. Never available in production builds.
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'dev only' }, { status: 403 })
  }

  const name = req.nextUrl.searchParams.get('name') ?? ''
  const m = /^([a-z0-9-]+)\.(glb|usdz)$/.exec(name)
  if (!m) {
    return NextResponse.json({ error: 'invalid name' }, { status: 400 })
  }

  const data = Buffer.from(await req.arrayBuffer())
  if (data.byteLength === 0) {
    return NextResponse.json({ error: 'empty body' }, { status: 400 })
  }

  const dir = path.join(process.cwd(), 'public', 'models', m[2])
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, name), data)
  return NextResponse.json({ ok: true, bytes: data.byteLength })
}
