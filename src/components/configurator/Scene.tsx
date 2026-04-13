'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useConfiguratorStore, UPHOLSTERY_MATERIALS } from '@/stores/configurator-store'
import { setCaptureViews } from '@/lib/capture-ref'

// ──────────────────────────────────────
// Mesh targets
// ──────────────────────────────────────

// Mesh name matching: exact 'tessuto' / 'cuciture' / 'metallo',
// or compound names ending with that suffix (e.g. 'c111-seduta-tessuto')

// Brushed 316 marine stainless steel
const METAL_MAT = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color('#c2cad4'),
  metalness: 1.0,
  roughness: 0.20,
  envMapIntensity: 3.6,
  clearcoat: 0.15,
  clearcoatRoughness: 0.10,
})

// Strip Three.js duplicate-node suffix (e.g. "tessuto.001" → "tessuto")
function normalizeMeshName(name: string): string {
  return name.toLowerCase().replace(/\.\d+$/, '')
}

function isUpholsteryMesh(name: string): boolean {
  const n = normalizeMeshName(name)
  return n === 'tessuto' || n.includes('-tessuto')
}

function isStitchMesh(name: string): boolean {
  const n = normalizeMeshName(name)
  return n === 'cuciture' || n.includes('-cuciture')
}

function isMetalMesh(name: string): boolean {
  const n = normalizeMeshName(name)
  return n === 'metallo' || n.includes('-metallo')
}

// Stitch color: slightly lighter for dark materials, slightly darker for light ones
function deriveStitchColor(baseHex: string): THREE.Color {
  const base = new THREE.Color(baseHex)
  const hsl = { h: 0, s: 0, l: 0 }
  base.getHSL(hsl)
  const newL = hsl.l > 0.35 ? hsl.l * 0.65 : Math.min(0.95, hsl.l * 1.6)
  return new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.05), newL)
}

function isRotatingBody(name: string): boolean {
  const n = name.toLowerCase().replace(/[_\-\s]/g, '')
  return n === 'rotatingbody'
}

// Module-level refs shared between components
let stoolSceneGroup: THREE.Object3D | null = null
let rotatingBodyObj: THREE.Object3D | null = null

function setStoolScene(obj: THREE.Object3D | null) { stoolSceneGroup = obj }
function setRotatingBody(obj: THREE.Object3D | null) { rotatingBodyObj = obj }

// ──────────────────────────────────────
// Lighting
// ──────────────────────────────────────
function StudioSetup() {
  return (
    <>
      {/* 1. Fill light — blu notte che solleva le ombre senza bruciare i neri */}
      <ambientLight intensity={0.6} color="#1a2b4c" />

      {/* 2. Key light — frontale/laterale, neutro, proietta le ombre */}
      <directionalLight
        position={[5, 5, 5]}
        intensity={1.5}
        color="#e8eeff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-radius={10}
      />

      {/* 3. Rim light principale — luce fredda dietro il modello, crea il filo luminoso */}
      <directionalLight
        position={[-4, 3, -5]}
        intensity={2.2}
        color="#a8c8ff"
      />

      {/* 4. Rim light secondario opposto — bilancia il contorno */}
      <directionalLight
        position={[4, 2, -4]}
        intensity={0.8}
        color="#c0d8ff"
      />

      {/* 5. Ground glow — spot ampio con penumbra massima per il bagliore alla base */}
      <spotLight
        position={[0, 0.3, 0]}
        angle={Math.PI / 2.5}
        penumbra={1}
        intensity={0.4}
        color="#1a3060"
        castShadow={false}
      />

      {/* 6. Shadow catcher: show only projected shadows (no reflective plane) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        {/* Use a very large plane to avoid seeing the catcher boundary */}
        <planeGeometry args={[200, 200]} /> 
        <shadowMaterial attach="material" opacity={0.3} />
      </mesh>
    </>
  )
}

// ──────────────────────────────────────
// Seat mesh names per model
// ──────────────────────────────────────
// Mesh that physically rotates/moves
function getSeatRotatingMeshName(modelId: string): string | null {
  if (modelId === 'c111') return 'c111-seduta-tessuto'
  if (modelId === 'c112') return 'c112-seduta-tessuto'
  if (modelId === 'c113') return 'c113-seduta-acciaio'
  if (modelId === 'c114') return 'c114-seduta-acciaio'
  return null
}

// Mesh the user clicks to activate interaction (same as rotating for all current models)
function getSeatHitMeshName(modelId: string): string | null {
  return getSeatRotatingMeshName(modelId)
}

// ──────────────────────────────────────
// Stool rotation — C111/C112 (whole rotatingBody)
// ──────────────────────────────────────
let isRotatingStool = false
let prevClientX = 0
let stoolTargetRotation = 0
let stoolCurrentRotation = 0

// ──────────────────────────────────────
// Seat interaction — C113/C114
// ──────────────────────────────────────
const SEAT_HEIGHT_MAX = 0.198   // 198 mm in metres

