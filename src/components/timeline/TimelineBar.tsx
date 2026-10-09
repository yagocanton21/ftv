import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Repeat,
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Zap,
  Footprints,
  X,
} from 'lucide-react'
import { useSimulationStore } from '@/store/simulationStore'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import { ACTION_PRESETS, CIRCUIT_PRESETS, type CircuitPreset, ensureExerciseKeyframes } from '@/domain/simulation'
import type { SceneObject } from '@/domain/types'
import { uid, round } from '@/lib/utils'
import { toast } from 'sonner'

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
  const setRecordingPlayerId = useUiStore((s) => s.setRecordingPlayerId)
  const [collapsed, setCollapsed] = useState(false)
  const [showPresetsMenu, setShowPresetsMenu] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)

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

  const selectedObject = exercise.objects.find((o) => selectedIds.includes(o.id))
  const objectKeyframes = selectedObject
    ? (exercise.timeline?.keyframes?.[selectedObject.id] ?? [])
    : []

  // Marcadores de keyframe no trilho: exibe do objeto selecionado ou de todos da quadra
  const displayedKeyframes = useMemo(() => {
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
    const result: Array<{
      id: string
      time: number
      action?: string
      color: string
      name: string
      isCurrentObject: boolean
    }> = []
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

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(ratio * duration)
  }

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

  // 3. ADICIONAR NOVO PASSO DE FORMA INTUITIVA (+2 segundos)
  const handleAddNextStep = (actionBadge?: string) => {
    if (!selectedObject) {
      toast.info('Selecione um jogador na areia para adicionar o passo')
      return
    }

    // Calcula tempo automático: 2 segundos após o último passo gravado
    const lastKf = objectKeyframes[objectKeyframes.length - 1]
    const nextTime = round(lastKf ? lastKf.time + 2.2 : 2.0, 1)
    const targetTime = Math.min(60, Math.max(0.5, nextTime))

    if (targetTime > duration) {
      const newD = Math.ceil(targetTime + 2)
      setDuration(newD)
      setTimelineDuration(newD)
    }

    seek(targetTime)

    const kf = {
      id: uid(),
      time: targetTime,
      position: { ...selectedObject.position },
      rotation: selectedObject.rotation,
      height: selectedObject.type === 'ball' ? selectedObject.height : undefined,
      action: actionBadge || undefined,
    }

    addOrUpdateKeyframe(selectedObject.id, kf)
    toast.success(
      `Passo adicionado aos ${targetTime}s (${actionBadge || 'Corrida'})! Agora arraste o jogador para a posição desejada.`
    )
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

  const formatTime = (sec: number) => {
    const s = Math.floor(sec)
    const ms = Math.floor((sec - s) * 10)
    return `${s.toString().padStart(2, '0')}.${ms}s`
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-16 md:right-16 z-40 flex flex-col items-center select-none">
      {/* Botão de minimizar/expandir barra de animação */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Expandir linha do tempo' : 'Recolher linha do tempo'}
        className="mb-1 px-3 py-1 bg-[#121815]/90 hover:bg-[#1a231e] backdrop-blur-md border border-[#1f2a24] text-[11px] font-semibold text-gray-400 hover:text-white rounded-t-xl flex items-center gap-1.5 transition-colors shadow-lg"
      >
        <Clock className="w-3.5 h-3.5 text-[#c6f432]" />
        <span>Linha do Tempo & Sequências de Treino</span>
        {collapsed ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
      </button>

      {!collapsed && (
        <div className="w-full bg-[#121815]/95 backdrop-blur-md border border-[#1f2a24] rounded-2xl shadow-2xl p-3 flex flex-col gap-2.5">
          {/* Linha superior: Controles de reprodução + Construtor de Sequência */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Lado Esquerdo: Play, Reset, Tempo, Loop, Velocidade */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir Simulação 3D para os alunos (Espaço)'}
                className={`px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 ${
                  isPlaying
                    ? 'bg-[#ff8a3d] text-white hover:bg-[#ea580c] shadow-[#ff8a3d]/20'
                    : 'bg-[#c6f432] text-[#0b0f0d] hover:bg-[#b0de26] shadow-[#c6f432]/20'
                }`}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isPlaying ? 'Pausar' : 'Demonstrar Treino'}</span>
              </button>

              <button
                onClick={reset}
                title="Voltar ao início (00:00)"
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a231e] border border-[#1f2a24] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <div className="px-3 py-1 bg-[#161e19] border border-[#1f2a24] rounded-xl font-mono text-xs font-semibold text-white flex items-center gap-1.5 shadow-inner">
                <span className="text-[#c6f432]">{formatTime(currentTime)}</span>
                <span className="text-gray-500">/</span>
                <span className="text-gray-400">{formatTime(duration)}</span>
              </div>

              {/* Botão de Loop */}
              <button
                onClick={() => setLoop(!loop)}
                title={loop ? 'Repetição contínua ligada' : 'Repetição desligada'}
                className={`p-2 rounded-xl border transition-colors ${
                  loop
                    ? 'bg-[#c6f432]/15 text-[#c6f432] border-[#c6f432]/40'
                    : 'text-gray-500 hover:text-gray-300 border-[#1f2a24]'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>

              {/* Seletor de Velocidade */}
              <div className="flex items-center bg-[#161e19] p-0.5 rounded-xl border border-[#1f2a24] text-[11px] font-semibold">
                {[0.5, 1, 2].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-1 rounded-lg transition-colors ${
                      speed === s
                        ? 'bg-[#c6f432] text-[#0b0f0d] font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Lado Direito: Ações da Sequência + Botão ZERAR PONTOS */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Menu de Circuitos Prontos */}
              <div className="relative">
                <button
                  onClick={() => setShowPresetsMenu((v) => !v)}
                  title="Aplicar circuito pronto a este jogador com 1 clique"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a231e] hover:bg-[#233028] text-amber-300 border border-amber-500/30 transition-all shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Circuitos Prontos</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showPresetsMenu && (
                  <div className="absolute right-0 bottom-full mb-2 w-64 bg-[#121815] border border-[#233028] rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1">
                    <div className="px-2 py-1 text-[11px] font-bold text-gray-400 border-b border-[#1f2a24] mb-1">
                      Aplicar circuito em {selectedObject?.type === 'player' ? selectedObject.name : 'atleta'}:
                    </div>
                    {CIRCUIT_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const target = selectedObject?.type === 'player'
                            ? selectedObject
                            : (exercise.objects.find((o) => o.type === 'player') || null)
                          if (target) {
                            select([target.id])
                            handleApplyPreset(p, target)
                          }
                        }}
                        className="text-left p-2 rounded-xl hover:bg-[#1a231e] text-white hover:text-[#c6f432] transition-colors flex flex-col"
                      >
                        <span className="font-bold text-xs">{p.name}</span>
                        <span className="text-[10px] text-gray-400 leading-tight">{p.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#c6f432] text-[#0b0f0d] hover:bg-[#b0de26] transition-all shadow-md animate-pulse hover:animate-none"
              >
                <Footprints className="w-4 h-4 stroke-[2.5]" />
                <span>Gravar Trajeto na Areia</span>
              </button>

              {/* Botão + Novo Passo (+2s) */}
              {selectedObject && (
                <button
                  onClick={() => handleAddNextStep()}
                  title="Avança 2 segundos e cria o próximo passo da corrida na areia"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#1a231e] hover:bg-[#233028] text-white border border-[#233028] transition-all"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3] text-[#c6f432]" />
                  <span>+ Passo</span>
                </button>
              )}

              {/* BOTÃO ZERAR PONTOS */}
              <button
                onClick={handleClearKeyframes}
                title="Apagar pontos do trajeto e recomeçar do zero"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{selectedObject ? 'Zerar Pontos' : 'Zerar Tudo'}</span>
              </button>

              {/* Duração total */}
              <div className="flex items-center gap-1 pl-2 border-l border-[#1f2a24]">
                <span className="text-[10px] text-gray-500">Duração:</span>
                <input
                  type="number"
                  min="2"
                  max="60"
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value) || 8)}
                  className="w-12 px-1.5 py-1 bg-[#161e19] border border-[#233028] rounded-lg text-xs text-center text-white font-mono focus:outline-none"
                />
                <span className="text-[10px] text-gray-500">s</span>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos de Fundamentos Esportivos para o jogador selecionado */}
          {selectedObject && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1f2a24]/60">
              <div className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold">
                <span>Fundamento neste passo:</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => handleRecordKeyframe('')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border whitespace-nowrap ${
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
          {selectedObject && objectKeyframes.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 border-t border-[#1f2a24]/40 scrollbar-none">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pr-1 whitespace-nowrap">
                Passos ({objectKeyframes.length}):
              </span>
              {objectKeyframes.map((k, idx) => {
                const isCurrent = Math.abs(k.time - currentTime) < 0.2
                return (
                  <div
                    key={k.id}
                    onClick={() => seek(k.time)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold border cursor-pointer transition-all whitespace-nowrap ${
                      isCurrent
                        ? 'bg-[#c6f432] text-[#0b0f0d] border-[#c6f432] shadow-md scale-105'
                        : 'bg-[#161e19] text-gray-300 border-[#233028] hover:border-[#c6f432]/50 hover:text-white'
                    }`}
                  >
                    <span className="font-mono text-[10px] opacity-75">{k.time}s</span>
                    <span>{k.action || `Passo ${idx + 1}`}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeKeyframe(selectedObject.id, k.id)
                      }}
                      title="Excluir este passo"
                      className="hover:text-red-400 p-0.5 ml-0.5 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Trilho da Timeline com Scrubber */}
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="w-full h-8 bg-[#0e1411] hover:bg-[#111915] border border-[#1f2a24] rounded-xl relative cursor-pointer select-none overflow-hidden transition-colors"
          >
            {/* Linhas de divisão de segundos */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-2">
              {Array.from({ length: Math.min(25, duration + 1) }).map((_, i) => {
                const s = Math.round((i / Math.min(24, duration)) * duration)
                return (
                  <div key={i} className="flex flex-col items-center justify-between h-full py-1">
                    <div className="w-px h-1.5 bg-[#233028]" />
                    <span className="text-[9px] font-mono text-gray-600">{s}s</span>
                  </div>
                )
              })}
            </div>

            {/* Barra de progresso preenchida */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-[#c6f432]/10 border-r border-[#c6f432]/50 pointer-events-none transition-all duration-75"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Marcadores de Keyframes no trilho (objeto selecionado ou todos da quadra) */}
            {displayedKeyframes.map((k) => {
              const kfLeft = (k.time / duration) * 100
              const isCurrent = Math.abs(k.time - currentTime) < 0.2

              return (
                <div
                  key={k.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    seek(k.time)
                  }}
                  title={`${k.name}: ponto aos ${k.time}s${k.action ? ` (${k.action})` : ''}`}
                  className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 rounded-sm transition-transform cursor-pointer shadow-md ${
                    isCurrent
                      ? 'bg-[#ff8a3d] border-2 border-white scale-125 z-20'
                      : k.isCurrentObject
                        ? 'bg-[#c6f432] border border-[#0b0f0d] hover:scale-125 z-10'
                        : 'border border-black/40 hover:scale-125 z-10'
                  }`}
                  style={{
                    left: `${kfLeft}%`,
                    backgroundColor: isCurrent ? '#ff8a3d' : (k.isCurrentObject ? '#c6f432' : k.color),
                  }}
                />
              )
            })}

            {/* Agulha / Cabeçote de leitura (Scrubber) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#c6f432] shadow-lg pointer-events-none z-30 flex flex-col items-center"
              style={{ left: `${progressPercent}%` }}
            >
              <div className="w-3 h-3 bg-[#c6f432] rotate-45 -mt-1 shadow-md border border-[#0b0f0d]" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
