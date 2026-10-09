import type { ZoneObject } from '@/domain/types'
import { useDocumentStore } from '@/store/documentStore'

interface ZonePropertiesProps {
  zone: ZoneObject
}

export function ZoneProperties({ zone }: ZonePropertiesProps) {
  const updateObject = useDocumentStore((s) => s.updateObject)

  return (
    <div className="space-y-3 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
      <div>
        <label className="text-gray-400 block mb-1">Formato</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateObject(zone.id, { shape: 'rect' })}
            className={`py-1.5 rounded-lg border text-center ${
              zone.shape === 'rect' ? 'bg-[#c6f432]/20 border-[#c6f432] text-white' : 'border-[#233028] text-gray-400'
            }`}
          >
            Retângulo
          </button>
          <button
            onClick={() => updateObject(zone.id, { shape: 'circle' })}
            className={`py-1.5 rounded-lg border text-center ${
              zone.shape === 'circle' ? 'bg-[#c6f432]/20 border-[#c6f432] text-white' : 'border-[#233028] text-gray-400'
            }`}
          >
            Círculo
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 block mb-1">Largura (m)</label>
          <input
            type="number"
            step="0.5"
            value={zone.size.w}
            onChange={(e) => updateObject(zone.id, { size: { ...zone.size, w: parseFloat(e.target.value) || 1 } })}
            className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white"
          />
        </div>
        <div>
          <label className="text-gray-400 block mb-1">Profundidade (m)</label>
          <input
            type="number"
            step="0.5"
            value={zone.size.d}
            onChange={(e) => updateObject(zone.id, { size: { ...zone.size, d: parseFloat(e.target.value) || 1 } })}
            className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white"
          />
        </div>
      </div>
    </div>
  )
}