let seatObj: THREE.Object3D | null = null      // what rotates/moves
let seatHitObj: THREE.Object3D | null = null   // what the user clicks
let seatInitialPosY = 0
let isSeatDragging = false
let prevSeatClientX = 0
let prevSeatClientY = 0
let seatTargetRotY = 0
let seatCurrentRotY = 0
let seatTargetPosY = 0
let seatCurrentPosY = 0

function setSeatObjects(
  rotating: THREE.Object3D | null,
  hit: THREE.Object3D | null,
  initialY = 0,
) {
  seatObj = rotating
  seatHitObj = hit
  seatInitialPosY = initialY
  if (!rotating) {
    seatTargetRotY = 0
    seatCurrentRotY = 0
    seatTargetPosY = 0
    seatCurrentPosY = 0
  }
}

function StoolInteraction({ modelId }: { modelId: string }) {
  const { gl, camera } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  const isSeatModel = true // all models use seat interaction

  useEffect(() => {
    const canvas = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return

      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(mouse, camera)

      if (isSeatModel) {
        if (!seatHitObj) return
        const hits = raycaster.intersectObjects([seatHitObj], true)
        if (hits.length > 0) {
          e.stopPropagation()
          isSeatDragging = true
          prevSeatClientX = e.clientX
          prevSeatClientY = e.clientY
        }
      } else {
        // C111/C112 — drag anywhere on model → rotatingBody spins
        if (!stoolSceneGroup) return
        const intersects = raycaster.intersectObjects(stoolSceneGroup.children, true)
        if (intersects.length > 0) {
          e.stopPropagation()
          isRotatingStool = true
          prevClientX = e.clientX
          stoolTargetRotation = stoolCurrentRotation
        }
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (isSeatModel) {
        if (!isSeatDragging) return
        const dx = e.clientX - prevSeatClientX
        const dy = e.clientY - prevSeatClientY
        prevSeatClientX = e.clientX
        prevSeatClientY = e.clientY
        // Horizontal drag → rotate seat on Y
        seatTargetRotY -= dx * 0.008
        // Vertical drag (C113 only) → adjust height; drag up = clientY decreases = positive offset
        if (modelId === 'c113') {
          seatTargetPosY = Math.max(0, Math.min(SEAT_HEIGHT_MAX, seatTargetPosY + dy * 0.0007))
        }
      } else {
        if (!isRotatingStool) return
        const delta = e.clientX - prevClientX
        prevClientX = e.clientX
        stoolTargetRotation -= delta * 0.008
      }
    }

    const onPointerUp = () => {
      if (isSeatModel) {
        isSeatDragging = false
      } else {
        if (isRotatingStool) isRotatingStool = false
      }
    }

    canvas.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true })
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl, camera, raycaster, isSeatModel, modelId])

  useFrame((_, delta) => {
    if (isSeatModel) {
      if (!seatObj) return
      // Spring-back to 0 when released — C111/C112 only
      if (!isSeatDragging && (modelId === 'c111' || modelId === 'c112')) {
        seatTargetRotY *= Math.pow(0.001, delta)
        if (Math.abs(seatTargetRotY) < 0.001) seatTargetRotY = 0
      }
      seatCurrentRotY = THREE.MathUtils.lerp(seatCurrentRotY, seatTargetRotY, Math.min(1, delta * 12))
      seatObj.rotation.y = seatCurrentRotY
      // Height (C113 only)
      if (modelId === 'c113') {
        seatCurrentPosY = THREE.MathUtils.lerp(seatCurrentPosY, seatTargetPosY, Math.min(1, delta * 8))
        seatObj.position.y = seatInitialPosY + seatCurrentPosY
      }
    } else {
      if (!rotatingBodyObj) return
      if (isRotatingStool) {
        stoolCurrentRotation = THREE.MathUtils.lerp(stoolCurrentRotation, stoolTargetRotation, Math.min(1, delta * 15))
      } else {
        stoolTargetRotation *= Math.pow(0.0005, delta)
        if (Math.abs(stoolTargetRotation) < 0.001) stoolTargetRotation = 0
        stoolCurrentRotation = THREE.MathUtils.lerp(stoolCurrentRotation, stoolTargetRotation, Math.min(1, delta * 6))
      }
      rotatingBodyObj.rotation.y = stoolCurrentRotation
    }
  })

  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.05}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={1.5}
      maxDistance={8}
      target={[0, 0.7, 0]}
    />
  )
}

