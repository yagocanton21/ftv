import { ROLE_LABELS } from '@/domain/constants'
import type { PlayerObject } from '@/domain/types'
import { useDocumentStore } from '@/store/documentStore'

interface PlayerPropertiesProps {
  player: PlayerObject
}

export function PlayerProperties({ player }: PlayerPropertiesProps) {
  const updateObject = useDocumentStore((s) => s.updateObject)

  return (
    <div className="space-y-3 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="text-gray-400 block mb-1">Nome</label>
          <input
            type="text"
            value={player.name}
            onChange={(e) => updateObject(player.id, { name: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-[#0e1411] border border-[#233028] rounded-lg text-white"
          />
        </div>
        <div>
          <label className="text-gray-400 block mb-1">Número</label>
          <input
            type="number"
            value={player.number}
            onChange={(e) => updateObject(player.id, { number: parseInt(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-[#0e1411] border border-[#233028] rounded-lg text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 block mb-1">Papel</label>
          <select
            value={player.role}
            onChange={(e) => updateObject(player.id, { role: e.target.value as PlayerObject['role'] })}
            className="w-full px-2 py-1.5 bg-[#0e1411] border border-[#233028] rounded-lg text-white"
          >
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-400 block mb-1">Equipe</label>
          <select
            value={player.team ?? 'none'}
            onChange={(e) =>
              updateObject(player.id, { team: e.target.value === 'none' ? null : (e.target.value as 'A' | 'B') })
            }
            className="w-full px-2 py-1.5 bg-[#0e1411] border border-[#233028] rounded-lg text-white"
          >
            <option value="A">Equipe A</option>
            <option value="B">Equipe B</option>
            <option value="none">Nenhuma</option>
          </select>
        </div>
      </div>
    </div>
  )
}
