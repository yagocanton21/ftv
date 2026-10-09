import { toast } from 'sonner'
import { createExercise, duplicateExercise } from '@/domain/factories'
import { InvalidDataError, parseProjectFile } from '@/domain/migrate'
import { SCHEMA_VERSION } from '@/domain/schema'
import type { Exercise } from '@/domain/types'
import { useDocumentStore } from '@/store/documentStore'
import { sceneRefs } from '@/store/sceneRefs'
import { useUiStore } from '@/store/uiStore'
import { downloadBlob, downloadDataUrl, nowIso, slugify, uid } from '@/lib/utils'
import { storage } from './storage'

/**
 * Ações de projeto: coordenam document store, UI store e storage.
 * Mantidas fora dos componentes para serem reutilizadas por menus e atalhos.
 */

const current = () => useDocumentStore.getState().exercise

function errorMessage(err: unknown) {
  if (err instanceof InvalidDataError) return { title: err.message, description: err.details }
  if (err instanceof Error) return { title: err.message }
  return { title: 'Erro inesperado.' }
}

export async function saveNow(silent = false) {
  const ui = useUiStore.getState()
  ui.setSaveStatus('saving')
  try {
    const ex = current()
    await storage.save(ex)
    await storage.setLastOpenedId(ex.id)
    ui.setSaveStatus('saved', nowIso())
    if (!silent) toast.success('Projeto salvo')
  } catch (err) {
    ui.setSaveStatus('error')
    toast.error('Não foi possível salvar o projeto', { description: errorMessage(err).title })
  }
}

async function openExercise(ex: Exercise) {
  const ui = useUiStore.getState()
  ui.clearSelection()
  ui.setTool('select')
  useDocumentStore.getState().load(ex)
  await storage.save(ex)
  await storage.setLastOpenedId(ex.id)
  ui.setSaveStatus('saved', nowIso())
}

export async function newProject() {
  await saveNow(true)
  await openExercise(createExercise())
  toast.success('Novo exercício criado')
}

export async function openProject(id: string) {
  if (id === current().id) return
  try {
    await saveNow(true)
    const ex = await storage.get(id)
    if (!ex) throw new Error('Projeto não encontrado.')
    await openExercise(ex)
  } catch (err) {
    toast.error('Não foi possível abrir o projeto', { description: errorMessage(err).title })
  }
}

export async function duplicateCurrent() {
  await saveNow(true)
  await openExercise(duplicateExercise(current()))
  toast.success('Cópia criada e aberta')
}

export async function deleteCurrent() {
  const ex = current()
  if (!window.confirm(`Excluir o projeto "${ex.name}"? Esta ação não pode ser desfeita.`)) return
  await storage.remove(ex.id)
  const remaining = await storage.list()
  const next = remaining[0] ? await storage.get(remaining[0].id) : null
  await openExercise(next ?? createExercise())
  toast.success('Projeto excluído')
}

export function exportJson() {
  const ex = current()
  const payload = { app: 'futevolei-studio-3d', schemaVersion: SCHEMA_VERSION, exportedAt: nowIso(), exercise: ex }
  downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), `${slugify(ex.name)}.fs3d.json`)
  toast.success('JSON exportado')
}

export async function importJsonFile(file: File) {
  try {
    const ex = parseProjectFile(await file.text())
    // Novo id para nunca sobrescrever um projeto existente.
    ex.id = uid()
    ex.updatedAt = nowIso()
    await saveNow(true)
    await openExercise(ex)
    toast.success(`"${ex.name}" importado`)
  } catch (err) {
    const { title, description } = errorMessage(err)
    toast.error(title, { description })
  }
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()))

export async function exportPng() {
  const gl = sceneRefs.gl
  if (!gl) {
    toast.error('A cena 3D ainda não está pronta.')
    return
  }
  const ui = useUiStore.getState()
  const prevSelection = ui.selectedIds
  // Remove indicadores de seleção da imagem.
  ui.clearSelection()
  ui.setHovered(null)
  sceneRefs.invalidate?.()
  await nextFrame()
  await nextFrame()
  try {
    const url = gl.domElement.toDataURL('image/png')
    downloadDataUrl(url, `${slugify(current().name)}.png`)
    toast.success('Imagem PNG exportada')
  } catch (err) {
    toast.error('Falha ao exportar imagem', { description: errorMessage(err).title })
  } finally {
    ui.select(prevSelection)
  }
}
