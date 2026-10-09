import type { Exercise, Keyframe, SceneObject, Vec2 } from './types'
import { normalizeDeg } from '@/lib/utils'

export const ACTION_PRESETS = [
  { id: 'saque', label: '🚀 Saque', badge: 'Saque' },
  { id: 'recepcao', label: '🏐 Recepção', badge: 'Recepção' },
  { id: 'levantamento', label: '🌟 Levantamento', badge: 'Levantamento' },
  { id: 'ataque', label: '💥 Ataque (Shark)', badge: 'Ataque!' },
  { id: 'chapa', label: '👟 Chapa', badge: 'Chapa' },
  { id: 'peito', label: '🛡️ Peito', badge: 'Peito' },
  { id: 'cabeca', label: '🎯 Cabeça', badge: 'Cabeça' },
  { id: 'defesa', label: '🧤 Defesa', badge: 'Defesa' },
] as const

export interface CircuitPreset {
  id: string
  name: string
  description: string
  duration: number
  getKeyframes: (base: Vec2, cones: Vec2[]) => Keyframe[]
}

export const CIRCUIT_PRESETS: CircuitPreset[] = [
  {
    id: 'chapas-ataque',
    name: '2 Chapas + Peito + Ataque',
    description: 'Chapa esquerda no fundo, volta ao meio, chapa direita no fundo, amortece no peito e ataca.',
    duration: 13,
    getKeyframes: (base) => [
      { id: 'c1', time: 0, position: { ...base }, rotation: 0, action: 'Base Central' },
      { id: 'c2', time: 2.2, position: { x: -6.8, z: -2.5 }, rotation: 25, action: '👟 Chapa Esquerda' },
      { id: 'c3', time: 4.2, position: { ...base }, rotation: 0, action: 'Base Meio' },
      { id: 'c4', time: 6.5, position: { x: -6.8, z: 2.5 }, rotation: 335, action: '👟 Chapa Direita' },
      { id: 'c5', time: 8.5, position: { ...base }, rotation: 0, action: 'Base Meio' },
      { id: 'c6', time: 10.2, position: { x: -2.5, z: base.z }, rotation: 0, action: '🏐 Peito' },
      { id: 'c7', time: 11.5, position: { x: -1.3, z: base.z }, rotation: 0, action: '💥 Ataque!' },
      { id: 'c8', time: 13.0, position: { ...base }, rotation: 0, action: 'Base' },
    ],
  },
  {
    id: 'frente-costas',
    name: 'Frente e Costas',
    description: 'Arrancada rápida até a rede e retorno de costas mantendo a base baixa.',
    duration: 8,
    getKeyframes: (base, cones) => {
      const coneFront = cones[0] ?? { x: -1.8, z: base.z }
      const coneBack = cones[1] ?? { x: -7.2, z: base.z }
      return [
        { id: 'fc1', time: 0, position: { ...base }, rotation: 0 },
        { id: 'fc2', time: 2.2, position: { ...coneFront }, rotation: 0, action: 'Cone Frente' },
        { id: 'fc3', time: 5.0, position: { ...coneBack }, rotation: 0, action: 'Cone Fundo' },
        { id: 'fc4', time: 7.5, position: { ...base }, rotation: 0, action: 'Base' },
        { id: 'fc5', time: 8.0, position: { ...base }, rotation: 0 },
      ]
    },
  },
  {
    id: 'zigue-zague',
    name: 'Deslocamento Lateral',
    description: 'Passadas laterais cruzadas de base entre os dois lados da quadra.',
    duration: 8,
    getKeyframes: (base) => [
      { id: 'zz1', time: 0, position: { ...base }, rotation: 0 },
      { id: 'zz2', time: 2.0, position: { x: base.x, z: -2.8 }, rotation: 90, action: 'Lateral Esquerda' },
      { id: 'zz3', time: 4.5, position: { x: base.x, z: 2.8 }, rotation: 270, action: 'Lateral Direita' },
      { id: 'zz4', time: 7.0, position: { ...base }, rotation: 0, action: 'Base' },
      { id: 'zz5', time: 8.0, position: { ...base }, rotation: 0 },
    ],
  },
]

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Interpolação suave pelo caminho mais curto entre dois ângulos em graus
export function lerpAngleDeg(aDeg: number, bDeg: number, t: number): number {
  let diff = (bDeg - aDeg) % 360
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return normalizeDeg(aDeg + diff * t)
}

// Curva smoothstep para aceleração e desaceleração orgânica de corrida
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

export interface InterpolatedState {
  position: Vec2
  rotation: number
  height?: number
  action?: string
}

