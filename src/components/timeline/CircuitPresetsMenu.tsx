import { Zap, ChevronDown } from 'lucide-react'
import { CIRCUIT_PRESETS, type CircuitPreset } from '@/domain/simulation'
import type { SceneObject } from '@/domain/types'

interface CircuitPresetsMenuProps {
  open: boolean
  onToggle: () => void
  selectedObject: SceneObject | null
  onApplyPreset: (preset: CircuitPreset) => void
}

export function CircuitPresetsMenu({
  open,
  onToggle,
  selectedObject,
  onApplyPreset,
}: CircuitPresetsMenuProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        title="Aplicar circuito pronto a este jogador com 1 clique"
        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-[#1a231e] hover:bg-[#233028] text-amber-300 border border-amber-500/30 transition-all shadow-sm"
      >
        <Zap className="w-3 h-3 fill-current" />
        <span>Circuitos</span>
        <ChevronDown className="w-2.5 h-2.5" />
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-60 bg-[#121815] border border-[#233028] rounded-2xl shadow-2xl p-2 z-50 flex flex-col gap-1">
          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 border-b border-[#1f2a24] mb-0.5">
            Aplicar em {selectedObject?.type === 'player' ? selectedObject.name : 'atleta'}:
          </div>
          {CIRCUIT_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onApplyPreset(p)}
              className="text-left p-1.5 rounded-xl hover:bg-[#1a231e] text-white hover:text-[#c6f432] transition-colors flex flex-col"
            >
              <span className="font-bold text-xs">{p.name}</span>
              <span className="text-[10px] text-gray-400 leading-tight">{p.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
