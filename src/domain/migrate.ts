import { SCHEMA_VERSION, exerciseSchema, projectFileSchema } from './schema'
import type { Exercise } from './types'

/**
 * Migra dados antigos para a versão atual do schema.
 * Hoje só existe a v1; novas versões devem adicionar passos aqui.
 */
function migrate(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const data = raw as {
    schemaVersion?: number
    objects?: Array<{ id: string; type: string; role?: string; position: { x: number; z: number } }>
    timeline?: { duration: number; keyframes: Record<string, unknown[]> }
  }
  if (data.schemaVersion === undefined) data.schemaVersion = 1

  // Se o exercício antigo carregado do IndexedDB não possuía timeline, gera animação para o aluno
  const keyframesMap = data.timeline?.keyframes ?? {}
  const hasKeyframes = Object.values(keyframesMap).some((arr) => Array.isArray(arr) && arr.length > 0)

  if (!hasKeyframes && Array.isArray(data.objects)) {
    const student =
      data.objects.find((o) => o.type === 'player' && o.role === 'student') ||
      data.objects.find((o) => o.type === 'player')

    if (student) {
      const cones = data.objects.filter((o) => o.type === 'cone')
      const coneFront = cones[0]?.position ?? { x: -1.8, z: 0 }
      const coneBack = cones[1]?.position ?? { x: -7.2, z: 0 }

      data.timeline = {
        duration: 8,
        keyframes: {
          [student.id]: [
            { id: 'k1', time: 0, position: { ...student.position }, rotation: 0 },
            { id: 'k2', time: 2.2, position: { ...coneFront }, rotation: 0, action: 'Cone Frente' },
            { id: 'k3', time: 5.0, position: { ...coneBack }, rotation: 0, action: 'Cone Fundo' },
            { id: 'k4', time: 7.5, position: { ...student.position }, rotation: 0, action: 'Base' },
            { id: 'k5', time: 8.0, position: { ...student.position }, rotation: 0 },
          ],
        },
      }
    }
  }

  return data
}

export class InvalidDataError extends Error {
  readonly details?: string
  constructor(message: string, details?: string) {
    super(message)
    this.name = 'InvalidDataError'
    this.details = details
  }
}

export function parseExercise(raw: unknown): Exercise {
  const result = exerciseSchema.safeParse(migrate(raw))
  if (!result.success) {
    throw new InvalidDataError('Dados do exercício inválidos.', result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'))
  }
  if (result.data.schemaVersion > SCHEMA_VERSION) {
    throw new InvalidDataError('Este arquivo foi criado por uma versão mais nova do Futevôlei Studio 3D.')
  }
  return result.data
}

export function parseProjectFile(text: string): Exercise {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new InvalidDataError('O arquivo não é um JSON válido.')
  }
  const envelope = projectFileSchema.safeParse(json)
  if (!envelope.success) {
    // Aceita também um exercício "cru", sem envelope.
    const maybeExercise = exerciseSchema.safeParse(migrate(json))
    if (maybeExercise.success) return maybeExercise.data
    throw new InvalidDataError(
      'O arquivo não parece ser um projeto do Futevôlei Studio 3D.',
      envelope.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'),
    )
  }
  return parseExercise(envelope.data.exercise)
}
