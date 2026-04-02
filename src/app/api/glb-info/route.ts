import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const glbPath = path.join(process.cwd(), 'public', 'stool.glb')
    const buffer = await fs.readFile(glbPath)

    // GLB: 12-byte header
    // byte 0-3: magic "glTF"
    // byte 4-7: version (uint32 LE)
    // byte 8-11: total length (uint32 LE)
    // byte 12-15: chunk0 length (uint32 LE)
    // byte 16-19: chunk0 type (uint32 LE) - 0x4E4F534A = JSON
    // byte 20+: chunk0 data

    const magic = buffer.toString('ascii', 0, 4)
    const version = buffer.readUInt32LE(4)
    const totalLength = buffer.readUInt32LE(8)
    const chunk0Length = buffer.readUInt32LE(12)
    const chunk0Type = buffer.readUInt32LE(16)

    if (magic !== 'glTF') {
      return NextResponse.json({ error: `Not a GLB file. Magic: "${magic}", file size: ${buffer.length}` })
    }

    const jsonData = buffer.slice(20, 20 + chunk0Length).toString('utf-8')
    const gltf = JSON.parse(jsonData)

    const objects: string[] = []

    const nodes = gltf.nodes || []
    const meshes = gltf.meshes || []

    for (const node of nodes) {
      const meshRef = node.mesh !== undefined ? ` [mesh#${node.mesh}]` : ''
      const children = node.children ? ` children: [${node.children.join(',')}]` : ''
      objects.push(`node: "${node.name}"${meshRef}${children}`)
    }

    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i]
      objects.push(`mesh[${i}]: name="${mesh.name || '(unnamed)'}"`)
    }

    const materials = gltf.materials || []
    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i]
      const pbr = mat.pbrMetallicRoughness || {}
      objects.push(`material[${i}]: name="${mat.name || '(unnamed)'}" color: ${JSON.stringify(pbr.baseColorFactor)} roughness: ${pbr.roughness} metalness: ${pbr.metalness}`)
    }

    return NextResponse.json({ objects, magic, version, totalLength, chunk0Length, chunk0Type })
  } catch (err) {
    return NextResponse.json({ error: String(err), stack: (err as any)?.stack }, { status: 500 })
  }
}
