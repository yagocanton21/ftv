import { useState } from 'react'
import { X, Info, Camera, Play, Pause, RotateCcw, Repeat } from 'lucide-react'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import { useSimulationStore } from '@/store/simulationStore'
import { LEVEL_LABELS, FUNDAMENTAL_LABELS } from '@/domain/constants'
import { ensureExerciseKeyframes } from '@/domain/simulation'
import type { CameraPreset } from '@/domain/types'

const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'top', label: '2D Tática' },
  { id: 'iso', label: 'Isométrica' },
  { id: 'side', label: 'Lateral' },
  { id: 'end', label: 'Fundo' },
]

export function PresentationOverlay() {
  const mode = useUiStore((s) => s.mode)
  const setMode = useUiStore((s) => s.setMode)
  const currentCamera = useUiStore((s) => s.camera.preset)
  const setCameraPreset = useUiStore((s) => s.setCameraPreset)
  const exercise = useDocumentStore((s) => s.exercise)
  const setKeyframesForExercise = useDocumentStore((s) => s.setKeyframesForExercise)

  const isPlaying = useSimulationStore((s) => s.isPlaying)
  const togglePlay = useSimulationStore((s) => s.togglePlay)
  const reset = useSimulationStore((s) => s.reset)
  const currentTime = useSimulationStore((s) => s.currentTime)
  const duration = useSimulationStore((s) => s.duration)
  const setDuration = useSimulationStore((s) => s.setDuration)
  const speed = useSimulationStore((s) => s.speed)
  const setSpeed = useSimulationStore((s) => s.setSpeed)
  const loop = useSimulationStore((s) => s.loop)
  const setLoop = useSimulationStore((s) => s.setLoop)

  const handleTogglePlay = () => {
    ensureExerciseKeyframes(exercise, (kfs, d) => {
      setKeyframesForExercise(kfs, d)
      if (d) setDuration(d)
    })
    togglePlay()
  }

  const [detailsOpen, setDetailsOpen] = useState(false)

  if (mode !== 'present') return null

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const formatSec = (sec: number) => {
    const s = Math.floor(sec)
    const ms = Math.floor((sec - s) * 10)
    return `${s.toString().padStart(2, '0')}.${ms}s`
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Banner */}
      <div className="flex items-start justify-between gap-4 pointer-events-auto">
        <div className="bg-[#121815]/90 backdrop-blur-md border border-[#1f2a24] p-4 rounded-2xl shadow-2xl max-w-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#c6f432]/20 text-[#c6f432] border border-[#c6f432]/40">
              Modo Apresentação
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1a231e] text-gray-300 border border-[#233028]">
              {LEVEL_LABELS[exercise.meta.level]}
            </span>
            {exercise.meta.durationMin > 0 && (
              <span className="text-xs text-gray-400 font-medium">
                {exercise.meta.durationMin} min
              </span>
            )}
          </div>

          <h1 className="text-xl md:text-2xl font-black text-white">{exercise.name}</h1>
          {exercise.meta.objective && (
            <p className="text-xs md:text-sm text-gray-300 mt-1 leading-snug">
              {exercise.meta.objective}
            </p>
          )}

          {/* Tags de fundamentos */}
          {exercise.meta.fundamentals.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {exercise.meta.fundamentals.map((f) => (
                <span
                  key={f}
                  className="px-2 py-0.5 bg-[#161e19] text-gray-300 text-[10px] rounded-md border border-[#233028]"
                >
                  {FUNDAMENTAL_LABELS[f]}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Botão Sair */}
        <button
          onClick={() => setMode('edit')}
          title="Sair do modo apresentação (Esc)"
          className="px-4 py-2 bg-[#121815]/90 hover:bg-[#1a231e] backdrop-blur-md border border-[#1f2a24] text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
        >
          <X className="w-4 h-4" />
          <span>Sair (Esc)</span>
        </button>
      </div>

      {/* Bottom Bar: Câmeras + Controles Grandes de Simulação + Instruções */}
      <div className="flex flex-wrap items-end justify-between gap-4 pointer-events-auto">
        {/* Presets de Câmera flutuantes */}
        <div className="flex items-center gap-1 bg-[#121815]/90 backdrop-blur-md border border-[#1f2a24] p-1.5 rounded-2xl shadow-xl">
          <div className="px-2 text-gray-400">
            <Camera className="w-4 h-4" />
          </div>
          {PRESETS.map((p) => {
            const active = currentCamera === p.id
            return (
              <button
                key={p.id}
                onClick={() => setCameraPreset(p.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                  active
                    ? 'bg-[#c6f432] text-[#0b0f0d] shadow-sm'
                    : 'text-gray-300 hover:text-white hover:bg-[#1a231e]'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Player de Simulação Flutuante Central */}
        <div className="flex items-center gap-2 bg-[#121815]/95 backdrop-blur-md border border-[#1f2a24] p-2 rounded-2xl shadow-2xl">
          <button
            onClick={handleTogglePlay}
            className={`p-3 rounded-xl font-bold transition-all shadow-md flex items-center justify-center ${
              isPlaying
                ? 'bg-[#ff8a3d] text-white hover:bg-[#ea580c]'
                : 'bg-[#c6f432] text-[#0b0f0d] hover:bg-[#b0de26]'
            }`}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </button>

          <button
            onClick={reset}
            title="Reiniciar jogada"
            className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a231e] border border-[#1f2a24] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="px-3 py-1.5 bg-[#161e19] border border-[#1f2a24] rounded-xl font-mono text-xs font-bold text-white flex items-center gap-1.5 shadow-inner">
            <span className="text-[#c6f432]">{formatSec(currentTime)}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">{formatSec(duration)}</span>
          </div>

          {/* Barra de progresso visual */}
          <div className="w-24 h-2 bg-[#0e1411] border border-[#1f2a24] rounded-full overflow-hidden hidden sm:block">
            <div className="h-full bg-[#c6f432] transition-all duration-75" style={{ width: `${progressPercent}%` }} />
          </div>

          <button
            onClick={() => setLoop(!loop)}
            title="Repetição contínua"
            className={`p-2 rounded-xl border transition-colors ${
              loop ? 'bg-[#c6f432]/15 text-[#c6f432] border-[#c6f432]/40' : 'text-gray-500 border-[#1f2a24]'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <div className="flex items-center bg-[#161e19] p-0.5 rounded-xl border border-[#1f2a24] text-xs font-semibold">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  speed === s ? 'bg-[#c6f432] text-[#0b0f0d] font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Botão para abrir instruções se houver */}
        {(exercise.meta.instructions || exercise.meta.notes) && (
          <div className="relative">
            <button
              onClick={() => setDetailsOpen((v) => !v)}
              className="px-4 py-2.5 bg-[#121815]/90 hover:bg-[#1a231e] backdrop-blur-md border border-[#1f2a24] text-white text-xs font-bold rounded-2xl shadow-xl flex items-center gap-2 transition-all"
            >
              <Info className="w-4 h-4 text-[#c6f432]" />
              <span>Instruções da Aula</span>
            </button>

            {detailsOpen && (
              <div className="absolute right-0 bottom-full mb-3 w-80 md:w-96 bg-[#121815]/95 backdrop-blur-lg border border-[#1f2a24] p-4 rounded-2xl shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#1f2a24] pb-2">
                  <h4 className="font-bold text-sm text-white">Como Executar</h4>
                  <button onClick={() => setDetailsOpen(false)} className="text-gray-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {exercise.meta.instructions && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 block mb-1">Passo a passo:</span>
                    <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {exercise.meta.instructions}
                    </p>
                  </div>
                )}
                {exercise.meta.notes && (
                  <div className="pt-2 border-t border-[#1f2a24]">
                    <span className="text-[11px] font-semibold text-[#c6f432] block mb-1">Dica do professor:</span>
                    <p className="text-xs text-gray-300 italic">
                      {exercise.meta.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
