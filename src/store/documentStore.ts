import { create, useStore } from 'zustand'
import { temporal } from 'zundo'
import { clampToPlayArea, cloneObject, createExercise } from '@/domain/factories'
import type { CourtSettings, Exercise, ExerciseMeta, Keyframe, ObjectPatch, SceneObject } from '@/domain/types'
import { useSimulationStore } from './simulationStore'
import { nowIso } from '@/lib/utils'

/**
 * Store do DOCUMENTO (exercício aberto).
 * - É o que é persistido.
 * - É o que entra no histórico de desfazer/refazer (zundo).
 * Estado de interface (seleção, ferramenta, câmera) fica em uiStore.
 */
interface DocumentState {
  exercise: Exercise
  /** Substitui o exercício aberto e zera o histórico. */
  load: (exercise: Exercise) => void
  rename: (name: string) => void
  updateMeta: (patch: Partial<ExerciseMeta>) => void
  updateCourt: (patch: Partial<CourtSettings>) => void
  addObject: (obj: SceneObject) => void
  updateObject: (id: string, patch: ObjectPatch) => void
  /** Atualiza vários objetos numa única entrada do histórico (ex.: fim de um arraste). */
  updateObjects: (patches: Record<string, ObjectPatch>) => void
  /** Remove objetos não bloqueados. Retorna quantos foram removidos. */
  removeObjects: (ids: string[]) => number
  /** Duplica objetos e retorna os novos ids. */
  duplicateObjects: (ids: string[]) => string[]
  /** Define keyframes para múltiplos objetos de uma só vez e opcionalmente ajusta a duração */
  setKeyframesForExercise: (keyframes: Record<string, Keyframe[]>, duration?: number) => void
  /** Adiciona ou atualiza keyframe de um objeto na timeline */
  addOrUpdateKeyframe: (objectId: string, keyframe: Keyframe) => void
  /** Remove um keyframe */
  removeKeyframe: (objectId: string, keyframeId: string) => void
  /** Zera todos os pontos de gravação de um objeto ou de todos os objetos */
  clearKeyframes: (objectId?: string) => void
  /** Ajusta a duração da timeline */
  setTimelineDuration: (duration: number) => void
}

const touch = (ex: Exercise, changes: Partial<Exercise>): Exercise => ({ ...ex, ...changes, updatedAt: nowIso() })

const applyPatch = (obj: SceneObject, patch: ObjectPatch, court: CourtSettings): SceneObject => {
  const next = { ...obj, ...patch } as SceneObject
  if (patch.position) next.position = clampToPlayArea(patch.position, court)
  return next
}

