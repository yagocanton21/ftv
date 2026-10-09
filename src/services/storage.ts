import { createStore, del, get, set, values } from 'idb-keyval'
import { parseExercise } from '@/domain/migrate'
import type { Exercise } from '@/domain/types'

export interface ProjectSummary {
  id: string
  name: string
  updatedAt: string
  objectCount: number
}

/**
 * Contrato de persistência. Hoje: IndexedDB.
 * Futuro: ApiStorageAdapter (FastAPI + PostgreSQL) com a mesma interface.
 */
export interface StorageAdapter {
  list(): Promise<ProjectSummary[]>
  get(id: string): Promise<Exercise | null>
  save(exercise: Exercise): Promise<void>
  remove(id: string): Promise<void>
  getLastOpenedId(): Promise<string | null>
  setLastOpenedId(id: string): Promise<void>
}

class IndexedDbStorage implements StorageAdapter {
  private projects = createStore('fs3d-projects', 'projects')
  private meta = createStore('fs3d-meta', 'meta')

  async list() {
    const all = await values<unknown>(this.projects)
    const summaries: ProjectSummary[] = []
    for (const raw of all) {
      try {
        const ex = parseExercise(raw)
        summaries.push({ id: ex.id, name: ex.name, updatedAt: ex.updatedAt, objectCount: ex.objects.length })
      } catch (err) {
        console.warn('[storage] projeto inválido ignorado', err)
      }
    }
    return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async get(id: string) {
    const raw = await get<unknown>(id, this.projects)
    if (!raw) return null
    return parseExercise(raw)
  }

  async save(exercise: Exercise) {
    await set(exercise.id, exercise, this.projects)
  }

  async remove(id: string) {
    await del(id, this.projects)
  }

  async getLastOpenedId() {
    return (await get<string>('lastOpenedId', this.meta)) ?? null
  }

  async setLastOpenedId(id: string) {
    await set('lastOpenedId', id, this.meta)
  }
}

export const storage: StorageAdapter = new IndexedDbStorage()
