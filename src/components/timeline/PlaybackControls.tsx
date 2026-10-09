import { Play, Pause, RotateCcw, Repeat } from 'lucide-react'

interface PlaybackControlsProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  speed: number
  loop: boolean
  onTogglePlay: () => void
  onReset: () => void
  onSetSpeed: (speed: number) => void
  onSetLoop: (loop: boolean) => void
}

export function PlaybackControls({
  isPlaying,
  currentTime,
  duration,
  speed,
  loop,
  onTogglePlay,
  onReset,
  onSetSpeed,
  onSetLoop,
}: PlaybackControlsProps) {
  const displayTime = (sec: number) => {
    const s = Math.floor(sec)
    const ms = Math.floor((sec - s) * 10)
    return `${s.toString().padStart(2, '0')}.${ms}s`
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={onTogglePlay}
        title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir Simulação 3D (Espaço)'}
        className={`px-2.5 py-1 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 ${
          isPlaying
            ? 'bg-[#ff8a3d] text-white hover:bg-[#ea580c] shadow-[#ff8a3d]/20'
            : 'bg-[#c6f432] text-[#0b0f0d] hover:bg-[#b0de26] shadow-[#c6f432]/20'
        }`}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        <span>{isPlaying ? 'Pausar' : 'Demonstrar'}</span>
      </button>

      <button
        onClick={onReset}
        title="Voltar ao início (00:00)"
        className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a231e] border border-[#1f2a24] transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <div className="px-2 py-0.5 bg-[#161e19] border border-[#1f2a24] rounded-lg font-mono text-[11px] font-semibold text-white flex items-center gap-1 shadow-inner">
        <span className="text-[#c6f432]">{displayTime(currentTime)}</span>
        <span className="text-gray-500">/</span>
        <span className="text-gray-400">{displayTime(duration)}</span>
      </div>

      {/* Botão de Loop */}
      <button
        onClick={() => onSetLoop(!loop)}
        title={loop ? 'Repetição contínua ligada' : 'Repetição desligada'}
        className={`p-1.5 rounded-lg border transition-colors ${
          loop
            ? 'bg-[#c6f432]/15 text-[#c6f432] border-[#c6f432]/40'
            : 'text-gray-500 hover:text-gray-300 border-[#1f2a24]'
        }`}
      >
        <Repeat className="w-3 h-3" />
      </button>

      {/* Seletor de Velocidade */}
      <div className="flex items-center bg-[#161e19] p-0.5 rounded-lg border border-[#1f2a24] text-[10px] font-semibold">
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            onClick={() => onSetSpeed(s)}
            className={`px-1.5 py-0.5 rounded transition-colors ${
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
  )
}
