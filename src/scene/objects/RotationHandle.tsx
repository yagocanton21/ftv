import { useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import type { SceneObject } from '@/domain/types'
import { groundPoint } from '@/scene/interaction/useObjectInteraction'
import { useDocumentStore } from '@/store/documentStore'
import { setCameraEnabled } from '@/store/sceneRefs'
import { useUiStore } from '@/store/uiStore'
import { normalizeDeg, radToDeg } from '@/lib/utils'

interface RotationHandleProps {
  obj: SceneObject
  radius: number
  centerPos: { x: number; z: number }
  currentRotationDeg: number
}

type Captureable = { setPointerCapture(id: number): void; releasePointerCapture(id: number): void }

export function RotationHandle({ obj, radius, centerPos, currentRotationDeg }: RotationHandleProps) {
  const isRotating = useRef(false)
  const pointerIdRef = useRef<number | null>(null)

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (obj.locked || e.button !== 0) return
    e.stopPropagation()
    isRotating.current = true
    pointerIdRef.current = e.pointerId
    ;(e.target as unknown as Captureable).setPointerCapture(e.pointerId)
    setCameraEnabled(false)
    useUiStore.getState().setDragging(true)
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isRotating.current) return
    e.stopPropagation()
    const pt = groundPoint(e)
    if (!pt) return
    // Ângulo em relação ao centro do objeto
    const dx = pt.x - centerPos.x
    const dz = pt.z - centerPos.z
    // No Three.js com Y para cima e X para direita: atan2(dz, dx) dá o ângulo em radianos
    // No nosso sistema, rotação 0 = olhando para +X (dz = 0, dx > 0)
    // Three.js rotation-y positiva gira no sentido anti-horário em torno do eixo Y
    const angleRad = Math.atan2(-dz, dx)
    const angleDeg = normalizeDeg(radToDeg(angleRad))

    useUiStore.getState().setPreview({
      [obj.id]: { rotation: angleDeg },
    })
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isRotating.current) return
    e.stopPropagation()
    isRotating.current = false
    if (pointerIdRef.current !== null) {
      ;(e.target as unknown as Captureable).releasePointerCapture(pointerIdRef.current)
      pointerIdRef.current = null
    }
    setCameraEnabled(true)
    useUiStore.getState().setDragging(false)

    const preview = useUiStore.getState().preview[obj.id]
    if (preview?.rotation !== undefined) {
      useDocumentStore.getState().updateObject(obj.id, { rotation: preview.rotation })
    }
    useUiStore.getState().setPreview({})
  }

  const rRad = (currentRotationDeg * Math.PI) / 180
  const handleX = Math.cos(rRad) * (radius + 0.35)
  const handleZ = -Math.sin(rRad) * (radius + 0.35)

  return (
    <group position-y={0.02}>
      {/* Círculo guia */}
      <mesh rotation-x={-Math.PI / 2} raycast={() => null}>
        <ringGeometry args={[radius + 0.32, radius + 0.35, 48]} />
        <meshBasicMaterial color="#c6f432" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Alça manipuladora (clicar e arrastar para girar) */}
      <mesh
        position={[handleX, 0.01, handleZ]}
        rotation-x={-Math.PI / 2}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <circleGeometry args={[0.15, 24]} />
        <meshBasicMaterial color="#c6f432" />
      </mesh>
    </group>
  )
}
