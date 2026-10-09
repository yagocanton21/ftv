import type { z } from 'zod'
import type {
  ballSchema,
  courtSchema,
  exerciseMetaSchema,
  exerciseSchema,
  fundamentalSchema,
  levelSchema,
  playerSchema,
  keyframeSchema,
  sceneObjectSchema,
  timelineSchema,
  vec2Schema,
  zoneSchema,
} from './schema'

export type Vec2 = z.infer<typeof vec2Schema>
export type PlayerObject = z.infer<typeof playerSchema>
export type BallObject = z.infer<typeof ballSchema>
export type ZoneObject = z.infer<typeof zoneSchema>
export type SceneObject = z.infer<typeof sceneObjectSchema>
export type SceneObjectType = SceneObject['type']
export type CourtSettings = z.infer<typeof courtSchema>
export type Level = z.infer<typeof levelSchema>
export type Fundamental = z.infer<typeof fundamentalSchema>
export type ExerciseMeta = z.infer<typeof exerciseMetaSchema>
export type Exercise = z.infer<typeof exerciseSchema>
export type Keyframe = z.infer<typeof keyframeSchema>
export type Timeline = z.infer<typeof timelineSchema>

type Editable<T> = Partial<Omit<T, 'id' | 'type'>>

/** Patch aceito por qualquer tipo de objeto (campos inexistentes são ignorados na prática). */
export type ObjectPatch = Editable<PlayerObject> & Editable<BallObject> & Editable<ZoneObject>

export type Tool = 'select' | SceneObjectType

export type CameraPreset = 'top' | 'iso' | 'side' | 'end' | 'free'
