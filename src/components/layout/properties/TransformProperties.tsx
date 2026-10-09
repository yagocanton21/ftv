import { RotateCw, RotateCcw } from 'lucide-react'
import { COLOR_PALETTE } from '@/domain/constants'
import type { SceneObject } from '@/domain/types'
import { useDocumentStore } from '@/store/documentStore'
import { rotateSelected } from '@/services/editorActions'
import { round } from '@/lib/utils'

interface TransformPropertiesProps {
  object: SceneObject
}

export function TransformProperties({ object }: TransformPropertiesProps) {
  const updateObject = useDocumentStore((s) => s.updateObject)

  return (
    <>
      {/* Seletor de Cores */}
      <div>
        <label className="text-gray-400 block mb-2 font-medium">Cor</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => updateObject(object.id, { color: c })}
              className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                object.color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Posição e Rotação */}
      <div className="space-y-3 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 font-medium">Posição na areia</span>
          <span className="text-[11px] text-gray-500 font-mono">
            X: {round(object.position.x, 1)}m | Z: {round(object.position.z, 1)}m
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-gray-400 block mb-1">X (Comprimento)</label>
            <input
              type="number"
              step="0.2"
              value={round(object.position.x, 2)}
              onChange={(e) =>
                updateObject(object.id, {
                  position: { x: parseFloat(e.target.value) || 0, z: object.position.z },
                })
              }
              className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white font-mono"
            />
          </div>
          <div>
            <label className="text-gray-400 block mb-1">Z (Largura)</label>
            <input
              type="number"
              step="0.2"
              value={round(object.position.z, 2)}
              onChange={(e) =>
                updateObject(object.id, {
                  position: { x: object.position.x, z: parseFloat(e.target.value) || 0 },
                })
              }
              className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white font-mono"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#233028]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 font-medium">Orientação</span>
            <span className="text-[11px] text-[#c6f432] font-mono">{round(object.rotation, 0)}°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => rotateSelected(-15)}
              title="Girar -15° (Shift+R)"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#0e1411] border border-[#233028] rounded text-gray-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              -15°
            </button>
            <button
              onClick={() => rotateSelected(15)}
              title="Girar +15° (R)"
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-[#0e1411] border border-[#233028] rounded text-gray-300 hover:text-white"
            >
              <RotateCw className="w-3.5 h-3.5" />
              +15°
            </button>
            <button
              onClick={() => updateObject(object.id, { rotation: object.position.x <= 0 ? 0 : 180 })}
              title="Virar para a rede"
              className="px-2 py-1.5 bg-[#0e1411] border border-[#233028] rounded text-gray-300 hover:text-white"
            >
              Rede
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
