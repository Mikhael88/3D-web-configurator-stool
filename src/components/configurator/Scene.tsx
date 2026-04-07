'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useConfiguratorStore, UPHOLSTERY_MATERIALS } from '@/stores/configurator-store'

const MODEL_PATH = '/stool.glb'

// ──────────────────────────────────────
// Mesh targets
// ──────────────────────────────────────

// Seduta = node "Cube.005" → Three.js strips dots → "Cube005"
// Schienale = node "Cube.006" → "Cube006"
const UPHOLSTERY_MESH_NAMES = new Set(['cube005', 'cube006'])

function isUpholsteryMesh(name: string): boolean {
  return UPHOLSTERY_MESH_NAMES.has(name.toLowerCase())
}

function isArmrest(name: string): boolean {
  const n = name.toLowerCase().replace(/[_\-\s]/g, '')
  return n === 'bracciolosx' || n === 'bracciolodx'
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
function DaylightSetup() {
  return (
    <>
      <ambientLight intensity={0.6} color="#fff5e6" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.8}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 6, -2]} intensity={0.5} color="#e8f0ff" />
      <hemisphereLight args={['#b1e1ff', '#b97a20', 0.3]} />
    </>
  )
}

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
        shadow-bias={-0.0002}
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
// Stool rotation (click on stool only)
// ──────────────────────────────────────
let isRotatingStool = false
let prevClientX = 0
let stoolTargetRotation = 0
let stoolCurrentRotation = 0

function StoolInteraction() {
  const { gl, camera } = useThree()
  const raycaster = useMemo(() => new THREE.Raycaster(), [])

  useEffect(() => {
    const canvas = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      if (!stoolSceneGroup) return
      if (e.button !== 0) return

      const rect = canvas.getBoundingClientRect()
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(mouse, camera)
      const intersects = raycaster.intersectObjects(stoolSceneGroup.children, true)

      if (intersects.length > 0) {
        e.stopPropagation()
        isRotatingStool = true
        prevClientX = e.clientX
        stoolTargetRotation = stoolCurrentRotation
      }
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isRotatingStool) return
      const delta = e.clientX - prevClientX
      prevClientX = e.clientX
      stoolTargetRotation += delta * 0.008
    }

    const onPointerUp = () => {
      if (isRotatingStool) isRotatingStool = false
    }

    canvas.addEventListener('pointerdown', onPointerDown, { capture: true })
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown, { capture: true })
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl, camera, raycaster])

  useFrame((_, delta) => {
    if (!rotatingBodyObj) return

    if (isRotatingStool) {
      stoolCurrentRotation = THREE.MathUtils.lerp(
        stoolCurrentRotation,
        stoolTargetRotation,
        Math.min(1, delta * 15),
      )
    } else {
      stoolTargetRotation *= Math.pow(0.0005, delta)
      if (Math.abs(stoolTargetRotation) < 0.001) stoolTargetRotation = 0
      stoolCurrentRotation = THREE.MathUtils.lerp(
        stoolCurrentRotation,
        stoolTargetRotation,
        Math.min(1, delta * 6),
      )
    }

    rotatingBodyObj.rotation.y = stoolCurrentRotation
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
function StoolModel() {
  const { scene } = useGLTF(MODEL_PATH)
  const { upholsteryId, showArmrests } = useConfiguratorStore()

  // Build material from store — new object ogni volta che cambia upholsteryId
  const upholsteryMat = useMemo(() => {
    const m = UPHOLSTERY_MATERIALS.find(x => x.id === upholsteryId) || UPHOLSTERY_MATERIALS[0]
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(m.colorHex),
      roughness: m.roughness,
      metalness: m.metalness,
      envMapIntensity: 1.0,
    })
  }, [upholsteryId])

  // First load: register refs, enable shadows, log hierarchy
  useEffect(() => {
    setStoolScene(scene)

    scene.traverse((child) => {
      child.castShadow = true
      child.receiveShadow = true

      if ((child as THREE.Mesh).isMesh) {
        if (isRotatingBody(child.name)) setRotatingBody(child)
        else if (isRotatingBody(child.parent?.name || '') && !rotatingBodyObj) {
          setRotatingBody(child.parent!)
        }
      }

      if ((child.type === 'Group' || child.type === 'Object3D') && isRotatingBody(child.name)) {
        setRotatingBody(child)
      }
    })

    return () => {
      setStoolScene(null)
      setRotatingBody(null)
    }
  }, [scene])

  // Apply material and visibility
  useEffect(() => {
    scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (!mesh.isMesh) return

      // Armrest visibility
      if (isArmrest(mesh.name) || isArmrest(mesh.parent?.name || '')) {
        mesh.visible = showArmrests
        return
      }

      // Upholstery meshes
      if (isUpholsteryMesh(mesh.name)) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map(() => upholsteryMat)
        } else {
          mesh.material = upholsteryMat
        }

        // Ensure Three.js updates the GPU material(s).
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach(m => {
          m.needsUpdate = true
        })
      }
    })
  }, [scene, upholsteryMat, showArmrests])

  return <primitive object={scene} />
}
// ──────────────────────────────────────
// Full Scene
// ──────────────────────────────────────
function SceneContent() {
  const { lightingMode } = useConfiguratorStore()

  return (
    <>
      {/* Background: nero assoluto rimosso → blu scuro desaturato */}
      <color attach="background" args={[lightingMode === 'studio' ? '#0d131f' : '#1a1c20']} />
      <fog attach="fog" args={[lightingMode === 'studio' ? '#0d131f' : '#1a1c20', 10, 25]} />

      {lightingMode === 'daylight' ? <DaylightSetup /> : <StudioSetup />}

      {/* Environment IBL — fondamentale per riflessi corretti sui metalli */}
      {lightingMode === 'daylight' && (
        <Environment preset="apartment" environmentIntensity={0.4} />
      )}
      {lightingMode === 'studio' && (
        <Environment preset="studio" environmentIntensity={0.3} />
      )}

      <StoolModel />
      <StoolInteraction />

      {/* ContactShadows presente in entrambe le modalità per radicare lo sgabello */}
      <ContactShadows
        position={[0, -0.01, 0]}
        opacity={lightingMode === 'studio' ? 0.7 : 0.4}
        scale={10}
        blur={lightingMode === 'studio' ? 3 : 2}
        far={4}
        color={lightingMode === 'studio' ? '#0a1628' : '#000000'}
      />
    </>
  )
}

// ──────────────────────────────────────
// Exported Canvas
// ──────────────────────────────────────
export default function ConfiguratorScene() {
  const { lightingMode } = useConfiguratorStore()

  return (
    <Canvas
      shadows
      camera={{
        position: [2.5, 2, 2.5],
        fov: 35,
        near: 0.1,
        far: 100,
      }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: lightingMode === 'studio' ? 0.9 : 1.2,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ background: lightingMode === 'studio' ? '#0d131f' : '#1a1c20' }}
    >
      <SceneContent />
    </Canvas>
  )
}
