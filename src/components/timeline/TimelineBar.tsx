import { useEffect, useMemo, useState } from 'react'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Trash2,
  X,
  Plus,
  Minimize2,
  Maximize2,
} from 'lucide-react'
import { useSimulationStore } from '@/store/simulationStore'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import { ACTION_PRESETS } from '@/domain/simulation'
import { uid, round } from '@/lib/utils'
import { toast } from 'sonner'
import { PlaybackControls } from './PlaybackControls'
import { KeyframeTrack, type DisplayedKeyframe } from './KeyframeTrack'

export function TimelineBar() {
  const isPlaying = useSimulationStore((s) => s.isPlaying)
  const currentTime = useSimulationStore((s) => s.currentTime)
  const speed = useSimulationStore((s) => s.speed)
  const loop = useSimulationStore((s) => s.loop)
  const duration = useSimulationStore((s) => s.duration)

  const togglePlay = useSimulationStore((s) => s.togglePlay)
  const play = useSimulationStore((s) => s.play)
  const reset = useSimulationStore((s) => s.reset)
  const seek = useSimulationStore((s) => s.seek)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const setLoop = useSimulationStore((s) => s.setLoop)
  const setDuration = useSimulationStore((s) => s.setDuration)

  const exercise = useDocumentStore((s) => s.exercise)
  const setKeyframesForExercise = useDocumentStore((s) => s.setKeyframesForExercise)
  const removeKeyframe = useDocumentStore((s) => s.removeKeyframe)
  const clearKeyframes = useDocumentStore((s) => s.clearKeyframes)
  const setTimelineDuration = useDocumentStore((s) => s.setTimelineDuration)
  const syncBallAnimation = useDocumentStore((s) => s.syncBallAnimation)

  const selectedIds = useUiStore((s) => s.selectedIds)
  const select = useUiStore((s) => s.select)
  const recordingPlayerId = useUiStore((s) => s.recordingPlayerId)
  const setRecordingPlayerId = useUiStore((s) => s.setRecordingPlayerId)
  const [collapsed, setCollapsed] = useState(false)
  const [compactMode, setCompactMode] = useState(false)

  // Quando o professor clica para traçar trajeto na areia, recolhe a linha do tempo automaticamente
  useEffect(() => {
    if (recordingPlayerId) {
      setCollapsed(true)
    }
  }, [recordingPlayerId])

  const handleTogglePlay = () => {
    togglePlay()
  }

  const selectedObject = exercise.objects.find((o) => selectedIds.includes(o.id)) ?? null
  const objectKeyframes = selectedObject
    ? (exercise.timeline?.keyframes?.[selectedObject.id] ?? [])
    : []

  // Marcadores de keyframe no trilho: exibe do objeto selecionado ou de todos da quadra
  const displayedKeyframes = useMemo<DisplayedKeyframe[]>(() => {
    if (selectedObject) {
      return (exercise.timeline?.keyframes?.[selectedObject.id] ?? []).map((k) => ({
        id: k.id,
        time: k.time,
        action: k.action,
        color: selectedObject.color,
        name: selectedObject.type === 'player' ? selectedObject.name : 'Bola',
        isCurrentObject: true,
      }))
    }
    const result: DisplayedKeyframe[] = []
    const kfMap = exercise.timeline?.keyframes ?? {}
    for (const obj of exercise.objects) {
      const list = kfMap[obj.id]
      if (Array.isArray(list)) {
        for (const k of list) {
          result.push({
            id: k.id,
            time: k.time,
            action: k.action,
            color: obj.color,
            name: obj.type === 'player' ? obj.name : 'Bola',
            isCurrentObject: false,
          })
        }
      }
    }
    return result
  }, [selectedObject, exercise.timeline?.keyframes, exercise.objects])

  // Verifica se há um keyframe no segundo atual para o objeto selecionado
  const currentKeyframe = objectKeyframes.find(
    (k) => Math.abs(k.time - currentTime) < 0.2,
  )

  // ZERAR PONTOS
  const handleClearKeyframes = () => {
    if (selectedObject) {
      clearKeyframes(selectedObject.id)
      seek(0)
      toast.success(`Pontos de ${selectedObject.type === 'player' ? selectedObject.name : 'objeto'} zerados!`)
    } else {
      if (window.confirm('Zerar todos os pontos de movimentação de TODOS os jogadores da quadra?')) {
        clearKeyframes()
        seek(0)
        toast.success('Todos os pontos de gravação da quadra foram zerados!')
      }
    }
  }

  // MONTAR TREINO: Entra no modo de gravação interativa
  const handleMontarTreino = () => {
    const target = selectedObject?.type === 'player'
      ? selectedObject
      : (exercise.objects.find((o) => o.type === 'player') || null)
    if (target) {
      select([target.id])
      setRecordingPlayerId(target.id)
      toast.info(`Montando treino de ${target.name}! Clique nos pontos da quadra de areia.`)
    } else {
      toast.error('Adicione ao menos um jogador na quadra para montar o treino!')
    }
  }

  // SINCRONIZAR BOLA: Calcula a trajetória aérea 3D da bola em parábola
  const handleSyncBall = () => {
    const targetId = selectedObject?.type === 'player' ? selectedObject.id : undefined
    const res = syncBallAnimation(targetId)
    if (res.success) {
      seek(0)
      play()
      toast.success(
        res.coachAdded
          ? '🏐 Bola e Treinador adicionados! Voo parabólico da bola sincronizado.'
          : '🏐 Bola 3D sincronizada com os fundamentos do atleta! Reproduzindo no ar...',
      )
    } else {
      toast.error('Grave ao menos um trajeto com passos para sincronizar a bola!')
    }
  }

  // Grava na posição e segundo exato (usado pelos atalhos de fundamento)
  const handleRecordKeyframe = (actionBadge?: string) => {
    if (!selectedObject) {
      toast.info('Selecione um jogador ou bola na areia')
      return
    }

    const t = round(currentTime, 1)
    const act = actionBadge !== undefined ? actionBadge : (currentKeyframe?.action || undefined)
    const kf = {
      id: currentKeyframe ? currentKeyframe.id : uid(),
      time: t,
      position: selectedObject.position,
      rotation: selectedObject.rotation,
      height: selectedObject.type === 'ball' ? selectedObject.height : undefined,
      action: act,
    }

    useDocumentStore.getState().addOrUpdateKeyframe(selectedObject.id, kf)
    toast.success(
      `Ponto gravado aos ${t}s${act ? ` (${act})` : ''} para ${selectedObject.type === 'player' ? selectedObject.name : 'a bola'}`,
    )
  }

  const handleDurationChange = (newD: number) => {
    const val = Math.max(2, Math.min(60, newD))
    setDuration(val)
    setTimelineDuration(val)
  }

  return (
    <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 w-[94vw] max-w-3xl xl:max-w-4xl z-40 flex flex-col items-center select-none">
      {/* Botões superiores da barra */}
      <div className="flex items-center gap-1 mb-1">
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? 'Expandir linha do tempo' : 'Recolher linha do tempo'}
          className="px-2.5 py-1 bg-[#121815]/90 hover:bg-[#1a231e] backdrop-blur-md border border-[#1f2a24] text-[11px] font-semibold text-gray-300 hover:text-white rounded-t-xl flex items-center gap-1.5 transition-colors shadow-lg"
        >
          <Clock className="w-3.5 h-3.5 text-[#c6f432]" />
          <span>Linha do Tempo</span>
          {collapsed ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        {!collapsed && (
          <button
            onClick={() => setCompactMode((v) => !v)}
            title={compactMode ? 'Modo Completo (ver fundamentos e passos)' : 'Modo Compacto (economiza espaço na tela)'}
            className={`px-2 py-1 rounded-t-xl border text-[10px] font-semibold transition-colors flex items-center gap-1 shadow-md ${
              compactMode
                ? 'bg-[#c6f432]/15 text-[#c6f432] border-[#c6f432]/40'
                : 'bg-[#121815]/90 text-gray-400 hover:text-white border-[#1f2a24]'
            }`}
          >
            {compactMode ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            <span>{compactMode ? 'Expandir' : 'Compacto'}</span>
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="w-full bg-[#121815]/95 backdrop-blur-md border border-[#1f2a24] rounded-2xl shadow-2xl p-2 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2">
          {/* Linha superior: Controles de reprodução + Montar Treino */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
            <PlaybackControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              speed={speed}
              loop={loop}
              onTogglePlay={handleTogglePlay}
              onReset={reset}
              onSetSpeed={setSpeed}
              onSetLoop={setLoop}
            />

            {/* Lado Direito: Botão MONTAR TREINO + Zerar + Duração */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* ⭐ BOTÃO PRINCIPAL: Montar Treino */}
              <button
                onClick={handleMontarTreino}
                title="Monte o treino clicando na quadra de areia, escolhendo fundamentos passo a passo"
                className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[12px] font-black bg-gradient-to-r from-[#c6f432] to-[#a8d929] text-[#0b0f0d] hover:from-[#d4ff3a] hover:to-[#c6f432] transition-all shadow-lg shadow-[#c6f432]/25 hover:shadow-[#c6f432]/40 hover:scale-[1.03] active:scale-[0.98]"
              >
                <Dumbbell className="w-4 h-4 stroke-[2.5]" />
                <span>Montar Treino</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#c6f432] animate-ping opacity-75" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#c6f432]" />
              </button>

              {/* ⭐ BOTÃO SINCRONIZAR BOLA */}
              <button
                onClick={handleSyncBall}
                title="Sincroniza a bola em arcos parabólicos 3D voando até o atleta em cada fundamento"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-[#0b0f0d] hover:from-yellow-300 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 hover:scale-[1.03] active:scale-[0.98]"
              >
                <span>🏐 Sincronizar Bola</span>
              </button>

              {/* BOTÃO ZERAR PONTOS */}
              <button
                onClick={handleClearKeyframes}
                title="Apagar pontos do trajeto e recomeçar do zero"
                className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 transition-all shadow-sm"
              >
                <Trash2 className="w-3 h-3" />
                <span>{selectedObject ? 'Zerar' : 'Zerar Tudo'}</span>
              </button>

              {/* Duração total */}
              <div className="flex items-center gap-1 pl-1.5 border-l border-[#1f2a24]">
                <span className="text-[9px] text-gray-500">Dur:</span>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value) || 8)}
                  className="w-10 px-1 py-0.5 bg-[#161e19] border border-[#233028] rounded text-[11px] text-center text-white font-mono focus:outline-none"
                />
                <span className="text-[9px] text-gray-500">s</span>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos de Fundamentos Esportivos (só com jogador selecionado) */}
          {!compactMode && selectedObject && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1f2a24]/60">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold shrink-0">
                <span>Fundamento:</span>
                <span className="text-[9px] text-gray-500 font-normal">({round(currentTime, 1)}s)</span>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => handleRecordKeyframe('')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border ${
                    !currentKeyframe?.action
                      ? 'bg-[#1a231e] text-white border-[#c6f432]/40'
                      : 'bg-[#121815] text-gray-400 border-[#1f2a24] hover:text-white'
                  }`}
                >
                  🏃 Corrida
                </button>
                {ACTION_PRESETS.map((a) => {
                  const active = currentKeyframe?.action === a.badge
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleRecordKeyframe(a.badge)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all border whitespace-nowrap ${
                        active
                          ? 'bg-[#c6f432] text-[#0b0f0d] border-[#c6f432] font-bold shadow-sm'
                          : 'bg-[#161e19] text-gray-300 border-[#233028] hover:border-[#c6f432]/40 hover:text-white'
                      }`}
                    >
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Sequência Passo a Passo do Aluno Selecionado */}
          {!compactMode && selectedObject && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 border-t border-[#1f2a24]/40 scrollbar-none">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider pr-1 whitespace-nowrap shrink-0">
                Passos ({objectKeyframes.length}):
              </span>
              {objectKeyframes.map((k, idx) => {
                const isCurrent = Math.abs(k.time - currentTime) < 0.2
                return (
                  <div
                    key={k.id}
                    onClick={() => seek(k.time)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border cursor-pointer transition-all whitespace-nowrap ${
                      isCurrent
                        ? 'bg-[#c6f432] text-[#0b0f0d] border-[#c6f432] shadow-sm scale-105'
                        : 'bg-[#161e19] text-gray-300 border-[#233028] hover:border-[#c6f432]/50 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-[9px] opacity-75">{k.time}s</span>
                    <span>{k.action || `Passo ${idx + 1}`}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeKeyframe(selectedObject.id, k.id)
                      }}
                      title="Excluir este passo"
                      className="hover:text-red-400 p-0.5 ml-0.5 rounded"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )
              })}

              {/* Botão direto para adicionar próximo passo */}
              <button
                onClick={handleMontarTreino}
                title="Clique na quadra de areia para adicionar o próximo passo deste atleta"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#c6f432]/15 text-[#c6f432] hover:bg-[#c6f432]/25 border border-[#c6f432]/40 transition-all shrink-0 hover:scale-[1.02]"
              >
                <Plus className="w-3 h-3" />
                <span>+ Próximo Passo na Areia</span>
              </button>

              {/* Botão para sincronizar bola nos passos */}
              <button
                onClick={handleSyncBall}
                title="Gera o voo 3D da bola para cada fundamento deste atleta"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/40 transition-all shrink-0 hover:scale-[1.02]"
              >
                <span>🏐 Sincronizar Bola</span>
              </button>
            </div>
          )}

          {/* Trilho da Timeline */}
          <KeyframeTrack
            duration={duration}
            currentTime={currentTime}
            displayedKeyframes={displayedKeyframes}
            onSeek={seek}
          />
        </div>
      )}
    </div>
  )
}
