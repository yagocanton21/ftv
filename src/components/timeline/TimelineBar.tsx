import { useEffect, useMemo, useState } from 'react'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Footprints,
  Plus,
  Trash2,
  X,
  Minimize2,
  Maximize2,
} from 'lucide-react'
import { useSimulationStore } from '@/store/simulationStore'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import { ACTION_PRESETS, type CircuitPreset, ensureExerciseKeyframes } from '@/domain/simulation'
import type { SceneObject } from '@/domain/types'
import { uid, round } from '@/lib/utils'
import { toast } from 'sonner'
import { PlaybackControls } from './PlaybackControls'
import { CircuitPresetsMenu } from './CircuitPresetsMenu'
import { KeyframeTrack, type DisplayedKeyframe } from './KeyframeTrack'

export function TimelineBar() {
  const isPlaying = useSimulationStore((s) => s.isPlaying)
  const currentTime = useSimulationStore((s) => s.currentTime)
  const speed = useSimulationStore((s) => s.speed)
  const loop = useSimulationStore((s) => s.loop)
  const duration = useSimulationStore((s) => s.duration)

  const togglePlay = useSimulationStore((s) => s.togglePlay)
  const reset = useSimulationStore((s) => s.reset)
  const seek = useSimulationStore((s) => s.seek)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const setLoop = useSimulationStore((s) => s.setLoop)
  const setDuration = useSimulationStore((s) => s.setDuration)

  const exercise = useDocumentStore((s) => s.exercise)
  const setKeyframesForExercise = useDocumentStore((s) => s.setKeyframesForExercise)
  const addOrUpdateKeyframe = useDocumentStore((s) => s.addOrUpdateKeyframe)
  const removeKeyframe = useDocumentStore((s) => s.removeKeyframe)
  const clearKeyframes = useDocumentStore((s) => s.clearKeyframes)
  const setTimelineDuration = useDocumentStore((s) => s.setTimelineDuration)

  const selectedIds = useUiStore((s) => s.selectedIds)
  const select = useUiStore((s) => s.select)
  const recordingPlayerId = useUiStore((s) => s.recordingPlayerId)
  const setRecordingPlayerId = useUiStore((s) => s.setRecordingPlayerId)
  const [collapsed, setCollapsed] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [showPresetsMenu, setShowPresetsMenu] = useState(false)

  // Quando o professor clica para traçar trajeto na areia, recolhe a linha do tempo automaticamente
  useEffect(() => {
    if (recordingPlayerId) {
      setCollapsed(true)
    }
  }, [recordingPlayerId])

  // Garante animação se o exercício não tiver keyframes
  useEffect(() => {
    ensureExerciseKeyframes(exercise, (kfs, d) => {
      setKeyframesForExercise(kfs, d)
      if (d) setDuration(d)
    })
  }, [exercise.id])

  const handleTogglePlay = () => {
    ensureExerciseKeyframes(exercise, (kfs, d) => {
      setKeyframesForExercise(kfs, d)
      if (d) setDuration(d)
    })
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

  // 1. ZERAR PONTOS
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

  // 2. APLICAR CIRCUITO PRONTO (1 CLIQUE)
  const handleApplyPreset = (preset: CircuitPreset, targetObj?: SceneObject) => {
    const target = targetObj || selectedObject
    if (!target) {
      toast.info('Selecione um jogador na areia primeiro')
      return
    }
    const cones = exercise.objects
      .filter((o) => o.type === 'cone')
      .map((c) => c.position)

    const kfs = preset.getKeyframes(target.position, cones)
    setKeyframesForExercise({ [target.id]: kfs }, preset.duration)
    setDuration(preset.duration)
    setTimelineDuration(preset.duration)
    seek(0)
    setShowPresetsMenu(false)
    toast.success(
      `Circuito "${preset.name}" aplicado a ${target.type === 'player' ? target.name : 'objeto'}! Aperte Play para ver.`
    )
  }

  // 3. ADICIONAR NOVO PASSO (clicando direto na areia)
  const handleAddNextStep = () => {
    if (!selectedObject) {
      toast.info('Selecione um jogador na areia para adicionar o passo')
      return
    }
    setRecordingPlayerId(selectedObject.id)
    toast.info(`👉 Clique na areia onde ${selectedObject.type === 'player' ? selectedObject.name : 'o atleta'} deve ir!`)
  }

  // Grava na posição e segundo exato
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

    addOrUpdateKeyframe(selectedObject.id, kf)
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
          {/* Linha superior: Controles de reprodução + Construtor de Sequência */}
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

            {/* Lado Direito: Ações da Sequência + Botão ZERAR PONTOS */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <CircuitPresetsMenu
                open={showPresetsMenu}
                onToggle={() => setShowPresetsMenu((v) => !v)}
                selectedObject={selectedObject}
                onApplyPreset={(p) => {
                  const target = selectedObject?.type === 'player'
                    ? selectedObject
                    : (exercise.objects.find((o) => o.type === 'player') || null)
                  if (target) {
                    select([target.id])
                    handleApplyPreset(p, target)
                  }
                }}
              />

              {/* Botão Interativo Principal: Gravar Trajeto clicando na areia */}
              <button
                onClick={() => {
                  const target = selectedObject?.type === 'player'
                    ? selectedObject
                    : (exercise.objects.find((o) => o.type === 'player') || null)
                  if (target) {
                    select([target.id])
                    setRecordingPlayerId(target.id)
                    toast.info(`Gravando ${target.name}! Clique nos pontos da quadra de areia.`)
                  } else {
                    toast.error('Adicione ao menos um jogador para gravar trajeto!')
                  }
                }}
                title="Clique na quadra de areia para montar o trajeto passo a passo e escolher os fundamentos"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black bg-[#c6f432] text-[#0b0f0d] hover:bg-[#b0de26] transition-all shadow-md animate-pulse hover:animate-none"
              >
                <Footprints className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Gravar Trajeto</span>
              </button>

              {/* Botão + Novo Passo na areia */}
              {selectedObject && (
                <button
                  onClick={() => handleAddNextStep()}
                  title="Clique na areia para marcar o próximo ponto deste atleta"
                  className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold bg-[#1a231e] hover:bg-[#233028] text-white border border-[#233028] transition-all"
                >
                  <Plus className="w-3 h-3 stroke-[3] text-[#c6f432]" />
                  <span>+ Passo na Areia</span>
                </button>
              )}

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

          {/* Atalhos Rápidos de Fundamentos Esportivos */}
          {!compactMode && selectedObject && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1f2a24]/60">
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold shrink-0">
                <span>Fundamento:</span>
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
          {!compactMode && selectedObject && objectKeyframes.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 border-t border-[#1f2a24]/40 scrollbar-none">
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
