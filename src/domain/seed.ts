import { uid } from '@/lib/utils'
import { TEAM_COLORS } from './constants'
import { createExercise } from './factories'
import type { Exercise } from './types'

/** Exercício 1: Frente e costas (corrida de base com cones). */
export function seedFrenteECostas(): Exercise {
  const ex = createExercise('Frente e costas')
  ex.meta = {
    ...ex.meta,
    objective: 'Desenvolver o deslocamento frontal e de costas mantendo a base baixa e o olhar na rede.',
    fundamentals: ['deslocamento', 'posicionamento'],
    level: 'beginner',
    participantsMin: 1,
    participantsMax: 4,
    durationMin: 10,
    sets: 3,
    reps: 10,
    restSec: 30,
    instructions:
      '1. Aluno inicia no marcador central, em base.\n2. Desloca-se de frente com passos curtos até tocar o cone da rede.\n3. Retorna de costas até o cone do fundo sem cruzar as pernas.\n4. Volta ao centro e recomeça o ciclo.',
    notes: 'Atenção aos joelhos flexionados e peso concentrado na ponta dos pés na areia.',
  }

  const alunoId = uid()
  const coachId = uid()

  ex.objects = [
    {
      id: alunoId,
      type: 'player',
      position: { x: -4.5, z: 0 },
      rotation: 0,
      color: TEAM_COLORS.A,
      locked: false,
      name: 'Aluno 1',
      number: 1,
      role: 'student',
      team: 'A',
    },
    { id: uid(), type: 'cone', position: { x: -1.5, z: 0 }, rotation: 0, color: '#ff8a3d', locked: false },
    { id: uid(), type: 'cone', position: { x: -7.5, z: 0 }, rotation: 0, color: '#ff8a3d', locked: false },
    {
      id: coachId,
      type: 'player',
      position: { x: -3.5, z: 3 },
      rotation: 270,
      color: TEAM_COLORS.coach,
      locked: false,
      name: 'Professor',
      number: 0,
      role: 'coach',
      team: null,
    },
  ]

  // Keyframes de simulação suave
  ex.timeline = {
    duration: 8,
    keyframes: {
      [alunoId]: [
        { id: uid(), time: 0, position: { x: -4.5, z: 0 }, rotation: 0 },
        { id: uid(), time: 2.2, position: { x: -1.8, z: 0 }, rotation: 0, action: 'Cone Frente' },
        { id: uid(), time: 5.0, position: { x: -7.2, z: 0 }, rotation: 0, action: 'Cone Fundo' },
        { id: uid(), time: 7.5, position: { x: -4.5, z: 0 }, rotation: 0, action: 'Base' },
        { id: uid(), time: 8.0, position: { x: -4.5, z: 0 }, rotation: 0 },
      ],
    },
  }

  return ex
}

