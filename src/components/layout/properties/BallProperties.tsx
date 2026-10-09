import type { BallObject } from '@/domain/types'
import { useDocumentStore } from '@/store/documentStore'
import { round } from '@/lib/utils'

interface BallPropertiesProps {
  ball: BallObject
}

export function BallProperties({ ball }: BallPropertiesProps) {
  const updateObject = useDocumentStore((s) => s.updateObject)

  return (
    <div className="space-y-3 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
      <div className="flex justify-between items-center">
        <label className="text-gray-400">Altura da bola</label>
        <span className="font-mono text-[#c6f432] font-semibold">{round(ball.height, 2)} m</span>
      </div>
      <input
        type="range"
        min="0"
        max="5"
        step="0.05"
        value={ball.height}
        onChange={(e) => updateObject(ball.id, { height: parseFloat(e.target.value) })}
        className="w-full accent-[#c6f432]"
      />
      <div className="grid grid-cols-4 gap-1 text-[10px]">
        {[
          { l: 'Areia', h: 0.11 },
          { l: 'Cintura', h: 1.0 },
          { l: 'Cabeça', h: 1.8 },
          { l: 'Rede', h: 2.2 },
        ].map((btn) => (
          <button
            key={btn.l}
            onClick={() => updateObject(ball.id, { height: btn.h })}
            className="px-1.5 py-1 bg-[#0e1411] border border-[#233028] rounded text-gray-300 hover:text-white"
          >
            {btn.l}
          </button>
        ))}
      </div>
    </div>
  )
}
