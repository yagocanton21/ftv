import { useRef } from 'react'

export interface DisplayedKeyframe {
  id: string
  time: number
  action?: string
  color: string
  name: string
  isCurrentObject: boolean
}

interface KeyframeTrackProps {
  duration: number
  currentTime: number
  displayedKeyframes: DisplayedKeyframe[]
  onSeek: (time: number) => void
}

export function KeyframeTrack({
  duration,
  currentTime,
  displayedKeyframes,
  onSeek,
}: KeyframeTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio * duration)
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      className="w-full h-6 bg-[#0e1411] hover:bg-[#111915] border border-[#1f2a24] rounded-xl relative cursor-pointer select-none overflow-hidden transition-colors"
    >
      {/* Linhas de divisão de segundos */}
      <div className="absolute inset-0 flex justify-between pointer-events-none px-2">
        {Array.from({ length: Math.min(25, duration + 1) }).map((_, i) => {
          const s = Math.round((i / Math.min(24, duration)) * duration)
          return (
            <div key={i} className="flex flex-col items-center justify-between h-full py-0.5">
              <div className="w-px h-1 bg-[#233028]" />
              <span className="text-[8px] font-mono text-gray-600 leading-none">{s}s</span>
            </div>
          )
        })}
      </div>

      {/* Barra de progresso preenchida */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-[#c6f432]/10 border-r border-[#c6f432]/50 pointer-events-none transition-all duration-75"
        style={{ width: `${progressPercent}%` }}
      />

      {/* Marcadores de Keyframes no trilho */}
      {displayedKeyframes.map((k) => {
        const kfLeft = (k.time / duration) * 100
        const isCurrent = Math.abs(k.time - currentTime) < 0.2

        return (
          <div
            key={k.id}
            onClick={(e) => {
              e.stopPropagation()
              onSeek(k.time)
            }}
            title={`${k.name}: ponto aos ${k.time}s${k.action ? ` (${k.action})` : ''}`}
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 rounded-sm transition-transform cursor-pointer shadow-md ${
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
        <div className="w-2.5 h-2.5 bg-[#c6f432] rotate-45 -mt-0.5 shadow-md border border-[#0b0f0d]" />
      </div>
    </div>
  )
}
