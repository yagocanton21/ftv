import { useState, useEffect } from 'react'
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  RotateCw,
  RotateCcw,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Grid,
  FileText,
} from 'lucide-react'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import {
  COLOR_PALETTE,
  FUNDAMENTALS,
  FUNDAMENTAL_LABELS,
  LEVEL_LABELS,
  NET_PRESETS,
  OBJECT_LABELS,
  ROLE_LABELS,
} from '@/domain/constants'
import { materialsFromObjects } from '@/domain/factories'
import type { Fundamental, Level, PlayerObject, BallObject, ZoneObject } from '@/domain/types'
import { deleteSelected, duplicateSelected, rotateSelected } from '@/services/editorActions'
import { round } from '@/lib/utils'

export function PropertiesPanel() {
  const exercise = useDocumentStore((s) => s.exercise)
  const updateMeta = useDocumentStore((s) => s.updateMeta)
  const updateCourt = useDocumentStore((s) => s.updateCourt)
  const updateObject = useDocumentStore((s) => s.updateObject)
  const updateObjects = useDocumentStore((s) => s.updateObjects)

  const selectedIds = useUiStore((s) => s.selectedIds)
  const [activeTab, setActiveTab] = useState<'exercise' | 'court'>('exercise')
  const [collapsed, setCollapsed] = useState(false)

  // Abre automaticamente quando o professor seleciona um atleta ou objeto na quadra
  useEffect(() => {
    if (selectedIds.length > 0) {
      setCollapsed(false)
    }
  }, [selectedIds.length])

  const selectedObjects = exercise.objects.filter((o) => selectedIds.includes(o.id))
  const single = selectedObjects.length === 1 ? selectedObjects[0] : null
  const isMulti = selectedObjects.length > 1

  const materials = materialsFromObjects(exercise.objects)

  return (
    <aside
      className={`absolute right-4 top-20 bottom-6 z-30 flex transition-all duration-300 ${
        collapsed ? 'translate-x-[calc(100%+16px)]' : 'translate-x-0'
      }`}
    >
      {/* Botão de abrir/fechar painel lateral com rótulo claro e amigável */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Abrir Ficha Técnica do Treino' : 'Recolher Ficha'}
        className={`absolute -left-32 top-3 px-3 py-1.5 rounded-l-xl bg-[#121815]/95 backdrop-blur-md border-y border-l border-[#1f2a24] flex items-center gap-1.5 text-xs font-bold transition-all shadow-xl select-none ${
          collapsed
            ? 'text-gray-200 hover:text-[#c6f432] bg-[#161e19] border-[#2b3a31]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <FileText className="w-3.5 h-3.5 text-[#c6f432]" />
        <span>{collapsed ? 'Ficha Treino' : 'Recolher'}</span>
        {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      <div className="w-80 md:w-96 bg-[#121815]/95 backdrop-blur-md border border-[#1f2a24] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* CASO 1: Único objeto selecionado */}
        {single && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header do objeto */}
            <div className="p-4 border-b border-[#1f2a24] flex items-center justify-between bg-[#0e1411]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: single.color }} />
                <h3 className="font-bold text-sm text-white">{OBJECT_LABELS[single.type]}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateObject(single.id, { locked: !single.locked })}
                  title={single.locked ? 'Desbloquear' : 'Bloquear'}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    single.locked
                      ? 'bg-red-500/20 text-red-400 border-red-500/40'
                      : 'text-gray-400 hover:text-white border-[#2b3a31]'
                  }`}
                >
                  {single.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
                <button
                  onClick={duplicateSelected}
                  title="Duplicar (Ctrl+D)"
                  className="p-1.5 rounded-lg border border-[#2b3a31] text-gray-400 hover:text-white hover:bg-[#1a231e] transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={single.locked}
                  title="Excluir (Del)"
                  className="p-1.5 rounded-lg border border-[#2b3a31] text-gray-400 hover:text-red-400 hover:bg-[#231518] disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Conteúdo scrollável de propriedades */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Propriedades específicas de Jogador */}
              {single.type === 'player' && (
                (() => {
                  const p = single as PlayerObject
                  return (
                    <div className="space-y-3 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-gray-400 block mb-1">Nome</label>
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => updateObject(p.id, { name: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-[#0e1411] border border-[#233028] rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 block mb-1">Número</label>
                          <input
                            type="number"
                            value={p.number}
                            onChange={(e) => updateObject(p.id, { number: parseInt(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 bg-[#0e1411] border border-[#233028] rounded-lg text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-gray-400 block mb-1">Papel</label>
                          <select
                            value={p.role}
                            onChange={(e) => updateObject(p.id, { role: e.target.value as PlayerObject['role'] })}
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
                            value={p.team ?? 'none'}
                            onChange={(e) =>
                              updateObject(p.id, { team: e.target.value === 'none' ? null : (e.target.value as 'A' | 'B') })
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
                })()
              )}

              {/* Propriedades específicas de Bola */}
              {single.type === 'ball' && (
                (() => {
                  const b = single as BallObject
                  return (
                    <div className="space-y-3 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
                      <div className="flex justify-between items-center">
                        <label className="text-gray-400">Altura da bola</label>
                        <span className="font-mono text-[#c6f432] font-semibold">{round(b.height, 2)} m</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.05"
                        value={b.height}
                        onChange={(e) => updateObject(b.id, { height: parseFloat(e.target.value) })}
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
                            onClick={() => updateObject(b.id, { height: btn.h })}
                            className="px-1.5 py-1 bg-[#0e1411] border border-[#233028] rounded text-gray-300 hover:text-white"
                          >
                            {btn.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()
              )}

              {/* Propriedades específicas de Zona */}
              {single.type === 'zone' && (
                (() => {
                  const z = single as ZoneObject
                  return (
                    <div className="space-y-3 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
                      <div>
                        <label className="text-gray-400 block mb-1">Formato</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => updateObject(z.id, { shape: 'rect' })}
                            className={`py-1.5 rounded-lg border text-center ${
                              z.shape === 'rect' ? 'bg-[#c6f432]/20 border-[#c6f432] text-white' : 'border-[#233028] text-gray-400'
                            }`}
                          >
                            Retângulo
                          </button>
                          <button
                            onClick={() => updateObject(z.id, { shape: 'circle' })}
                            className={`py-1.5 rounded-lg border text-center ${
                              z.shape === 'circle' ? 'bg-[#c6f432]/20 border-[#c6f432] text-white' : 'border-[#233028] text-gray-400'
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
                            value={z.size.w}
                            onChange={(e) => updateObject(z.id, { size: { ...z.size, w: parseFloat(e.target.value) || 1 } })}
                            className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 block mb-1">Profundidade (m)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={z.size.d}
                            onChange={(e) => updateObject(z.id, { size: { ...z.size, d: parseFloat(e.target.value) || 1 } })}
                            className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()
              )}

              {/* Cor */}
              <div>
                <label className="text-gray-400 block mb-2 font-medium">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateObject(single.id, { color: c })}
                      className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        single.color === c ? 'border-white scale-110' : 'border-transparent'
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
                    X: {round(single.position.x, 1)}m | Z: {round(single.position.z, 1)}m
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-400 block mb-1">X (Comprimento)</label>
                    <input
                      type="number"
                      step="0.2"
                      value={round(single.position.x, 2)}
                      onChange={(e) =>
                        updateObject(single.id, {
                          position: { x: parseFloat(e.target.value) || 0, z: single.position.z },
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
                      value={round(single.position.z, 2)}
                      onChange={(e) =>
                        updateObject(single.id, {
                          position: { x: single.position.x, z: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#233028]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400 font-medium">Orientação</span>
                    <span className="text-[11px] text-[#c6f432] font-mono">{round(single.rotation, 0)}°</span>
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
                      onClick={() => updateObject(single.id, { rotation: single.position.x <= 0 ? 0 : 180 })}
                      title="Virar para a rede"
                      className="px-2 py-1.5 bg-[#0e1411] border border-[#233028] rounded text-gray-300 hover:text-white"
                    >
                      Rede
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CASO 2: Múltiplos objetos selecionados */}
        {isMulti && (
          <div className="flex-1 flex flex-col p-4 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1f2a24]">
              <span className="font-bold text-white text-sm">
                {selectedObjects.length} objetos selecionados
              </span>
              <button
                onClick={deleteSelected}
                className="p-1.5 rounded-lg border border-[#2b3a31] text-gray-400 hover:text-red-400 hover:bg-[#231518] transition-colors"
                title="Excluir todos"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-gray-400 block font-medium">Alterar cor em lote</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      const patches = Object.fromEntries(selectedObjects.map((o) => [o.id, { color: c }]))
                      updateObjects(patches)
                    }}
                    className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white transition-transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-[#1f2a24]">
              <button
                onClick={() => {
                  const lock = !selectedObjects.every((o) => o.locked)
                  const patches = Object.fromEntries(selectedObjects.map((o) => [o.id, { locked: lock }]))
                  updateObjects(patches)
                }}
                className="w-full py-2 bg-[#161e19] hover:bg-[#1f2a24] border border-[#233028] rounded-xl text-gray-200 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Bloquear / Desbloquear seleção
              </button>
            </div>
          </div>
        )}

        {/* CASO 3: Nenhum objeto selecionado (Exercício & Quadra) */}
        {!single && !isMulti && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Abas */}
            <div className="grid grid-cols-2 border-b border-[#1f2a24] bg-[#0e1411]">
              <button
                onClick={() => setActiveTab('exercise')}
                className={`py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
                  activeTab === 'exercise'
                    ? 'border-[#c6f432] text-[#c6f432]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Sliders className="w-4 h-4" />
                Exercício
              </button>
              <button
                onClick={() => setActiveTab('court')}
                className={`py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
                  activeTab === 'court'
                    ? 'border-[#c6f432] text-[#c6f432]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-4 h-4" />
                Quadra
              </button>
            </div>

            {/* Aba do Exercício */}
            {activeTab === 'exercise' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
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
                      className="w-full px-2 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1 font-medium">Repetições</label>
                    <input
                      type="number"
                      value={exercise.meta.reps}
                      onChange={(e) => updateMeta({ reps: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1 font-medium">Descanso (s)</label>
                    <input
                      type="number"
                      value={exercise.meta.restSec}
                      onChange={(e) => updateMeta({ restSec: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 bg-[#161e19] border border-[#233028] rounded-xl text-white font-mono"
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
            )}

            {/* Aba da Quadra */}
            {activeTab === 'court' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* Altura da rede */}
                <div className="space-y-2 bg-[#161e19] p-3 rounded-xl border border-[#1f2a24]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 font-medium">Altura da rede</span>
                    <span className="text-[#c6f432] font-mono font-bold text-sm">
                      {exercise.court.netHeight.toFixed(2)} m
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {NET_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => updateCourt({ netHeight: p.height })}
                        className={`py-1.5 rounded-lg border text-center transition-colors ${
                          exercise.court.netHeight === p.height
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
                    value={exercise.court.netHeight}
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
                        value={exercise.court.length}
                        onChange={(e) => updateCourt({ length: parseFloat(e.target.value) || 18 })}
                        className="w-full px-2 py-1 bg-[#0e1411] border border-[#233028] rounded text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 block mb-1">Largura (m)</label>
                      <input
                        type="number"
                        value={exercise.court.width}
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
                    checked={exercise.court.showGrid}
                    onChange={(e) => updateCourt({ showGrid: e.target.checked })}
                    className="w-4 h-4 accent-[#c6f432] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
