import { useEffect } from 'react'
import {
  Footprints,
  Check,
  X,
  Trash2,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useDocumentStore } from '@/store/documentStore'
import { useSimulationStore } from '@/store/simulationStore'
import { ACTION_PRESETS } from '@/domain/simulation'
import type { PlayerObject } from '@/domain/types'
import { uid, round } from '@/lib/utils'
import { toast } from 'sonner'

export function SequenceRecorderModal() {
  const recordingPlayerId = useUiStore((s) => s.recordingPlayerId)
  const setRecordingPlayerId = useUiStore((s) => s.setRecordingPlayerId)
  const select = useUiStore((s) => s.select)
  const pendingStepPoint = useUiStore((s) => s.pendingStepPoint)
  const setPendingStepPoint = useUiStore((s) => s.setPendingStepPoint)

  const exercise = useDocumentStore((s) => s.exercise)
  const addOrUpdateKeyframe = useDocumentStore((s) => s.addOrUpdateKeyframe)
  const clearKeyframes = useDocumentStore((s) => s.clearKeyframes)
  const setTimelineDuration = useDocumentStore((s) => s.setTimelineDuration)

  const duration = useSimulationStore((s) => s.duration)
  const setDuration = useSimulationStore((s) => s.setDuration)
  const seek = useSimulationStore((s) => s.seek)
  const play = useSimulationStore((s) => s.play)

  const player = exercise.objects.find((o) => o.id === recordingPlayerId)
  const keyframes = player ? (exercise.timeline?.keyframes?.[player.id] ?? []) : []

  // Se o modo estiver ativo mas o jogador não tiver nenhum ponto ainda, grava o ponto 1 na posição inicial
  useEffect(() => {
    if (recordingPlayerId && player && keyframes.length === 0) {
      addOrUpdateKeyframe(player.id, {
        id: uid(),
        time: 0,
        position: { ...player.position },
        rotation: player.rotation,
        action: 'Base Inicial',
      })
    }
  }, [recordingPlayerId, player?.id])

  if (!recordingPlayerId || !player) return null

  // Confirmação do passo com o fundamento escolhido
  const handleSelectAction = (actionBadge?: string) => {
    if (!pendingStepPoint) return

    // Calcula tempo automático (+2.2s a cada passo)
    const lastKf = keyframes[keyframes.length - 1]
    const nextTime = round(lastKf ? lastKf.time + 2.2 : 2.0, 1)
    const targetTime = Math.min(60, Math.max(0.5, nextTime))

    if (targetTime > duration) {
      const newD = Math.ceil(targetTime + 2)
      setDuration(newD)
      setTimelineDuration(newD)
    }

    seek(targetTime)

    // Calcula rotação olhando na direção do deslocamento
    let rotation = player.rotation
    if (lastKf) {
      const dx = pendingStepPoint.x - lastKf.position.x
      const dz = pendingStepPoint.z - lastKf.position.z
      if (Math.hypot(dx, dz) > 0.1) {
        // Frente = +X
        rotation = round(((Math.atan2(-dz, dx) * 180) / Math.PI + 360) % 360, 0)
      }
    }

    addOrUpdateKeyframe(player.id, {
      id: uid(),
      time: targetTime,
      position: { ...pendingStepPoint },
      rotation,
      action: actionBadge || undefined,
    })

    setPendingStepPoint(null)
    toast.success(
      `Passo ${keyframes.length + 1} gravado aos ${targetTime}s (${actionBadge || 'Deslocamento'})!`
    )
  }

  const playerName = player.type === 'player' ? player.name : 'Atleta'

  const handleFinish = () => {
    setPendingStepPoint(null)
    setRecordingPlayerId(null)
    seek(0)
    play()
    toast.success(`Trajeto de ${playerName} concluído com ${keyframes.length} passos! Reproduzindo...`)
  }

  const handleClear = () => {
    clearKeyframes(player.id)
    setPendingStepPoint(null)
    seek(0)
    // Recria apenas a base
    addOrUpdateKeyframe(player.id, {
      id: uid(),
      time: 0,
      position: { ...player.position },
      rotation: player.rotation,
      action: 'Base',
    })
    toast.info('Trajeto zerado. Clique na areia para recomeçar o primeiro passo!')
  }

  const allPlayers = exercise.objects.filter((o): o is PlayerObject => o.type === 'player')

  const handleQuickAddStep = (spot: 'rede' | 'fundo' | 'meio') => {
    const isSideA = player.position.x <= 0
    let targetPt = { x: -4.5, z: 0 }

    if (spot === 'rede') {
      targetPt = { x: isSideA ? -1.8 : 1.8, z: player.position.z }
    } else if (spot === 'fundo') {
      targetPt = { x: isSideA ? -7.2 : 7.2, z: player.position.z }
    } else if (spot === 'meio') {
      targetPt = { x: isSideA ? -4.5 : 4.5, z: 0 }
    }

    setPendingStepPoint(targetPt)
  }

  return (
    <>
      {/* 1. Banner Superior Fixo: Modo Gravação de Trajeto */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#121815]/95 backdrop-blur-md border-2 border-[#c6f432] p-3 px-5 rounded-2xl shadow-2xl flex items-center gap-4 select-none animate-in fade-in slide-in-from-top-4 duration-200 max-w-[95vw] overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#c6f432] animate-ping" />
          <Footprints className="w-5 h-5 text-[#c6f432]" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Gravando Atleta:
              </span>
              <div className="flex items-center gap-1">
                {allPlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPendingStepPoint(null)
                      setRecordingPlayerId(p.id)
                      select([p.id])
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      p.id === player.id
                        ? 'bg-[#c6f432] text-[#0b0f0d] shadow-sm ring-1 ring-[#c6f432]'
                        : 'bg-[#1a231e] text-gray-300 hover:text-white border border-[#233028]'
                    }`}
                  >
                    #{p.number} {p.name}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-300 font-medium mt-0.5">
              👉 <strong className="text-white">Clique na areia</strong> ou use os atalhos ao lado para marcar o próximo passo.
            </p>
          </div>
        </div>

        {/* Passos Rápidos Pré-definidos */}
        <div className="flex items-center gap-1 px-2.5 py-1 bg-[#161e19] border border-[#233028] rounded-xl shrink-0">
          <span className="text-[10px] text-gray-400 font-bold uppercase mr-1 hidden sm:inline">Passo Rápido:</span>
          <button
            onClick={() => handleQuickAddStep('rede')}
            title="Adicionar próximo passo na rede"
            className="px-2.5 py-1 bg-[#1a231e] hover:bg-[#202e24] text-xs font-bold text-gray-200 hover:text-[#c6f432] rounded-lg transition-colors border border-[#233028]"
          >
            🏐 Na Rede
          </button>
          <button
            onClick={() => handleQuickAddStep('fundo')}
            title="Adicionar próximo passo no fundo"
            className="px-2.5 py-1 bg-[#1a231e] hover:bg-[#202e24] text-xs font-bold text-gray-200 hover:text-[#c6f432] rounded-lg transition-colors border border-[#233028]"
          >
            👟 No Fundo
          </button>
          <button
            onClick={() => handleQuickAddStep('meio')}
            title="Adicionar próximo passo no meio da quadra"
            className="px-2.5 py-1 bg-[#1a231e] hover:bg-[#202e24] text-xs font-bold text-gray-200 hover:text-[#c6f432] rounded-lg transition-colors border border-[#233028]"
          >
            📍 No Meio
          </button>
        </div>

        {/* Contador de passos */}
        <div className="px-3 py-1 bg-[#1a231e] border border-[#233028] rounded-xl text-center shrink-0">
          <span className="text-[10px] text-gray-400 block font-semibold">Passos</span>
          <span className="text-sm font-black text-[#c6f432] font-mono">{keyframes.length}</span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c6f432] hover:bg-[#b0de26] text-[#0b0f0d] font-bold text-xs rounded-xl transition-all shadow-md"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Concluir</span>
          </button>

          <button
            onClick={handleClear}
            title="Apagar todos os passos e recomeçar"
            className="p-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setPendingStepPoint(null)
              setRecordingPlayerId(null)
            }}
            title="Sair do modo gravação"
            className="p-1.5 bg-[#1a231e] hover:bg-[#233028] text-gray-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Modal Flutuante Central: Pergunta qual o fundamento ao clicar na areia */}
      {pendingStepPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
          <div className="bg-[#121815] border-2 border-[#c6f432] rounded-3xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-4 text-center">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c6f432]/15 text-[#c6f432] border border-[#c6f432]/30">
                Passo {keyframes.length + 1}
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                Qual fundamento ele vai fazer neste ponto?
              </h3>
              <p className="text-xs text-gray-400">
                Escolha o movimento que o atleta executará ao chegar aqui na areia:
              </p>
            </div>

            {/* Grid com os botões grandes de fundamentos */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                onClick={() => handleSelectAction('')}
                className="p-3 rounded-2xl bg-[#161e19] hover:bg-[#202b24] border border-[#233028] hover:border-[#c6f432]/50 text-white font-bold text-xs flex items-center gap-2.5 transition-all group"
              >
                <span className="text-xl">🏃</span>
                <div className="flex flex-col">
                  <span>Só Deslocamento</span>
                  <span className="text-[10px] text-gray-400 font-normal">Corrida / Base</span>
                </div>
              </button>

              {ACTION_PRESETS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSelectAction(a.badge)}
                  className="p-3 rounded-2xl bg-[#161e19] hover:bg-[#202b24] border border-[#233028] hover:border-[#c6f432]/50 text-white font-bold text-xs flex items-center gap-2.5 transition-all group"
                >
                  <span className="text-xl">{a.label.split(' ')[0]}</span>
                  <div className="flex flex-col">
                    <span>{a.label.split(' ').slice(1).join(' ')}</span>
                    <span className="text-[10px] text-gray-400 font-normal">Executa {a.badge}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Cancelar ponto */}
            <button
              onClick={() => setPendingStepPoint(null)}
              className="text-xs text-gray-400 hover:text-white underline py-1"
            >
              Cancelar este ponto
            </button>
          </div>
        </div>
      )}
    </>
  )
}