/** Exercício 2: Recepção, Levantamento e Ataque de Cabeça com trajetória da bola. */
export function seedAtaqueCompleto(): Exercise {
  const ex = createExercise('Recepção, Levantamento e Ataque de Cabeça')
  ex.meta = {
    ...ex.meta,
    objective: 'Simular a sequência ofensiva clássica do futevôlei: saque adversário, recepção perfeita, levantamento alto na rede e finalização com ataque de cabeça.',
    fundamentals: ['recepcao', 'levantamento', 'ataque', 'peito', 'chapa'],
    level: 'intermediate',
    participantsMin: 2,
    participantsMax: 4,
    durationMin: 15,
    sets: 4,
    reps: 8,
    restSec: 45,
    instructions:
      '1. Professor lança bola profunda do outro lado da quadra.\n2. Aluno 1 recepciona de peito/chapa direcionando para a fita da rede.\n3. Aluno 2 corre para a rede e executa o levantamento alto e macio.\n4. Aluno 1 aproxima com impulsão e ataca de cabeça direcionando para a quadra adversária.',
    notes: 'O levantador deve priorizar altura e distância de 50cm da rede para o atacante ter espaço para saltar e testar.',
  }

  const p1Id = uid() // Aluno 1 (Receptor / Atacante)
  const p2Id = uid() // Aluno 2 (Levantador)
  const coachId = uid() // Professor Lançador (Lado B)
  const ballId = uid()

  ex.objects = [
    {
      id: p1Id,
      type: 'player',
      position: { x: -5.5, z: -1.8 },
      rotation: 0,
      color: TEAM_COLORS.A,
      locked: false,
      name: 'Receptor',
      number: 1,
      role: 'student',
      team: 'A',
    },
    {
      id: p2Id,
      type: 'player',
      position: { x: -3.5, z: 1.8 },
      rotation: 0,
      color: TEAM_COLORS.A,
      locked: false,
      name: 'Levantador',
      number: 2,
      role: 'student',
      team: 'A',
    },
    {
      id: coachId,
      type: 'player',
      position: { x: 5.5, z: 0 },
      rotation: 180,
      color: TEAM_COLORS.coach,
      locked: false,
      name: 'Lançador',
      number: 0,
      role: 'coach',
      team: null,
    },
    {
      id: ballId,
      type: 'ball',
      position: { x: 5.0, z: 0 },
      rotation: 0,
      color: '#facc15',
      height: 1.5,
      locked: false,
    },
    { id: uid(), type: 'marker', position: { x: -5.5, z: -1.8 }, rotation: 0, color: '#facc15', locked: false },
    { id: uid(), type: 'marker', position: { x: -1.2, z: 0.5 }, rotation: 0, color: '#c6f432', locked: false },
  ]

  ex.timeline = {
    duration: 9,
    keyframes: {
      // Bola voando em curva pelo ar
      [ballId]: [
        { id: uid(), time: 0, position: { x: 5.0, z: 0 }, height: 1.5 },
        { id: uid(), time: 2.2, position: { x: -5.2, z: -1.8 }, height: 1.1, action: 'Recepção' },
        { id: uid(), time: 4.5, position: { x: -1.2, z: 0.5 }, height: 2.3, action: 'Levantamento' },
        { id: uid(), time: 6.8, position: { x: -0.8, z: 0.2 }, height: 2.4, action: 'Ataque Cabeça' },
        { id: uid(), time: 8.2, position: { x: 4.8, z: -2.2 }, height: 0.11 },
        { id: uid(), time: 9.0, position: { x: 4.8, z: -2.2 }, height: 0.11 },
      ],
      // Aluno 1: recepciona no fundo e avança para a rede para atacar
      [p1Id]: [
        { id: uid(), time: 0, position: { x: -5.5, z: -1.8 }, rotation: 0 },
        { id: uid(), time: 2.2, position: { x: -5.2, z: -1.8 }, rotation: 10, action: '🏐 Peito' },
        { id: uid(), time: 4.5, position: { x: -3.5, z: -0.8 }, rotation: 15 },
        { id: uid(), time: 6.8, position: { x: -1.2, z: 0.1 }, rotation: 10, action: '🎯 Ataque Cabeça' },
        { id: uid(), time: 8.5, position: { x: -4.0, z: -1.5 }, rotation: 0 },
        { id: uid(), time: 9.0, position: { x: -5.5, z: -1.8 }, rotation: 0 },
      ],
      // Aluno 2: corre para a rede para levantar
      [p2Id]: [
        { id: uid(), time: 0, position: { x: -3.5, z: 1.8 }, rotation: 0 },
        { id: uid(), time: 2.0, position: { x: -2.0, z: 1.0 }, rotation: 320 },
        { id: uid(), time: 4.5, position: { x: -1.2, z: 0.5 }, rotation: 300, action: '🌟 Chapa Alta' },
        { id: uid(), time: 7.0, position: { x: -2.5, z: 1.2 }, rotation: 0 },
        { id: uid(), time: 9.0, position: { x: -3.5, z: 1.8 }, rotation: 0 },
      ],
    },
  }

  return ex
}

