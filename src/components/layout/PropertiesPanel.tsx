import { useState, useEffect } from 'react'
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Grid,
  FileText,
} from 'lucide-react'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import { OBJECT_LABELS } from '@/domain/constants'
import { materialsFromObjects } from '@/domain/factories'
import type { PlayerObject, BallObject, ZoneObject } from '@/domain/types'
import { deleteSelected, duplicateSelected } from '@/services/editorActions'
import { PlayerProperties } from './properties/PlayerProperties'
import { BallProperties } from './properties/BallProperties'
import { ZoneProperties } from './properties/ZoneProperties'
import { TransformProperties } from './properties/TransformProperties'
import { MultiSelectProperties } from './properties/MultiSelectProperties'
import { ExerciseProperties } from './properties/ExerciseProperties'
import { CourtProperties } from './properties/CourtProperties'

export function PropertiesPanel() {
  const exercise = useDocumentStore((s) => s.exercise)
  const updateObject = useDocumentStore((s) => s.updateObject)

  const selectedIds = useUiStore((s) => s.selectedIds)
  const recordingPlayerId = useUiStore((s) => s.recordingPlayerId)
  const [activeTab, setActiveTab] = useState<'exercise' | 'court'>('exercise')
  const [collapsed, setCollapsed] = useState(false)

  // Abre automaticamente quando o professor seleciona um atleta ou objeto na quadra,
  // exceto se estiver no modo de gravação de trajeto na areia (para não cobrir a quadra)
  useEffect(() => {
    if (selectedIds.length > 0 && !recordingPlayerId) {
      setCollapsed(false)
    }
  }, [selectedIds.length, recordingPlayerId])

  // Recolhe automaticamente ao entrar no modo de gravar trajeto na areia para deixar a quadra 100% visível
  useEffect(() => {
    if (recordingPlayerId) {
      setCollapsed(true)
    }
  }, [recordingPlayerId])

  const selectedObjects = exercise.objects.filter((o) => selectedIds.includes(o.id))
  const single = selectedObjects.length === 1 ? selectedObjects[0] : null
  const isMulti = selectedObjects.length > 1
  const materials = materialsFromObjects(exercise.objects)

  return (
    <aside
      className={`absolute right-3 sm:right-4 top-16 md:top-18 bottom-auto max-h-[calc(100vh-5.5rem)] z-30 flex transition-all duration-300 ${
        collapsed ? 'translate-x-[calc(100%+16px)]' : 'translate-x-0'
      }`}
    >
      {/* Botão de abrir/fechar painel lateral */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Abrir Ficha Técnica do Treino' : 'Recolher Ficha'}
        className={`absolute -left-28 top-2 px-2.5 py-1.5 rounded-l-xl bg-[#121815]/95 backdrop-blur-md border-y border-l border-[#1f2a24] flex items-center gap-1.5 text-xs font-bold transition-all shadow-xl select-none ${
          collapsed
            ? 'text-gray-200 hover:text-[#c6f432] bg-[#161e19] border-[#2b3a31]'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <FileText className="w-3.5 h-3.5 text-[#c6f432]" />
        <span>{collapsed ? 'Ficha' : 'Recolher'}</span>
        {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      <div className="w-72 sm:w-80 max-w-[85vw] bg-[#121815]/95 backdrop-blur-md border border-[#1f2a24] rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[calc(100vh-5.5rem)]">
        {/* CASO 1: Único objeto selecionado */}
        {single && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header do objeto */}
            <div className="p-3 px-3.5 border-b border-[#1f2a24] flex items-center justify-between bg-[#0e1411]">
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
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              {single.type === 'player' && <PlayerProperties player={single as PlayerObject} />}
              {single.type === 'ball' && <BallProperties ball={single as BallObject} />}
              {single.type === 'zone' && <ZoneProperties zone={single as ZoneObject} />}
              <TransformProperties object={single} />
            </div>
          </div>
        )}

        {/* CASO 2: Múltiplos objetos selecionados */}
        {isMulti && <MultiSelectProperties selectedObjects={selectedObjects} />}

        {/* CASO 3: Nenhum objeto selecionado (Exercício & Quadra) */}
        {!single && !isMulti && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Abas */}
            <div className="grid grid-cols-2 border-b border-[#1f2a24] bg-[#0e1411]">
              <button
                onClick={() => setActiveTab('exercise')}
                className={`py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
                  activeTab === 'exercise'
                    ? 'border-[#c6f432] text-[#c6f432]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Exercício
              </button>
              <button
                onClick={() => setActiveTab('court')}
                className={`py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border-b-2 ${
                  activeTab === 'court'
                    ? 'border-[#c6f432] text-[#c6f432]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Quadra
              </button>
            </div>

            {/* Conteúdo das abas */}
            {activeTab === 'exercise' && <ExerciseProperties materials={materials} />}
            {activeTab === 'court' && <CourtProperties />}
          </div>
        )}
      </div>
    </aside>
  )
}
