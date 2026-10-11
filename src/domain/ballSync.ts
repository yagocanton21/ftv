import type { Exercise, Keyframe, BallObject, PlayerObject, Vec2 } from '@/domain/types'
import { createObject } from '@/domain/factories'
import { uid, round } from '@/lib/utils'

export interface BallSyncResult {
  updatedObjects: Exercise['objects']
  ballKeyframes: Keyframe[]
  ballId: string
  coachAdded: boolean
}

/**
 * Calcula a trajetória aérea e os arcos da bola 3D sincronizados
 * perfeitamente com os passos e fundamentos do atleta.
 */
export function generateBallKeyframesForExercise(
  exercise: Exercise,
  targetPlayerId?: string,
  autoAddCoach = true,
): BallSyncResult | null {
  const players = exercise.objects.filter((o): o is PlayerObject => o.type === 'player')
  if (players.length === 0) return null

  const targetPlayer =
    (targetPlayerId ? players.find((p) => p.id === targetPlayerId) : null) ||
    players[0]

  const playerKfs = exercise.timeline?.keyframes?.[targetPlayer.id] ?? []
  if (playerKfs.length === 0) return null

  const sorted = [...playerKfs].sort((a, b) => a.time - b.time)

  const isSideA = targetPlayer.position.x <= 0
  let updatedObjects = [...exercise.objects]
  let coachAdded = false

  // 1. Identifica lançador (treinador na rede ou outro jogador)
  const existingCoach = players.find((p) => p.id !== targetPlayer.id && p.role === 'coach')
  const partner = players.find((p) => p.id !== targetPlayer.id)

  let feederPos: Vec2 = { x: isSideA ? -1.0 : 1.0, z: 0 }
  let feederHeight = 1.25

  if (existingCoach) {
    feederPos = { ...existingCoach.position }
  } else if (partner) {
    feederPos = { ...partner.position }
  } else if (autoAddCoach && players.length === 1) {
    // Adiciona Treinador na rede virado para o aluno
    const coachPos: Vec2 = { x: isSideA ? -1.1 : 1.1, z: 0 }
    const coachObj: PlayerObject = {
      ...(createObject('player', coachPos, updatedObjects) as PlayerObject),
      name: 'Treinador',
      role: 'coach',
      color: '#f97316',
      number: 0,
      rotation: isSideA ? 180 : 0,
    }
    updatedObjects.push(coachObj)
    feederPos = coachPos
    coachAdded = true
  }

  // 2. Encontra ou cria a Bola
  let ball = exercise.objects.find((o): o is BallObject => o.type === 'ball')
  if (!ball) {
    ball = {
      ...(createObject('ball', feederPos, updatedObjects) as BallObject),
      height: feederHeight,
      color: '#facc15',
    }
    updatedObjects.push(ball)
  }

  // 3. Identifica os momentos de contato/fundamento do atleta
  const isContact = (k: Keyframe) => {
    if (!k.action) return false
    const act = k.action.toLowerCase()
    return (
      !act.includes('base') &&
      !act.includes('deslocamento') &&
      !act.includes('corrida')
    )
  }

  let contactKfs = sorted.filter(isContact)
  // Se nenhum tiver tag explícita, usa todos os passos com tempo > 0
  if (contactKfs.length === 0) {
    contactKfs = sorted.filter((k) => k.time > 0)
  }

  if (contactKfs.length === 0) return null

  const getContactHeight = (action?: string) => {
    if (!action) return 0.8
    const act = action.toLowerCase()
    if (act.includes('chapa')) return 0.38 // Pé / chapa
    if (act.includes('peito')) return 1.32 // Amortecimento no peito
    if (act.includes('cabeça') || act.includes('ataque')) return 1.85 // Cabeceio / Ataque no ar
    if (act.includes('defesa') || act.includes('recepção')) return 0.70 // Defesa baixa
    if (act.includes('levantamento')) return 1.50 // Levantamento
    if (act.includes('saque')) return 1.40
    return 0.90
  }

  const ballKeyframes: Keyframe[] = []

  // Ponto inicial: bola na mão do lançador
  ballKeyframes.push({
    id: uid(),
    time: 0,
    position: { ...feederPos },
    rotation: 0,
    height: feederHeight,
    action: 'Lançador',
  })

  let prevTime = 0

  for (let i = 0; i < contactKfs.length; i++) {
    const kf = contactKfs[i]
    const contactTime = kf.time
    const contactHeight = getContactHeight(kf.action)

    // Tempo de voo do lançamento (entre 0.8s e 1.6s)
    const availableWindow = contactTime - prevTime
    const flightTime = Math.min(1.5, Math.max(0.7, availableWindow * 0.65))
    const launchTime = round(Math.max(prevTime + 0.05, contactTime - flightTime), 1)

    // 1. Bola saindo da mão do lançador
    if (launchTime > prevTime + 0.1) {
      ballKeyframes.push({
        id: uid(),
        time: launchTime,
        position: { ...feederPos },
        rotation: 0,
        height: feederHeight,
      })
    }

    // 2. Bola no momento do impacto com o atleta
    ballKeyframes.push({
      id: uid(),
      time: contactTime,
      position: { ...kf.position },
      rotation: 0,
      height: contactHeight,
      action: kf.action || 'Toque',
    })

    // 3. Pós-impacto (rebate ou amortecimento)
    const actLower = (kf.action || '').toLowerCase()
    const nextKf = contactKfs[i + 1]
    const nextTime = nextKf ? nextKf.time : contactTime + 2.5
    const reboundWindow = nextTime - contactTime

    if (actLower.includes('peito')) {
      // No peito: amortecimento suave pra cima e para frente
      const popTime = round(contactTime + Math.min(0.7, reboundWindow * 0.4), 1)
      const popPos = {
        x: round(kf.position.x + (feederPos.x - kf.position.x) * 0.25, 2),
        z: kf.position.z,
      }
      ballKeyframes.push({
        id: uid(),
        time: popTime,
        position: popPos,
        rotation: 0,
        height: 2.15,
      })
    } else {
      // Na chapa / ataque / cabeça: rebate em direção à rede ou lançador
      const reboundTime = round(contactTime + Math.min(1.0, reboundWindow * 0.5), 1)
      const reboundTarget = {
        x: round(feederPos.x * 0.8 + kf.position.x * 0.2, 2),
        z: round(feederPos.z * 0.8 + kf.position.z * 0.2, 2),
      }
      ballKeyframes.push({
        id: uid(),
        time: reboundTime,
        position: reboundTarget,
        rotation: 0,
        height: 1.85,
      })
    }

    // 4. Retorno ao lançador para a próxima bola
    const returnTime = round(contactTime + Math.min(1.5, reboundWindow * 0.75), 1)
    if (nextKf && returnTime < nextTime - 0.5) {
      ballKeyframes.push({
        id: uid(),
        time: returnTime,
        position: { ...feederPos },
        rotation: 0,
        height: feederHeight,
      })
    }

    prevTime = returnTime
  }

  // Ponto final de repouso no final da timeline
  const finalKf = sorted[sorted.length - 1]
  const finalTime = Math.max(exercise.timeline?.duration ?? 8, (finalKf?.time ?? 0) + 1)
  const lastBallKf = ballKeyframes[ballKeyframes.length - 1]
  if (lastBallKf && lastBallKf.time < finalTime) {
    ballKeyframes.push({
      id: uid(),
      time: finalTime,
      position: { ...feederPos },
      rotation: 0,
      height: feederHeight,
    })
  }

  // Ordena por tempo e remove tempos duplicados
  const cleanKfs = ballKeyframes
    .sort((a, b) => a.time - b.time)
    .filter((k, idx, arr) => idx === 0 || k.time > arr[idx - 1].time + 0.05)

  return {
    updatedObjects,
    ballKeyframes: cleanKfs,
    ballId: ball.id,
    coachAdded,
  }
}
