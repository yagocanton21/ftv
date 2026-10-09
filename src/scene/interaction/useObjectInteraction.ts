import { useRef } from 'react'
import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { clampToPlayArea } from '@/domain/factories'
import type { SceneObject, Vec2 } from '@/domain/types'
import { useDocumentStore } from '@/store/documentStore'
import { setCameraEnabled } from '@/store/sceneRefs'
import { useUiStore, type Preview } from '@/store/uiStore'

const GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const MIN_DRAG_METERS = 0.03

/** Ponto de interseção do raio do ponteiro com o plano da areia (Y = 0). */
export function groundPoint(e: ThreeEvent<PointerEvent>): Vec2 | null {
  const hit = e.ray.intersectPlane(GROUND, new THREE.Vector3())
  return hit ? { x: hit.x, z: hit.z } : null
}

interface DragState {
  pointerId: number
  start: Vec2
  origins: Record<string, Vec2>
  moved: boolean
}

function snap(val: number, step = 0.5) {
  return Math.round(val / step) * step
}

function safeSetPointerCapture(e: ThreeEvent<PointerEvent>) {
  try {
    const el = (e.nativeEvent?.target as HTMLElement) || (e.target as unknown as HTMLElement)
    el?.setPointerCapture?.(e.pointerId)
  } catch {
    // ignore
  }
}

function safeReleasePointerCapture(e: ThreeEvent<PointerEvent>, pointerId: number) {
  try {
    const el = (e.nativeEvent?.target as HTMLElement) || (e.target as unknown as HTMLElement)
    el?.releasePointerCapture?.(pointerId)
  } catch {
    // ignore
  }
}

/**
 * Seleção + arraste de objetos sobre a areia.
 * - Durante o arraste só o preview (uiStore) muda; o documento recebe UM commit no soltar,
 *   gerando uma única entrada no histórico de desfazer.
 * - A câmera é desabilitada de forma síncrona no pointerdown.
 */
export function useObjectInteraction(obj: SceneObject) {
  const drag = useRef<DragState | null>(null)

  const end = (e: ThreeEvent<PointerEvent>, commit: boolean) => {
    const d = drag.current
    if (!d) return
    e.stopPropagation()
    safeReleasePointerCapture(e, d.pointerId)
    setCameraEnabled(true)
    const ui = useUiStore.getState()
    if (commit && d.moved) {
      const patches = Object.fromEntries(
        Object.entries(ui.preview)
          .filter(([, p]) => p.position)
          .map(([id, p]) => [id, { position: p.position! }]),
      )
      useDocumentStore.getState().updateObjects(patches)
    }
    ui.setPreview({})
    ui.setDragging(false)
    drag.current = null
  }

  return {
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      const ui = useUiStore.getState()
      // Com ferramenta de posicionamento ativa, o clique "atravessa" para a areia.
      if (ui.mode === 'present' || ui.tool !== 'select' || e.button !== 0) return
      e.stopPropagation()

      if (e.shiftKey) {
        ui.toggleSelect(obj.id)
        return
      }
      let selection = ui.selectedIds
      if (!selection.includes(obj.id)) {
        selection = [obj.id]
        ui.select(selection)
      }

      const { objects } = useDocumentStore.getState().exercise
      const movable = objects.filter((o) => selection.includes(o.id) && !o.locked)
      if (!movable.some((o) => o.id === obj.id)) return // bloqueado: só seleciona

      const start = groundPoint(e)
      if (!start) return
      setCameraEnabled(false)
      safeSetPointerCapture(e)
      drag.current = {
        pointerId: e.pointerId,
        start,
        origins: Object.fromEntries(movable.map((o) => [o.id, o.position])),
        moved: false,
      }
      ui.setDragging(true)
    },

    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      const d = drag.current
      if (!d) return
      e.stopPropagation()
      const p = groundPoint(e)
      if (!p) return
      const dx = p.x - d.start.x
      const dz = p.z - d.start.z
      if (!d.moved && Math.hypot(dx, dz) < MIN_DRAG_METERS) return
      d.moved = true
      const court = useDocumentStore.getState().exercise.court
      const ui = useUiStore.getState()
      const preview: Preview = {}
      for (const [id, o] of Object.entries(d.origins)) {
        let pos = clampToPlayArea({ x: o.x + dx, z: o.z + dz }, court)
        if (ui.snapToGrid) {
          pos = clampToPlayArea({ x: snap(pos.x, 0.5), z: snap(pos.z, 0.5) }, court)
        }
        preview[id] = { position: pos }
      }
      ui.setPreview(preview)
    },

    onPointerUp: (e: ThreeEvent<PointerEvent>) => end(e, true),
    onPointerCancel: (e: ThreeEvent<PointerEvent>) => end(e, false),

    // Sem isso o clique "vaza" para a areia e limpa a seleção.
    onClick: (e: ThreeEvent<MouseEvent>) => {
      if (useUiStore.getState().tool === 'select') e.stopPropagation()
    },

    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      useUiStore.getState().setHovered(obj.id)
    },
    onPointerOut: () => {
      const ui = useUiStore.getState()
      if (ui.hoveredId === obj.id) ui.setHovered(null)
    },
  }
}
