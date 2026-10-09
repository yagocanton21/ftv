import { clamp, nowIso, uid } from '@/lib/utils'
import {
  DEFAULT_COLORS,
  DEFAULT_COURT,
  DEFAULT_META,
  OBJECT_LABELS,
  OBJECT_LABELS_PLURAL,
  TEAM_COLORS,
  playAreaBounds,
} from './constants'
import { SCHEMA_VERSION } from './schema'
import type { CourtSettings, Exercise, SceneObject, SceneObjectType, Vec2 } from './types'

export function clampToPlayArea(p: Vec2, court: CourtSettings): Vec2 {
  const b = playAreaBounds(court)
  return { x: clamp(p.x, b.minX, b.maxX), z: clamp(p.z, b.minZ, b.maxZ) }
}

/** Jogadores do lado esquerdo olham para a rede (+X); do lado direito, para -X. */
const facingNet = (x: number) => (x <= 0 ? 0 : 180)

export function createObject(type: SceneObjectType, position: Vec2, existing: SceneObject[]): SceneObject {
  const base = {
    id: uid(),
    position,
    rotation: 0,
    color: DEFAULT_COLORS[type],
    locked: false,
  }

  switch (type) {
    case 'player': {
      const players = existing.filter((o) => o.type === 'player')
      const number = players.reduce((max, p) => Math.max(max, p.number), 0) + 1
      const team = position.x <= 0 ? 'A' : 'B'
      return {
        ...base,
        type,
        rotation: facingNet(position.x),
        color: TEAM_COLORS[team],
        name: `Aluno ${number}`,
        number,
        role: 'student',
        team,
      }
    }
    case 'ball':
      return { ...base, type, height: 0.11 }
    case 'zone':
      return { ...base, type, shape: 'rect', size: { w: 2, d: 2 } }
    case 'cone':
    case 'hoop':
    case 'marker':
    case 'obstacle':
      return { ...base, type }
  }
}

/** Cópia profunda com novo id — garante que alterar a cópia não afete o original. */
export function cloneObject(obj: SceneObject, offset: Vec2 = { x: 0.6, z: 0.6 }): SceneObject {
  const copy = structuredClone(obj)
  copy.id = uid()
  copy.locked = false
  copy.position = { x: obj.position.x + offset.x, z: obj.position.z + offset.z }
  return copy
}

export function createExercise(name = 'Novo exercício'): Exercise {
  const now = nowIso()
  return {
    id: uid(),
    schemaVersion: SCHEMA_VERSION,
    name,
    meta: structuredClone(DEFAULT_META),
    court: structuredClone(DEFAULT_COURT),
    objects: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function duplicateExercise(ex: Exercise): Exercise {
  const now = nowIso()
  const copy = structuredClone(ex)
  copy.id = uid()
  copy.name = `${ex.name} (cópia)`
  copy.objects = copy.objects.map((o) => ({ ...o, id: uid() }))
  copy.createdAt = now
  copy.updatedAt = now
  return copy
}

/** Lista de materiais derivada da cena (jogadores não contam como material). */
export function materialsFromObjects(objects: SceneObject[]): string[] {
  const counts = new Map<SceneObjectType, number>()
  for (const o of objects) {
    if (o.type === 'player') continue
    counts.set(o.type, (counts.get(o.type) ?? 0) + 1)
  }
  return [...counts.entries()].map(([type, n]) =>
    n === 1 ? `1 ${OBJECT_LABELS[type].toLowerCase()}` : `${n} ${OBJECT_LABELS_PLURAL[type]}`,
  )
}