export const useDocumentStore = create<DocumentState>()(
  temporal(
    (set, get) => ({
      exercise: createExercise(),

      load: (exercise) => {
        // Se o exercício não tem keyframes válidos para os objetos da quadra, sintetiza animação
        const currentObjectIds = new Set(exercise.objects.map((o) => o.id))
        const keyframesMap = exercise.timeline?.keyframes ?? {}
        const hasValidKeyframes = Object.entries(keyframesMap).some(
          ([id, arr]) => currentObjectIds.has(id) && Array.isArray(arr) && arr.length > 0,
        )

        let finalEx = exercise
        if (!hasValidKeyframes) {
          const student =
            exercise.objects.find((o) => o.type === 'player' && o.role === 'student') ||
            exercise.objects.find((o) => o.type === 'player')

          if (student) {
            const cones = exercise.objects.filter((o) => o.type === 'cone')
            const sortedCones = [...cones].sort((a, b) => b.position.x - a.position.x)
            const coneFront = sortedCones[0]?.position ?? { x: -1.8, z: student.position.z }
            const coneBack = sortedCones[1]?.position ?? { x: -7.2, z: student.position.z }

            finalEx = {
              ...exercise,
              timeline: {
                duration: 8,
                keyframes: {
                  ...keyframesMap,
                  [student.id]: [
                    { id: 'k1', time: 0, position: { ...student.position }, rotation: 0 },
                    { id: 'k2', time: 2.2, position: { ...coneFront }, rotation: 0, action: 'Cone Frente' },
                    { id: 'k3', time: 5.0, position: { ...coneBack }, rotation: 0, action: 'Cone Fundo' },
                    { id: 'k4', time: 7.5, position: { ...student.position }, rotation: 0, action: 'Base' },
                    { id: 'k5', time: 8.0, position: { ...student.position }, rotation: 0 },
                  ],
                },
              },
            }
          }
        }

        set({ exercise: finalEx })
        useDocumentStore.temporal.getState().clear()
        useSimulationStore.getState().setDuration(finalEx.timeline?.duration ?? 8)
        useSimulationStore.getState().reset()
      },

      rename: (name) => set((s) => ({ exercise: touch(s.exercise, { name }) })),

      updateMeta: (patch) =>
        set((s) => ({ exercise: touch(s.exercise, { meta: { ...s.exercise.meta, ...patch } }) })),

      updateCourt: (patch) =>
        set((s) => {
          const court = { ...s.exercise.court, ...patch }
          // Se a quadra encolheu, traz objetos de volta para a área de jogo.
          const objects = s.exercise.objects.map((o) => ({ ...o, position: clampToPlayArea(o.position, court) }))
          return { exercise: touch(s.exercise, { court, objects }) }
        }),

      addObject: (obj) =>
        set((s) => ({
          exercise: touch(s.exercise, {
            objects: [...s.exercise.objects, { ...obj, position: clampToPlayArea(obj.position, s.exercise.court) }],
          }),
        })),

      updateObject: (id, patch) => get().updateObjects({ [id]: patch }),

      updateObjects: (patches) =>
        set((s) => ({
          exercise: touch(s.exercise, {
            objects: s.exercise.objects.map((o) => (patches[o.id] ? applyPatch(o, patches[o.id], s.exercise.court) : o)),
          }),
        })),

      removeObjects: (ids) => {
        const idSet = new Set(ids)
        const before = get().exercise.objects
        const after = before.filter((o) => !idSet.has(o.id) || o.locked)
        const removed = before.length - after.length
        if (removed > 0) set((s) => ({ exercise: touch(s.exercise, { objects: after }) }))
        return removed
      },

      duplicateObjects: (ids) => {
        const { objects, court } = get().exercise
        const copies = objects
          .filter((o) => ids.includes(o.id))
          .map((o) => {
            const c = cloneObject(o)
            c.position = clampToPlayArea(c.position, court)
            return c
          })
        // Numeração sequencial correta quando vários jogadores são duplicados juntos.
        let next = objects.reduce((m, p) => (p.type === 'player' ? Math.max(m, p.number) : m), 0)
        for (const c of copies) {
          if (c.type !== 'player') continue
          c.number = ++next
          if (/^Aluno \d+$/.test(c.name)) c.name = `Aluno ${c.number}`
        }
        if (copies.length) set((s) => ({ exercise: touch(s.exercise, { objects: [...s.exercise.objects, ...copies] }) }))
        return copies.map((c) => c.id)
      },

      setKeyframesForExercise: (keyframes, duration) =>
        set((s) => {
          const currentTimeline = s.exercise.timeline ?? { duration: 8, keyframes: {} }
          return {
            exercise: touch(s.exercise, {
              timeline: {
                duration: duration ?? currentTimeline.duration,
                keyframes: {
                  ...currentTimeline.keyframes,
                  ...keyframes,
                },
              },
            }),
          }
        }),

      addOrUpdateKeyframe: (objectId, keyframe) =>
        set((s) => {
          const currentTimeline = s.exercise.timeline ?? { duration: 10, keyframes: {} }
          const existing = currentTimeline.keyframes[objectId] ?? []
          const filtered = existing.filter((k) => k.id !== keyframe.id && Math.abs(k.time - keyframe.time) > 0.05)
          const nextKeyframes = [...filtered, keyframe].sort((a, b) => a.time - b.time)

          return {
            exercise: touch(s.exercise, {
              timeline: {
                ...currentTimeline,
                keyframes: {
                  ...currentTimeline.keyframes,
                  [objectId]: nextKeyframes,
                },
              },
            }),
          }
        }),

      removeKeyframe: (objectId, keyframeId) =>
        set((s) => {
          if (!s.exercise.timeline) return s
          const existing = s.exercise.timeline.keyframes[objectId] ?? []
          return {
            exercise: touch(s.exercise, {
              timeline: {
                ...s.exercise.timeline,
                keyframes: {
                  ...s.exercise.timeline.keyframes,
                  [objectId]: existing.filter((k) => k.id !== keyframeId),
                },
              },
            }),
          }
        }),

      clearKeyframes: (objectId) =>
        set((s) => {
          if (!s.exercise.timeline) return s
          if (objectId) {
            return {
              exercise: touch(s.exercise, {
                timeline: {
                  ...s.exercise.timeline,
                  keyframes: {
                    ...s.exercise.timeline.keyframes,
                    [objectId]: [],
                  },
                },
              }),
            }
          }
          return {
            exercise: touch(s.exercise, {
              timeline: {
                ...s.exercise.timeline,
                keyframes: {},
              },
            }),
          }
        }),

      setTimelineDuration: (duration) =>
        set((s) => {
          const currentTimeline = s.exercise.timeline ?? { duration: 10, keyframes: {} }
          return {
            exercise: touch(s.exercise, {
              timeline: { ...currentTimeline, duration: Math.max(1, duration) },
            }),
          }
        }),
    }),
    {
      partialize: (s) => ({ exercise: s.exercise }),
      limit: 150,
      equality: (a, b) => a.exercise === b.exercise,
    },
  ),
)

/** Hook reativo para o histórico (botões desfazer/refazer). */
export function useHistory() {
  const canUndo = useStore(useDocumentStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useDocumentStore.temporal, (s) => s.futureStates.length > 0)
  const { undo, redo } = useDocumentStore.temporal.getState()
  return { canUndo, canRedo, undo: () => undo(), redo: () => redo() }
}
