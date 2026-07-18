import { randomUUID } from 'crypto'
import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

// Temporary store for AR-ready model files (configured GLB for Android Scene
// Viewer, USDZ for iOS Quick Look). Files must be reachable over plain HTTPS
// by Google's / Apple's AR viewers, so they can't be blob: URLs — they're
// written to a temp dir and served same-origin via /api/ar-model/[id].

export type ArModelKind = 'glb' | 'usdz'

const TTL_MS = 10 * 60 * 1000 // 10 minutes — plenty for an AR hand-off
const GC_INTERVAL_MS = 60 * 1000

const EXT: Record<ArModelKind, string> = { glb: '.glb', usdz: '.usdz' }
export const AR_MODEL_CONTENT_TYPE: Record<ArModelKind, string> = {
  glb: 'model/gltf-binary',
  usdz: 'model/vnd.usdz+zip',
}

const rootDir = path.join(tmpdir(), 'atelier-ar-models')
let gcStarted = false

function filePath(id: string, kind: ArModelKind): string {
  // Strict id validation — ids are server-generated UUIDs; reject anything
  // else outright so this can never become a path-traversal vector.
  if (!/^[a-z0-9-]{36}$/i.test(id)) throw new Error('invalid id')
  return path.join(rootDir, `${id}${EXT[kind]}`)
}

async function collectGarbage(): Promise<void> {
  try {
    const { readdir, stat } = await import('fs/promises')
    const entries = await readdir(rootDir).catch(() => [] as string[])
    const now = Date.now()
    await Promise.all(
      entries.map(async (name) => {
        const p = path.join(rootDir, name)
        try {
          const s = await stat(p)
          if (now - s.mtimeMs > TTL_MS) await rm(p, { force: true })
        } catch { /* file already gone — fine */ }
      }),
    )
  } catch { /* never let GC crash the route */ }
}

function ensureGc(): void {
  if (gcStarted) return
  gcStarted = true
  const t = setInterval(collectGarbage, GC_INTERVAL_MS)
  // Don't keep the Node process alive just for cleanup.
  if (typeof t.unref === 'function') t.unref()
}

export async function saveArModel(data: Buffer, kind: ArModelKind): Promise<string> {
  await mkdir(rootDir, { recursive: true })
  ensureGc()
  const id = randomUUID()
  await writeFile(filePath(id, kind), data)
  return id
}

export async function readArModel(id: string, kind: ArModelKind): Promise<Buffer | null> {
  try {
    return await readFile(filePath(id, kind))
  } catch {
    return null
  }
}
