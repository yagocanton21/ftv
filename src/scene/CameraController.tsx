import { useEffect, useRef } from 'react'
import { CameraControls } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import type { CameraPreset } from '@/domain/types'
import { sceneRefs } from '@/store/sceneRefs'
import { useUiStore } from '@/store/uiStore'

export function CameraController() {
  const controlsRef = useRef<CameraControls | null>(null)
  const cameraState = useUiStore((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    if (controlsRef.current) {
      sceneRefs.controls = controlsRef.current
    }
    return () => {
      sceneRefs.controls = null
    }
  }, [])

  const applyPreset = (preset: CameraPreset) => {
    const c = controlsRef.current
    if (!c) return

    switch (preset) {
      case 'top':
        // Vista superior (2D tática): de cima para baixo
        void c.setLookAt(0, 24, 0.001, 0, 0, 0, true)
        break
      case 'iso':
        // Vista isométrica padrão
        void c.setLookAt(14, 12, 14, 0, 0, 0, true)
        break
      case 'side':
        // Vista lateral (visão do banco/árbitro)
        void c.setLookAt(0, 6, 17, 0, 0.8, 0, true)
        break
      case 'end':
        // Vista de fundo (atrás da quadra / linha de saque)
        void c.setLookAt(-18, 6, 0, 0, 0.8, 0, true)
        break
      case 'free':
        void c.setLookAt(12, 10, 12, 0, 0, 0, true)
        break
    }
    invalidate()
  }

  // Executa animação sempre que preset ou nonce mudar
  useEffect(() => {
    applyPreset(cameraState.preset)
  }, [cameraState.preset, cameraState.nonce])

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      smoothTime={0.25}
      minDistance={2}
      maxDistance={60}
      maxPolarAngle={Math.PI / 2 - 0.05} // Não deixar a câmera ir para debaixo da terra
      onChange={() => invalidate()}
    />
  )
}
