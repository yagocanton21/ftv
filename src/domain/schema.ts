import { z } from 'zod'

/**
 * Schemas zod = fonte única da verdade do modelo de dados.
 * Os tipos TypeScript são inferidos daqui (ver types.ts), e os mesmos
 * schemas validam dados vindos do IndexedDB e de JSON importado.
 */

export const SCHEMA_VERSION = 1

export const vec2Schema = z.object({ x: z.number(), z: z.number() })

const baseFields = {
  id: z.string().min(1),
  position: vec2Schema,
  /** Graus. 0 = olhando para +X (em direção à rede, a partir do lado esquerdo). */
  rotation: z.number(),
  color: z.string(),
  locked: z.boolean(),
  label: z.string().optional(),
}

export const playerSchema = z.object({
  ...baseFields,
  type: z.literal('player'),
  name: z.string(),
  number: z.number().int(),
  role: z.enum(['student', 'coach', 'other']),
  team: z.enum(['A', 'B']).nullable(),
})

export const ballSchema = z.object({
  ...baseFields,
  type: z.literal('ball'),
  /** Altura do centro da bola em metros (0 = apoiada na areia). */
  height: z.number().min(0).max(8),
})

export const coneSchema = z.object({ ...baseFields, type: z.literal('cone') })
export const hoopSchema = z.object({ ...baseFields, type: z.literal('hoop') })
export const markerSchema = z.object({ ...baseFields, type: z.literal('marker') })
export const obstacleSchema = z.object({ ...baseFields, type: z.literal('obstacle') })

export const zoneSchema = z.object({
  ...baseFields,
  type: z.literal('zone'),
  shape: z.enum(['rect', 'circle']),
  size: z.object({ w: z.number().positive(), d: z.number().positive() }),
})

export const sceneObjectSchema = z.discriminatedUnion('type', [
  playerSchema,
  ballSchema,
  coneSchema,
  hoopSchema,
  markerSchema,
  obstacleSchema,
  zoneSchema,
])

export const courtSchema = z.object({
  length: z.number().min(8).max(30),
  width: z.number().min(4).max(16),
  netHeight: z.number().min(1).max(3),
  margin: z.number().min(1).max(10),
  showGrid: z.boolean(),
})

export const LEVELS = ['beginner', 'intermediate', 'advanced'] as const
export const levelSchema = z.enum(LEVELS)

export const FUNDAMENTALS = [
  'deslocamento',
  'recepcao',
  'chapa',
  'peito',
  'cabeca',
  'ombro',
  'coxa',
  'pe',
  'levantamento',
  'ataque',
  'defesa',
  'saque',
  'posicionamento',
] as const
export const fundamentalSchema = z.enum(FUNDAMENTALS)

export const exerciseMetaSchema = z.object({
  objective: z.string(),
  fundamentals: z.array(fundamentalSchema),
  level: levelSchema,
  participantsMin: z.number().int().min(1),
  participantsMax: z.number().int().min(1),
  durationMin: z.number().min(0),
  sets: z.number().int().min(0),
  reps: z.number().int().min(0),
  restSec: z.number().min(0),
  extraMaterials: z.string(),
  instructions: z.string(),
  notes: z.string(),
})

export const keyframeSchema = z.object({
  id: z.string(),
  time: z.number().min(0),
  position: vec2Schema,
  rotation: z.number().optional(),
  height: z.number().optional(),
  action: z.string().optional(),
})

export const timelineSchema = z.object({
  duration: z.number().min(1).max(120),
  keyframes: z.record(z.string(), z.array(keyframeSchema)),
})

export const exerciseSchema = z.object({
  id: z.string().min(1),
  schemaVersion: z.number().int(),
  name: z.string(),
  meta: exerciseMetaSchema,
  court: courtSchema,
  objects: z.array(sceneObjectSchema),
  timeline: timelineSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

/** Envelope do arquivo .json exportado. */
export const projectFileSchema = z.object({
  app: z.literal('futevolei-studio-3d'),
  schemaVersion: z.number().int(),
  exportedAt: z.string(),
  exercise: exerciseSchema,
})
