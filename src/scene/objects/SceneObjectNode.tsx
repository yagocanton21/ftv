import { memo, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { degToRad } from '@/lib/utils'
import type { BallObject, SceneObject } from '@/domain/types'
import { useObjectInteraction } from '@/scene/interaction/useObjectInteraction'
import { ObjectModel, footprintRadius } from './models'
import { RotationHandle } from './RotationHandle'
import { useUiStore } from '@/store/uiStore'
import { useDocumentStore } from '@/store/documentStore'
import { useSimulationStore } from '@/store/simulationStore'
import { getInterpolatedState } from '@/domain/simulation'

interface SceneObjectNodeProps {
  obj: SceneObject
  isSelected: boolean
  isHovered: boolean
  previewPos?: { x: number; z: number }
  previewRot?: number
}

export const SceneObjectNode = memo(function SceneObjectNode({
  obj,
  isSelected,
  isHovered,
  previewPos,
  previewRot,
}: SceneObjectNodeProps) {
  const mode = useUiStore((s) => s.mode)
  const isDragging = useUiStore((s) => s.isDragging)
  const handlers = useObjectInteraction(obj)

  const timeline = useDocumentStore((s) => s.exercise.timeline)
  const keyframes = timeline?.keyframes?.[obj.id]

  const groupRef = useRef<THREE.Group>(null)
  const actionDivRef = useRef<HTMLDivElement>(null)
  const actionSpanRef = useRef<HTMLSpanElement>(null)
  const prevSimPosRef = useRef({ x: obj.position.x, z: obj.position.z })

  const radius = footprintRadius(obj)

  // Atualização em tempo real nativa no WebGL (60 FPS contínuo sem lag de reconciliação React)
  useFrame(() => {
    if (!groupRef.current) return

    // 1. Arraste manual pelo usuário
    if (isDragging && previewPos) {
      groupRef.current.position.set(previewPos.x, 0, previewPos.z)
      if (previewRot !== undefined) {
        groupRef.current.rotation.y = degToRad(previewRot)
      }
      prevSimPosRef.current = { x: previewPos.x, z: previewPos.z }
      return
    }

    // 2. Animação via linha do tempo / simulação
    const currTime = useSimulationStore.getState().currentTime
    if (keyframes && keyframes.length > 0) {
      const interpolated = getInterpolatedState(obj, currTime, keyframes)
      const ballHeightOffset =
        obj.type === 'ball'
          ? (interpolated.height ?? (obj as BallObject).height) - (obj as BallObject).height
          : 0
      groupRef.current.position.set(interpolated.position.x, ballHeightOffset, interpolated.position.z)

      // Orientação tática focada na rede e no campo de visão da jogada
      groupRef.current.rotation.y = degToRad(interpolated.rotation)

      prevSimPosRef.current = { x: interpolated.position.x, z: interpolated.position.z }

      if (actionDivRef.current && actionSpanRef.current) {
        if (interpolated.action) {
          actionSpanRef.current.textContent = interpolated.action
          actionDivRef.current.style.display = 'block'
        } else {
          actionDivRef.current.style.display = 'none'
        }
      }
    } else {
      // 3. Posição estática
      const p = previewPos ?? obj.position
      const r = previewRot ?? obj.rotation
      groupRef.current.position.set(p.x, 0, p.z)
      groupRef.current.rotation.y = degToRad(r)
      prevSimPosRef.current = { x: p.x, z: p.z }
      if (actionDivRef.current) {
        actionDivRef.current.style.display = 'none'
      }
    }
  })

  // Pontos de trajetória para desenhar o caminho na areia
  const trajectoryPoints = useMemo<[number, number, number][] | null>(() => {
    if (!keyframes || keyframes.length < 2) return null
    return keyframes.map((k) => [k.position.x, 0.02, k.position.z])
  }, [keyframes])

  return (
    <>
      {/* Linha de trajetória tracejada e marcadores na areia */}
      {trajectoryPoints && (
        <group raycast={() => null}>
          <Line
            points={trajectoryPoints}
            color={obj.color}
            lineWidth={1.5}
            dashed
            dashSize={0.4}
            gapSize={0.3}
            transparent
            opacity={0.55}
          />
          {keyframes?.map((k) => (
            <mesh key={k.id} position={[k.position.x, 0.022, k.position.z]} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.08, 16]} />
              <meshBasicMaterial color={obj.color} transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
      )}

      <group ref={groupRef} position={[obj.position.x, 0, obj.position.z]} rotation-y={degToRad(obj.rotation)}>
        {/* Halo de seleção / hover no chão */}
        {(isSelected || isHovered) && (
          <mesh position-y={0.015} rotation-x={-Math.PI / 2} raycast={() => null}>
            <ringGeometry args={[radius * 0.9, radius * 1.15, 36]} />
            <meshBasicMaterial
              color={isSelected ? '#c6f432' : '#ffffff'}
              transparent
              opacity={isSelected ? 0.9 : 0.4}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Modelo 3D */}
        <group {...handlers}>
          <ObjectModel obj={obj} />
        </group>

        {/* Indicador de bloqueio se travado */}
        {obj.locked && (
          <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2} raycast={() => null}>
            <ringGeometry args={[radius * 1.2, radius * 1.25, 4]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.7} />
          </mesh>
        )}

        {/* Ação ativa no momento da timeline (ex: Manchete, Ataque, Chapa) */}
        <Html position={[0, 2.5, 0]} center distanceFactor={18} style={{ pointerEvents: 'none' }}>
          <div ref={actionDivRef} style={{ display: 'none' }} className="animate-bounce">
            <span
              ref={actionSpanRef}
              className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#ff8a3d] text-white shadow-lg border border-white/30 whitespace-nowrap"
            />
          </div>
        </Html>

        {/* Alça de rotação interativa quando selecionado */}
        {isSelected && !obj.locked && mode === 'edit' && (
          <RotationHandle
            obj={obj}
            radius={radius}
            centerPos={obj.position}
            currentRotationDeg={obj.rotation}
          />
        )}
      </group>
    </>
  )
})