/** Exercício 3: Circuito Técnico: Chapas Laterais e Ataque (solicitado pelo usuário) */
export function seedCircuitoChapaAtaque(): Exercise {
  const ex = createExercise('Circuito: Chapas Laterais e Ataque')
  ex.meta = {
    ...ex.meta,
    objective: 'Treinar saída do meio, deslocamentos laterais em diagonal para o fundo com chapa esquerda e direita, transição para o meio com amortecida de peito e ataque na rede.',
    fundamentals: ['deslocamento', 'chapa', 'peito', 'ataque', 'posicionamento'],
    level: 'intermediate',
    participantsMin: 1,
    participantsMax: 4,
    durationMin: 12,
    sets: 3,
    reps: 8,
    restSec: 45,
    instructions:
      '1. Aluno sai da base central e desloca para o fundo esquerdo, executando chapa alta de devolução.\n2. Retorna ao centro, recupera a base e desloca para o fundo direito para nova chapa.\n3. Volta ao meio, recebe passe de transição amortecendo no peito.\n4. Avança para a fita e finaliza com ataque diagonal.',
    notes: 'Manter olhar fixo no lançador e joelhos semi-flexionados nas mudanças de direção na areia.',
  }

  const alunoId = uid()
  const coachId = uid()
  const ballId = uid()

  ex.objects = [
    {
      id: alunoId,
      type: 'player',
      position: { x: -4.5, z: 0 },
      rotation: 0,
      color: TEAM_COLORS.A,
      locked: false,
      name: 'Aluno 1',
      number: 1,
      role: 'student',
      team: 'A',
    },
    {
      id: coachId,
      type: 'player',
      position: { x: 4.8, z: 0 },
      rotation: 180,
      color: TEAM_COLORS.coach,
      locked: false,
      name: 'Lançador',
      number: 0,
      role: 'coach',
      team: null,
    },
    {
      id: ballId,
      type: 'ball',
      position: { x: 4.5, z: 0 },
      rotation: 0,
      color: '#facc15',
      height: 1.4,
      locked: false,
    },
    // Cones indicadores do circuito
    { id: uid(), type: 'cone', position: { x: -6.8, z: -2.5 }, rotation: 0, color: '#ff8a3d', locked: false },
    { id: uid(), type: 'cone', position: { x: -6.8, z: 2.5 }, rotation: 0, color: '#ff8a3d', locked: false },
    { id: uid(), type: 'marker', position: { x: -4.5, z: 0 }, rotation: 0, color: '#c6f432', locked: false },
    { id: uid(), type: 'marker', position: { x: -1.5, z: 0 }, rotation: 0, color: '#38bdf8', locked: false },
  ]

  ex.timeline = {
    duration: 13,
    keyframes: {
      [alunoId]: [
        { id: uid(), time: 0, position: { x: -4.5, z: 0 }, rotation: 0, action: 'Base Central' },
        { id: uid(), time: 2.2, position: { x: -6.8, z: -2.5 }, rotation: 25, action: '👟 Chapa Esquerda' },
        { id: uid(), time: 4.2, position: { x: -4.5, z: 0 }, rotation: 0, action: 'Base Meio' },
        { id: uid(), time: 6.5, position: { x: -6.8, z: 2.5 }, rotation: 335, action: '👟 Chapa Direita' },
        { id: uid(), time: 8.5, position: { x: -4.5, z: 0 }, rotation: 0, action: 'Base Meio' },
        { id: uid(), time: 10.2, position: { x: -2.5, z: 0 }, rotation: 0, action: '🏐 Peito' },
        { id: uid(), time: 11.5, position: { x: -1.3, z: 0 }, rotation: 0, action: '💥 Ataque!' },
        { id: uid(), time: 13.0, position: { x: -4.5, z: 0 }, rotation: 0, action: 'Retorno Base' },
      ],
      [ballId]: [
        // Bola 1: Lançamento para o fundo esquerdo
        { id: uid(), time: 0, position: { x: 4.5, z: 0 }, height: 1.4 },
        { id: uid(), time: 2.2, position: { x: -6.6, z: -2.5 }, height: 0.9, action: 'Chapa' },
        { id: uid(), time: 3.5, position: { x: 4.0, z: -0.5 }, height: 1.5 },
        // Bola 2: Lançamento para o fundo direito
        { id: uid(), time: 4.5, position: { x: 4.5, z: 0 }, height: 1.4 },
        { id: uid(), time: 6.5, position: { x: -6.6, z: 2.5 }, height: 0.9, action: 'Chapa' },
        { id: uid(), time: 7.8, position: { x: 4.0, z: 0.5 }, height: 1.5 },
        // Bola 3: Transição no peito e subida para o ataque
        { id: uid(), time: 8.8, position: { x: 4.5, z: 0 }, height: 1.6 },
        { id: uid(), time: 10.2, position: { x: -2.3, z: 0 }, height: 1.5, action: 'Amortece' },
        { id: uid(), time: 11.2, position: { x: -1.2, z: 0 }, height: 2.5, action: 'Levantamento' },
        { id: uid(), time: 11.6, position: { x: -1.1, z: 0 }, height: 2.4, action: 'Ponto!' },
        { id: uid(), time: 12.8, position: { x: 4.5, z: -1.5 }, height: 0.11 },
        { id: uid(), time: 13.0, position: { x: 4.5, z: -1.5 }, height: 0.11 },
      ],
    },
  }

  return ex
}
