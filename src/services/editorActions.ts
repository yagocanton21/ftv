import { toast } from 'sonner'
import { createObject } from '@/domain/factories'
import type { SceneObjectType, Vec2 } from '@/domain/types'
import { normalizeDeg } from '@/lib/utils'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'

/** Ações de edição de objetos usadas pela cena, painéis e atalhos de teclado. */

const doc = () => useDocumentStore.getState()
const ui = () => useUiStore.getState()

const selectedExisting = () => {
  const ids = new Set(ui().selectedIds)
  return doc().exercise.objects.filter((o) => ids.has(o.id))
}

export function placeObject(type: SceneObjectType, position: Vec2) {
  const obj = createObject(type, position, doc().exercise.objects)
  doc().addObject(obj)
  ui().select([obj.id])
  ui().setTool('select')
  return obj.id
}

export function deleteSelected() {
  const sel = selectedExisting()
  if (!sel.length) return
  const removed = doc().removeObjects(sel.map((o) => o.id))
  const lockedCount = sel.length - removed
  if (lockedCount > 0) toast.warning(`${lockedCount} objeto(s) bloqueado(s) não foram excluídos`)
  ui().select(sel.filter((o) => o.locked).map((o) => o.id))
}

export function duplicateSelected() {
  const sel = selectedExisting()
  if (!sel.length) return
  const ids = doc().duplicateObjects(sel.map((o) => o.id))
  ui().select(ids)
}

export function rotateSelected(deltaDeg: number) {
  const sel = selectedExisting().filter((o) => !o.locked)
  if (!sel.length) return
  doc().updateObjects(Object.fromEntries(sel.map((o) => [o.id, { rotation: normalizeDeg(o.rotation + deltaDeg) }])))
}

export function toggleLockSelected() {
  const sel = selectedExisting()
  if (!sel.length) return
  const lock = !sel.every((o) => o.locked)
  doc().updateObjects(Object.fromEntries(sel.map((o) => [o.id, { locked: lock }])))
  toast.message(lock ? 'Objeto(s) bloqueado(s)' : 'Objeto(s) desbloqueado(s)')
}

export function selectAll() {
  ui().select(doc().exercise.objects.map((o) => o.id))
}

export function activateTool(tool: SceneObjectType | 'select') {
  // Clicar de novo na ferramenta ativa volta para "Selecionar".
  ui().setTool(ui().tool === tool ? 'select' : tool)
}
