import { useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useDocumentStore } from '@/store/documentStore'
import { useSimulationStore } from '@/store/simulationStore'
import { sceneRefs } from '@/store/sceneRefs'
import { Court } from './Court'
import { SceneObjects } from './objects/SceneObjects'
import { CameraController } from './CameraController'

function SceneBridge() {
  const { gl, invalidate } = useThree()

  useEffect(() => {
    sceneRefs.gl = gl
    sceneRefs.invalidate = invalidate
    return () => {
      sceneRefs.gl = null
      sceneRefs.invalidate = null
    }
  }, [gl, invalidate])

  return null
}

function SimulationTicker() {
  const isPlaying = useSimulationStore((s) => s.isPlaying)
  const advanceTime = useSimulationStore((s) => s.advanceTime)

  useFrame((_, delta) => {
    if (isPlaying) {
      // Limita delta para evitar saltos se a aba ficar em background
      advanceTime(Math.min(delta, 0.1))
    }
  })

  return null
}

export function StudioCanvas() {
  const court = useDocumentStore((s) => s.exercise.court)
  const isPlaying = useSimulationStore((s) => s.isPlaying)

  return (
    <div className="w-full h-full relative outline-none select-none">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        frameloop={isPlaying ? 'always' : 'demand'}
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        camera={{ position: [14, 12, 14], fov: 45 }}
        className="w-full h-full"
      >
        {/* Céu suave de arena de praia ensolarada */}
        <color attach="background" args={['#8ec5ea']} />
        <fog attach="fog" args={['#a9d5f2', 45, 110]} />

        {/* Iluminação solar de dia de jogo na praia */}
        <ambientLight intensity={0.65} color="#ffffff" />
        <hemisphereLight intensity={0.55} color="#bfe1fa" groundColor="#eed9b7" />
        <directionalLight
          position={[16, 26, 14]}
          intensity={1.75}
          color="#fff8eb"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-22}
          shadow-camera-right={22}
          shadow-camera-top={22}
          shadow-camera-bottom={-22}
          shadow-camera-near={1}
          shadow-camera-far={70}
          shadow-bias={-0.0003}
        />

        <SceneBridge />
        <SimulationTicker />
        <Court court={court} />
        <SceneObjects />
        <CameraController />
      </Canvas>
    </div>
  )
}
