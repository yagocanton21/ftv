import { Lock, Trash2 } from 'lucide-react'
import { COLOR_PALETTE } from '@/domain/constants'
import type { SceneObject } from '@/domain/types'
import { useDocumentStore } from '@/store/documentStore'
import { deleteSelected } from '@/services/editorActions'

interface MultiSelectPropertiesProps {
  selectedObjects: SceneObject[]
}

export function MultiSelectProperties({ selectedObjects }: MultiSelectPropertiesProps) {
  const updateObjects = useDocumentStore((s) => s.updateObjects)

  return (
    <div className="flex-1 flex flex-col p-3 space-y-3 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[#1f2a24]">
        <span className="font-bold text-white text-xs">
          {selectedObjects.length} objetos selecionados
        </span>
        <button
          onClick={deleteSelected}
          className="p-1 rounded-lg border border-[#2b3a31] text-gray-400 hover:text-red-400 hover:bg-[#231518] transition-colors"
          title="Excluir todos"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] text-gray-400 block font-medium">Alterar cor em lote</label>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => {
                const patches = Object.fromEntries(selectedObjects.map((o) => [o.id, { color: c }]))
                updateObjects(patches)
              }}
              className="w-5 h-5 rounded-full border-2 border-transparent hover:border-white transition-transform hover:scale-110"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-[#1f2a24]">
        <button
          onClick={() => {
            const lock = !selectedObjects.every((o) => o.locked)
            const patches = Object.fromEntries(selectedObjects.map((o) => [o.id, { locked: lock }]))
            updateObjects(patches)
          }}
          className="w-full py-1.5 bg-[#161e19] hover:bg-[#1f2a24] border border-[#233028] rounded-xl text-gray-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Lock className="w-3.5 h-3.5" />
          Bloquear / Desbloquear seleção
        </button>
      </div>
    </div>
  )
}
