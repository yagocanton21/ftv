import type { CourtSettings, ExerciseMeta, Fundamental, Level, SceneObjectType } from './types'
export { FUNDAMENTALS } from './schema'

export const DEFAULT_COURT: CourtSettings = {
  length: 18,
  width: 9,
  netHeight: 2.2,
  margin: 4,
  showGrid: false,
}

export const NET_PRESETS = [
  { id: 'male', label: 'Masculino', height: 2.2 },
  { id: 'mixed', label: 'Misto', height: 2.1 },
  { id: 'female', label: 'Feminino', height: 2.0 },
] as const

export const DEFAULT_META: ExerciseMeta = {
  objective: '',
  fundamentals: [],
  level: 'beginner',
  participantsMin: 1,
  participantsMax: 2,
  durationMin: 10,
  sets: 3,
  reps: 10,
  restSec: 30,
  extraMaterials: '',
  instructions: '',
  notes: '',
}

export const OBJECT_LABELS: Record<SceneObjectType, string> = {
  player: 'Jogador',
  ball: 'Bola',
  cone: 'Cone',
  hoop: 'Arco',
  marker: 'Marcador',
  zone: 'Zona',
  obstacle: 'Obstáculo',
}

export const OBJECT_LABELS_PLURAL: Record<SceneObjectType, string> = {
  player: 'jogadores',
  ball: 'bolas',
  cone: 'cones',
  hoop: 'arcos',
  marker: 'marcadores',
  zone: 'zonas',
  obstacle: 'obstáculos',
}

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
}

export const FUNDAMENTAL_LABELS: Record<Fundamental, string> = {
  deslocamento: 'Deslocamento',
  recepcao: 'Recepção',
  chapa: 'Chapa',
  peito: 'Peito',
  cabeca: 'Cabeça',
  ombro: 'Ombro',
  coxa: 'Coxa',
  pe: 'Pé',
  levantamento: 'Levantamento',
  ataque: 'Ataque',
  defesa: 'Defesa',
  saque: 'Saque',
  posicionamento: 'Posicionamento',
}

export const ROLE_LABELS = {
  student: 'Aluno',
  coach: 'Professor',
  other: 'Outro',
} as const

export const COLOR_PALETTE = [
  '#38bdf8', // azul
  '#ff8a3d', // laranja
  '#c6f432', // lima
  '#f43f5e', // vermelho
  '#a78bfa', // roxo
  '#facc15', // amarelo
  '#2dd4bf', // turquesa
  '#f8fafc', // branco
  '#1f2937', // grafite
]

export const TEAM_COLORS = { A: '#38bdf8', B: '#ff8a3d', none: '#a78bfa', coach: '#c6f432' }

export const DEFAULT_COLORS: Record<SceneObjectType, string> = {
  player: TEAM_COLORS.A,
  ball: '#facc15',
  cone: '#ff8a3d',
  hoop: '#f43f5e',
  marker: '#facc15',
  zone: '#38bdf8',
  obstacle: '#f8fafc',
}

/** Limites da área de jogo (quadra + margem), em metros, com origem no centro. */
export function playAreaBounds(court: CourtSettings) {
  const hx = court.length / 2 + court.margin
  const hz = court.width / 2 + court.margin
  return { minX: -hx, maxX: hx, minZ: -hz, maxZ: hz }
}
