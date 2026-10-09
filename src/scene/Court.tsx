import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { playAreaBounds } from '@/domain/constants'
import { clampToPlayArea } from '@/domain/factories'
import type { CourtSettings } from '@/domain/types'
import { placeObject } from '@/services/editorActions'
import { useUiStore } from '@/store/uiStore'
import { getNetTexture, getSandTextures } from './textures'

const LINE_W = 0.05
const LINE_COLOR = '#1859d6' // Azul royal clássico oficial de futevôlei
const BORDER_WOOD_COLOR = '#4a3321' // Madeira escura de contenção da caixa de areia

/** Distância em px acima da qual um clique é considerado arraste de câmera. */
const CLICK_TOLERANCE = 5

function Ground({ court }: { court: CourtSettings }) {
  const { map, normalMap, roughnessMap } = useMemo(() => {
    const texs = getSandTextures()
    const m = texs.map.clone()
    const n = texs.normalMap.clone()
    const r = texs.roughnessMap.clone()

    // Escala natural: 1 repetição a cada ~3.5 metros para preservar grânulos e ondas de areia
    const repX = (court.length + court.margin * 2 + 2) / 3.5
    const repZ = (court.width + court.margin * 2 + 2) / 3.5

    m.repeat.set(repX, repZ)
    n.repeat.set(repX, repZ)
    r.repeat.set(repX, repZ)

    m.needsUpdate = true
    n.needsUpdate = true
    r.needsUpdate = true

    return { map: m, normalMap: n, roughnessMap: r }
  }, [court.length, court.width, court.margin])

  const ghost = useRef<THREE.Mesh>(null)
  const invalidate = useThree((s) => s.invalidate)
  const tool = useUiStore((s) => s.tool)
  const placing = tool !== 'select'

  // Dimensões da caixa de areia da arena (área de jogo + margem de segurança)
  const pitWidth = court.length + court.margin * 2 + 2
  const pitDepth = court.width + court.margin * 2 + 2

  const handleGroundAction = (point: { x: number; z: number }) => {
    const ui = useUiStore.getState()
    if (ui.recordingPlayerId) {
      const pt = clampToPlayArea(point, court)
      ui.setPendingStepPoint(pt)
      return true
    }
    return false
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    const ui = useUiStore.getState()

    if (ui.recordingPlayerId) {
      e.stopPropagation()
      handleGroundAction({ x: e.point.x, z: e.point.z })
      return
    }

    if (e.delta > CLICK_TOLERANCE) return
    e.stopPropagation()

    if (ui.tool !== 'select') {
      placeObject(ui.tool, clampToPlayArea({ x: e.point.x, z: e.point.z }, court))
    } else if (!e.shiftKey) {
      ui.clearSelection()
    }
  }

  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return
    const ui = useUiStore.getState()
    if (ui.recordingPlayerId) {
      e.stopPropagation()
      handleGroundAction({ x: e.point.x, z: e.point.z })
    }
  }

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!ghost.current) return
    const p = clampToPlayArea({ x: e.point.x, z: e.point.z }, court)
    ghost.current.position.set(p.x, 0.03, p.z)
    invalidate()
  }

  return (
    <group>
      {/* 1. Solo externo da Arena (praia / orla ensolarada) */}
      <mesh
        position-y={-0.01}
        rotation-x={-Math.PI / 2}
        receiveShadow
        onClick={onClick}
        onPointerUp={onPointerUp}
      >
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#cbb89d" roughness={0.92} metalness={0.0} />
      </mesh>

      {/* 2. Caixa de Areia Realista */}
      <mesh
        position-y={0.01}
        rotation-x={-Math.PI / 2}
        receiveShadow
        onClick={onClick}
        onPointerUp={onPointerUp}
        onPointerMove={placing ? onMove : undefined}
      >
        <planeGeometry args={[pitWidth, pitDepth, 64, 64]} />
        <meshStandardMaterial
          map={map}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          roughnessMap={roughnessMap}
          roughness={0.94}
          metalness={0.0}
        />
      </mesh>

      {/* 3. Borda de contenção da caixa de areia (estilo arena moderna) */}
      <group position-y={0.02}>
        {/* Superior e Inferior */}
        <mesh position={[0, 0, -pitDepth / 2]} castShadow receiveShadow>
          <boxGeometry args={[pitWidth + 0.3, 0.05, 0.25]} />
          <meshStandardMaterial color={BORDER_WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, pitDepth / 2]} castShadow receiveShadow>
          <boxGeometry args={[pitWidth + 0.3, 0.05, 0.25]} />
          <meshStandardMaterial color={BORDER_WOOD_COLOR} roughness={0.7} />
        </mesh>
        {/* Laterais */}
        <mesh position={[-pitWidth / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.05, pitDepth]} />
          <meshStandardMaterial color={BORDER_WOOD_COLOR} roughness={0.7} />
        </mesh>
        <mesh position={[pitWidth / 2, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.05, pitDepth]} />
          <meshStandardMaterial color={BORDER_WOOD_COLOR} roughness={0.7} />
        </mesh>
      </group>

      {/* Fantasma visual durante posicionamento de novos objetos */}
      {placing && (
        <mesh ref={ghost} rotation-x={-Math.PI / 2} position-y={0.03} raycast={() => null}>
          <ringGeometry args={[0.3, 0.42, 40]} />
          <meshBasicMaterial color="#c6f432" transparent opacity={0.85} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}

function CourtLines({ court }: { court: CourtSettings }) {
  const { length: L, width: W } = court
  const y = 0.02
  const bands: { pos: [number, number, number]; size: [number, number] }[] = [
    { pos: [0, y, -W / 2], size: [L + LINE_W, LINE_W] },
    { pos: [0, y, W / 2], size: [L + LINE_W, LINE_W] },
    { pos: [-L / 2, y, 0], size: [LINE_W, W + LINE_W] },
    { pos: [L / 2, y, 0], size: [LINE_W, W + LINE_W] },
  ]
  return (
    <group>
      {bands.map((b, i) => (
        <mesh key={i} position={b.pos} rotation-x={-Math.PI / 2} receiveShadow raycast={() => null}>
          <planeGeometry args={b.size} />
          <meshStandardMaterial color={LINE_COLOR} roughness={0.5} />
        </mesh>
      ))}
      {/* Linha sob a rede */}
      <mesh position={[0, y, 0]} rotation-x={-Math.PI / 2} raycast={() => null}>
        <planeGeometry args={[LINE_W * 0.5, W]} />
        <meshStandardMaterial color={LINE_COLOR} transparent opacity={0.4} />
      </mesh>
    </group>
  )
}

function PlayAreaOutline({ court }: { court: CourtSettings }) {
  const b = playAreaBounds(court)
  const y = 0.022
  const pts: [number, number, number][] = [
    [b.minX, y, b.minZ],
    [b.maxX, y, b.minZ],
    [b.maxX, y, b.maxZ],
    [b.minX, y, b.maxZ],
    [b.minX, y, b.minZ],
  ]
  return (
    <Line
      points={pts}
      color="#103623"
      transparent
      opacity={0.35}
      lineWidth={1.2}
      dashed
      dashSize={0.5}
      gapSize={0.4}
      raycast={() => null}
    />
  )
}

function GridLines({ court }: { court: CourtSettings }) {
  const geometry = useMemo(() => {
    const b = playAreaBounds(court)
    const pts: number[] = []
    const y = 0.021
    for (let x = Math.ceil(b.minX); x <= Math.floor(b.maxX); x++) pts.push(x, y, b.minZ, x, y, b.maxZ)
    for (let z = Math.ceil(b.minZ); z <= Math.floor(b.maxZ); z++) pts.push(b.minX, y, z, b.maxX, y, z)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [court])
  return (
    <lineSegments geometry={geometry} raycast={() => null}>
      <lineBasicMaterial color="#7a5e38" transparent opacity={0.2} depthWrite={false} />
    </lineSegments>
  )
}

function Net({ court }: { court: CourtSettings }) {
  const { width: W, netHeight: H } = court
  const netWidth = W + 1
  const netDepth = 1
  const postZ = netWidth / 2 + 0.15
  const tex = useMemo(() => {
    const t = getNetTexture().clone()
    t.repeat.set(netWidth / 0.1, netDepth / 0.1)
    t.needsUpdate = true
    return t
  }, [netWidth])

  return (
    <group raycast={() => null}>
      {/* Malha da rede */}
      <mesh position={[0, H - netDepth / 2, 0]} rotation-y={Math.PI / 2} castShadow raycast={() => null}>
        <planeGeometry args={[netWidth, netDepth]} />
        <meshStandardMaterial map={tex} color="#18181b" transparent alphaTest={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Faixa superior (branca com reforço) */}
      <mesh position={[0, H - 0.035, 0]} castShadow raycast={() => null}>
        <boxGeometry args={[0.02, 0.07, netWidth]} />
        <meshStandardMaterial color="#fafaf9" roughness={0.3} />
      </mesh>
      {/* Faixa inferior */}
      <mesh position={[0, H - netDepth + 0.02, 0]} raycast={() => null}>
        <boxGeometry args={[0.015, 0.04, netWidth]} />
        <meshStandardMaterial color="#fafaf9" roughness={0.4} />
      </mesh>
      {/* Postes */}
      {[-postZ, postZ].map((z) => (
        <mesh key={z} position={[0, (H + 0.25) / 2, z]} castShadow raycast={() => null}>
          <cylinderGeometry args={[0.05, 0.05, H + 0.25, 20]} />
          <meshStandardMaterial color="#d4d4d8" metalness={0.65} roughness={0.3} />
        </mesh>
      ))}
      {/* Antenas vermelhas oficiais */}
      {[-W / 2, W / 2].map((z) => (
        <mesh key={`a${z}`} position={[0, H + 0.4, z]} raycast={() => null}>
          <cylinderGeometry args={[0.01, 0.01, 0.8, 12]} />
          <meshStandardMaterial color="#ef4444" roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

export function Court({ court }: { court: CourtSettings }) {
  return (
    <group>
      <Ground court={court} />
      <CourtLines court={court} />
      <PlayAreaOutline court={court} />
      {court.showGrid && <GridLines court={court} />}
      <Net court={court} />
    </group>
  )
}