export function getInterpolatedState(
  obj: SceneObject,
  currentTime: number,
  keyframes: Keyframe[] | undefined,
): InterpolatedState {
  const defaultRotation = obj.rotation ?? 0
  const defaultHeight = obj.type === 'ball' ? obj.height : undefined

  if (!keyframes || keyframes.length === 0) {
    return {
      position: obj.position,
      rotation: defaultRotation,
      height: defaultHeight,
    }
  }

  // Ordena keyframes por tempo
  const sorted = [...keyframes].sort((a, b) => a.time - b.time)

  if (currentTime <= sorted[0].time) {
    const first = sorted[0]
    return {
      position: first.position,
      rotation: first.rotation ?? defaultRotation,
      height: first.height ?? defaultHeight,
      action: Math.abs(currentTime - first.time) < 0.5 ? first.action : undefined,
    }
  }

  const last = sorted[sorted.length - 1]
  if (currentTime >= last.time) {
    return {
      position: last.position,
      rotation: last.rotation ?? defaultRotation,
      height: last.height ?? defaultHeight,
      action: Math.abs(currentTime - last.time) < 0.5 ? last.action : undefined,
    }
  }

  // Encontra os keyframes anterior e posterior
  let prevIdx = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    if (currentTime >= sorted[i].time && currentTime <= sorted[i + 1].time) {
      prevIdx = i
      break
    }
  }

  const kPrev = sorted[prevIdx]
  const kNext = sorted[prevIdx + 1]

  const delta = kNext.time - kPrev.time
  const rawT = delta > 0.0001 ? (currentTime - kPrev.time) / delta : 0
  const t = smoothstep(rawT)

  const x = lerp(kPrev.position.x, kNext.position.x, t)
  const z = lerp(kPrev.position.z, kNext.position.z, t)

  const prevRot = kPrev.rotation ?? defaultRotation
  const nextRot = kNext.rotation ?? defaultRotation
  const rotation = lerpAngleDeg(prevRot, nextRot, t)

  // Altura: no caso de bola com dois pontos, adiciona arco parabólico
  let height = defaultHeight
  if (obj.type === 'ball' || kPrev.height !== undefined || kNext.height !== undefined) {
    const h0 = kPrev.height ?? 0.11
    const h1 = kNext.height ?? 0.11
    // Adiciona parábola de trajetória aérea se a distância for significativa
    const dist = Math.hypot(kNext.position.x - kPrev.position.x, kNext.position.z - kPrev.position.z)
    const apex = dist > 2 ? Math.max(h0, h1) + 1.2 : 0
    const arc = apex > 0 ? 4 * (apex - Math.min(h0, h1)) * rawT * (1 - rawT) : 0
    height = lerp(h0, h1, rawT) + arc
  }

  // Ação visual no momento do keyframe
  let action: string | undefined
  if (kPrev.action && currentTime - kPrev.time < 0.55) {
    action = kPrev.action
  } else if (kNext.action && kNext.time - currentTime < 0.35) {
    action = kNext.action
  }

  return {
    position: { x, z },
    rotation,
    height,
    action,
  }
}

export function ensureExerciseKeyframes(
  exercise: Exercise,
  onApplyKeyframes: (keyframesMap: Record<string, Keyframe[]>, duration?: number) => void,
): boolean {
  const currentObjectIds = new Set(exercise.objects.map((o) => o.id))
  const keyframesMap = exercise.timeline?.keyframes ?? {}
  const hasValidKeyframes = Object.entries(keyframesMap).some(
    ([id, arr]) => currentObjectIds.has(id) && Array.isArray(arr) && arr.length > 0,
  )
  if (hasValidKeyframes) return false

  const student =
    exercise.objects.find((o) => o.type === 'player' && o.role === 'student') ||
    exercise.objects.find((o) => o.type === 'player')
  if (!student) return false

  const cones = exercise.objects.filter((o) => o.type === 'cone')
  const sortedCones = [...cones].sort((a, b) => b.position.x - a.position.x)
  const coneFront = sortedCones[0]?.position ?? { x: -1.8, z: student.position.z }
  const coneBack = sortedCones[1]?.position ?? { x: -7.2, z: student.position.z }

  const studentKfs: Keyframe[] = [
    { id: 'k1', time: 0, position: { ...student.position }, rotation: 0 },
    { id: 'k2', time: 2.2, position: { ...coneFront }, rotation: 0, action: 'Cone Frente' },
    { id: 'k3', time: 5.0, position: { ...coneBack }, rotation: 0, action: 'Cone Fundo' },
    { id: 'k4', time: 7.5, position: { ...student.position }, rotation: 0, action: 'Base' },
    { id: 'k5', time: 8.0, position: { ...student.position }, rotation: 0 },
  ]

  const newKeyframes: Record<string, Keyframe[]> = {
    [student.id]: studentKfs,
  }

  const ball = exercise.objects.find((o) => o.type === 'ball')
  if (ball) {
    newKeyframes[ball.id] = [
      { id: 'kb1', time: 0, position: { ...ball.position }, rotation: 0, height: 0.11 },
      { id: 'kb2', time: 2.2, position: { ...coneFront }, rotation: 0, height: 1.8, action: 'Peito' },
      { id: 'kb3', time: 4.0, position: { x: -3.0, z: student.position.z }, rotation: 0, height: 3.2 },
      { id: 'kb4', time: 5.5, position: { ...coneBack }, rotation: 0, height: 1.7, action: 'Cabeça' },
      { id: 'kb5', time: 8.0, position: { ...ball.position }, rotation: 0, height: 0.11 },
    ]
  }

  onApplyKeyframes(newKeyframes, 8)
  return true
}
