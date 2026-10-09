import {
  MousePointer,
  User,
  CircleDot,
  Cone,
  Disc,
  Target,
  Maximize2,
  MinusCircle,
} from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { activateTool } from '@/services/editorActions'
import type { Tool } from '@/domain/types'

interface ToolItem {
  id: Tool
  label: string
  shortcut?: string
  icon: React.ComponentType<{ className?: string }>
}

const TOOLS: ToolItem[] = [
  { id: 'select', label: 'Selecionar', shortcut: 'V', icon: MousePointer },
  { id: 'player', label: 'Jogador', shortcut: 'P', icon: User },
  { id: 'ball', label: 'Bola', shortcut: 'B', icon: CircleDot },
  { id: 'cone', label: 'Cone', shortcut: 'C', icon: Cone },
  { id: 'hoop', label: 'Arco', icon: Disc },
  { id: 'marker', label: 'Marcador', icon: Target },
  { id: 'zone', label: 'Zona / Alvo', icon: Maximize2 },
  { id: 'obstacle', label: 'Obstáculo', icon: MinusCircle },
]

export function ToolBar() {
  const currentTool = useUiStore((s) => s.tool)

  return (
    <aside className="absolute left-4 top-20 z-30 flex flex-col items-center bg-[#121815]/90 backdrop-blur-md border border-[#1f2a24] p-1.5 rounded-2xl shadow-xl space-y-1">
      {TOOLS.map((t, idx) => {
        const Icon = t.icon
        const isActive = currentTool === t.id
        const isSeparator = idx === 1

        return (
          <div key={t.id} className="w-full flex flex-col items-center">
            {isSeparator && <div className="w-6 h-px bg-[#1f2a24] my-1" />}
            <button
              onClick={() => activateTool(t.id)}
              title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ''} - Clique na areia para posicionar`}
              className={`relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[#c6f432] text-[#0b0f0d] shadow-md shadow-[#c6f432]/20 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a231e]'
              }`}
            >
              <Icon className="w-5 h-5" />

              {/* Tooltip flutuante */}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1a231e] border border-[#2b3a31] text-xs text-white rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-lg flex items-center gap-1.5">
                <span>{t.label}</span>
                {t.shortcut && (
                  <kbd className="px-1.5 py-0.5 bg-[#233028] text-[10px] text-[#c6f432] rounded font-mono">
                    {t.shortcut}
                  </kbd>
                )}
              </div>
            </button>
          </div>
        )
      })}
    </aside>
  )
}
