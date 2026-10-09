import { FUNDAMENTALS, FUNDAMENTAL_LABELS, LEVEL_LABELS } from '@/domain/constants'
import type { Fundamental, Level } from '@/domain/types'
import { useDocumentStore } from '@/store/documentStore'

interface ExercisePropertiesProps {
  materials: string[]
}

export function ExerciseProperties({ materials }: ExercisePropertiesProps) {
  const exercise = useDocumentStore((s) => s.exercise)
  const updateMeta = useDocumentStore((s) => s.updateMeta)

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
      {/* Objetivo */}
      <div>
        <label className="text-gray-400 block mb-1 font-medium">Objetivo do exercício</label>
        <textarea
          rows={2}
          value={exercise.meta.objective}
          onChange={(e) => updateMeta({ objective: e.target.value })}
          placeholder="Ex: Aprimorar deslocamento e recepção..."
          className="w-full px-2.5 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#c6f432]"
        />
      </div>

      {/* Nível e Duração */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-gray-400 block mb-1 font-medium">Nível</label>
          <select
            value={exercise.meta.level}
            onChange={(e) => updateMeta({ level: e.target.value as Level })}
            className="w-full px-2 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white"
          >
            {Object.entries(LEVEL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-gray-400 block mb-1 font-medium">Duração (min)</label>
          <input
            type="number"
            value={exercise.meta.durationMin}
            onChange={(e) => updateMeta({ durationMin: parseInt(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white font-mono"
          />
        </div>
      </div>

      {/* Séries, Repetições, Descanso */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-gray-400 block mb-1 font-medium">Séries</label>
          <input
            type="number"
            value={exercise.meta.sets}
            onChange={(e) => updateMeta({ sets: parseInt(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white font-mono"
          />
        </div>
        <div>
          <label className="text-gray-400 block mb-1 font-medium">Repetições</label>
          <input
            type="number"
            value={exercise.meta.reps}
            onChange={(e) => updateMeta({ reps: parseInt(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white font-mono"
          />
        </div>
        <div>
          <label className="text-gray-400 block mb-1 font-medium">Descanso (s)</label>
          <input
            type="number"
            value={exercise.meta.restSec}
            onChange={(e) => updateMeta({ restSec: parseInt(e.target.value) || 0 })}
            className="w-full px-2.5 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white font-mono"
          />
        </div>
      </div>

      {/* Fundamentos trabalhados */}
      <div>
        <label className="text-gray-400 block mb-1.5 font-medium">Fundamentos</label>
        <div className="flex flex-wrap gap-1.5">
          {(FUNDAMENTALS as readonly Fundamental[]).map((f) => {
            const selected = exercise.meta.fundamentals.includes(f)
            return (
              <button
                key={f}
                onClick={() => {
                  const next = selected
                    ? exercise.meta.fundamentals.filter((x) => x !== f)
                    : [...exercise.meta.fundamentals, f]
                  updateMeta({ fundamentals: next as Fundamental[] })
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                  selected
                    ? 'bg-[#c6f432]/20 border-[#c6f432] text-[#c6f432]'
                    : 'bg-[#161e19] border-[#233028] text-gray-400 hover:text-white'
                }`}
              >
                {FUNDAMENTAL_LABELS[f]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Materiais necessários (calculado dinamicamente) */}
      <div className="bg-[#161e19] p-3 rounded-xl border border-[#1f2a24] space-y-1.5">
        <span className="text-gray-400 font-medium block">Materiais na quadra</span>
        {materials.length === 0 ? (
          <span className="text-gray-500 italic block">Nenhum equipamento adicionado</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {materials.map((m, i) => (
              <span key={i} className="px-2 py-0.5 bg-[#0e1411] border border-[#233028] rounded text-gray-300">
                {m}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Instruções de execução */}
      <div>
        <label className="text-gray-400 block mb-1 font-medium">Instruções de execução</label>
        <textarea
          rows={4}
          value={exercise.meta.instructions}
          onChange={(e) => updateMeta({ instructions: e.target.value })}
          placeholder="Passo a passo do exercício para os alunos..."
          className="w-full px-2.5 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#c6f432]"
        />
      </div>

      {/* Observações */}
      <div>
        <label className="text-gray-400 block mb-1 font-medium">Observações do professor</label>
        <textarea
          rows={2}
          value={exercise.meta.notes}
          onChange={(e) => updateMeta({ notes: e.target.value })}
          placeholder="Dicas de correção e pontos de atenção..."
          className="w-full px-2.5 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#c6f432]"
        />
      </div>
    </div>
  )
}