// ──────────────────────────────────────
// Stool Model
// ──────────────────────────────────────
function StoolModel({ glbPath, modelId }: { glbPath: string; modelId: string }) {
  const { scene } = useGLTF(glbPath)
  const { upholsteryId } = useConfiguratorStore()

  // Build materials from store — new objects ogni volta che cambia upholsteryId
  const { upholsteryMat, stitchMat } = useMemo(() => {
    const m = UPHOLSTERY_MATERIALS.find(x => x.id === upholsteryId) || UPHOLSTERY_MATERIALS[0]
    return {
      upholsteryMat: new THREE.MeshStandardMaterial({
        color: new THREE.Color(m.colorHex),
        roughness: m.roughness,
        metalness: m.metalness,
        envMapIntensity: 1.0,
      }),
      stitchMat: new THREE.MeshStandardMaterial({
        color: deriveStitchColor(m.colorHex),
        roughness: Math.min(0.95, m.roughness + 0.1),
        metalness: 0,
        envMapIntensity: 0.5,
      }),
    }
  }, [upholsteryId])

  // First load: register refs, enable shadows, apply static materials
  useEffect(() => {
    setStoolScene(scene)
    const rotatingName = getSeatRotatingMeshName(modelId)
    const hitName = getSeatHitMeshName(modelId)
    let rotatingMesh: THREE.Object3D | null = null
    let hitMesh: THREE.Object3D | null = null

    scene.traverse((child) => {
      child.castShadow = true
      child.receiveShadow = true

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        const n = normalizeMeshName(child.name)

        if (isMetalMesh(mesh.name)) mesh.material = METAL_MAT
        if (rotatingName && n === rotatingName) rotatingMesh = child
        if (hitName && n === hitName) hitMesh = child

        if (isRotatingBody(child.name)) setRotatingBody(child)
        else if (isRotatingBody(child.parent?.name || '') && !rotatingBodyObj) {
          setRotatingBody(child.parent!)
        }
      }

      if ((child.type === 'Group' || child.type === 'Object3D') && isRotatingBody(child.name)) {
        setRotatingBody(child)
      }
    })

    setSeatObjects(rotatingMesh, hitMesh ?? rotatingMesh, (rotatingMesh as THREE.Object3D | null)?.position.y ?? 0)

    return () => {
      setStoolScene(null)
      setRotatingBody(null)
      setSeatObjects(null, null)
    }
  }, [scene, modelId])

  // Apply material and visibility
  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      // Upholstery mesh
      if (isUpholsteryMesh(mesh.name)) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(() => upholsteryMat)
        } else {
          mesh.material = upholsteryMat
        }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach(m => { m.needsUpdate = true })
        return
      }

      // Stitch mesh — derived color from upholstery
      if (isStitchMesh(mesh.name)) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(() => stitchMat)
        } else {
          mesh.material = stitchMat
        }
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach(m => { m.needsUpdate = true })
      }
    })
  }, [scene, upholsteryMat, stitchMat])

  return <primitive object={scene} />
}
// ──────────────────────────────────────
// PDF Capture Handler
// ──────────────────────────────────────
function CaptureHandler() {
  const { gl, camera, scene } = useThree()

  useEffect(() => {
    setCaptureViews(async () => {
      const savedPos = camera.position.clone()
      const savedQuat = camera.quaternion.clone()
      const lookTarget = new THREE.Vector3(0, 0.7, 0)

      const positions: Array<[number, number, number]> = [
        [0,    1.2, 4.0 ],  // front
        [4.0,  1.2, 0   ],  // right side
        [0,    5.5, 0.01],  // top
      ]

      const aspectRatio = gl.domElement.width / gl.domElement.height

      const images: string[] = []
      for (const pos of positions) {
        camera.position.set(...pos)
        camera.lookAt(lookTarget)
        camera.updateMatrixWorld()
        gl.render(scene, camera)
        images.push(gl.domElement.toDataURL('image/jpeg', 0.92))
      }

      // Restore original camera state
      camera.position.copy(savedPos)
      camera.quaternion.copy(savedQuat)
      camera.updateMatrixWorld()
      gl.render(scene, camera)

      return { front: images[0], side: images[1], top: images[2], aspectRatio }
    })

    return () => { setCaptureViews(null) }
  }, [gl, camera, scene])

  return null
}

// ──────────────────────────────────────
// Full Scene
// ──────────────────────────────────────
function SceneContent({ glbPath, modelId }: { glbPath: string; modelId: string }) {
  return (
    <>
      <color attach="background" args={['#0d131f']} />
      <fog attach="fog" args={['#0d131f', 10, 25]} />

      <StudioSetup />

      <Environment files="/hdr-ambiente.exr" environmentIntensity={1.0} background={false} />

      <StoolModel glbPath={glbPath} modelId={modelId} />
      <StoolInteraction modelId={modelId} />
      <CaptureHandler />

      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={0.7}
        scale={10}
        blur={3}
        far={4}
        color="#0a1628"
      />
    </>
  )
}

// ──────────────────────────────────────
// Exported Canvas
// ──────────────────────────────────────
export default function ConfiguratorScene({ glbPath, modelId }: { glbPath: string; modelId: string }) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      camera={{
        position: [2.5, 2, 2.5],
        fov: 35,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.AgXToneMapping,
        toneMappingExposure: 0.9,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: '#0d131f' }}
    >
      <SceneContent glbPath={glbPath} modelId={modelId} />
    </Canvas>
  )
}
