import { NET_PRESETS } from '@/domain/constants'
import { useDocumentStore } from '@/store/documentStore'

export function CourtProperties() {
  const court = useDocumentStore((s) => s.exercise.court)
  const updateCourt = useDocumentStore((s) => s.updateCourt)

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      {/* Altura da rede */}
      <div className="space-y-2 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-medium">Altura da rede</span>
          <span className="text-[#c6f432] font-mono font-bold text-sm">
            {court.netHeight.toFixed(2)} m
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {NET_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => updateCourt({ netHeight: p.height })}
              className={`py-1.5 rounded-lg border text-center transition-colors ${
                court.netHeight === p.height
                  ? 'bg-[#c6f432]/20 border-[#c6f432] text-white font-semibold'
                  : 'bg-[#0e1411] border-[#233028] text-gray-400 hover:text-white'
              }`}
            >
              <div className="text-[10px]">{p.label}</div>
              <div className="font-mono text-xs">{p.height}m</div>
            </button>
          ))}
        </div>
        <input
          type="range"
          min="1.8"
          max="2.5"
          step="0.01"
          value={court.netHeight}
          onChange={(e) => updateCourt({ netHeight: parseFloat(e.target.value) })}
          className="w-full accent-[#c6f432] mt-1"
        />
      </div>

      {/* Dimensões da quadra */}
      <div className="space-y-3 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
        <span className="text-gray-400 font-medium block">Dimensões da quadra</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-gray-400 block mb-1">Comprimento (m)</label>
            <input
              type="number"
              value={court.length}
              onChange={(e) => updateCourt({ length: parseFloat(e.target.value) || 18 })}
              className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white font-mono"
            />
          </div>
          <div>
            <label className="text-gray-400 block mb-1">Largura (m)</label>
            <input
              type="number"
              value={court.width}
              onChange={(e) => updateCourt({ width: parseFloat(e.target.value) || 9 })}
              className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Grade de 1m */}
      <div className="flex items-center justify-between p-3 bg-[#161e19] rounded-xl border border-[#1f2a24]">
        <div>
          <span className="text-white font-medium block">Grade de medição (1m)</span>
          <span className="text-[10px] text-gray-500">Linhas no chão a cada metro</span>
        </div>
        <input
          type="checkbox"
          checked={court.showGrid}
          onChange={(e) => updateCourt({ showGrid: e.target.checked })}
          className="w-4 h-4 accent-[#c6f432] rounded cursor-pointer"
        />
      </div>
    </div>
  )
}
