import { useState, useRef } from 'react'
import {
  Save,
  Undo2,
  Redo2,
  FolderOpen,
  Download,
  Image,
  FileJson,
  Upload,
  Play,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lightbulb,
} from 'lucide-react'
import { useDocumentStore, useHistory } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import { exportPng, exportJson, importJsonFile, saveNow } from '@/services/projectActions'
import type { CameraPreset } from '@/domain/types'

interface TopBarProps {
  onOpenProjects: () => void
  onOpenShortcuts: () => void
  onOpenGuide: () => void
}

const PRESETS: { id: CameraPreset; label: string; shortcut: string }[] = [
  { id: 'top', label: '2D Tática', shortcut: '1' },
  { id: 'iso', label: 'Isométrica', shortcut: '2' },
  { id: 'side', label: 'Lateral', shortcut: '3' },
  { id: 'end', label: 'Fundo', shortcut: '4' },
]

export function TopBar({ onOpenProjects, onOpenShortcuts, onOpenGuide }: TopBarProps) {
  const exerciseName = useDocumentStore((s) => s.exercise.name)
  const rename = useDocumentStore((s) => s.rename)
  const { canUndo, canRedo, undo, redo } = useHistory()
  const currentCamera = useUiStore((s) => s.camera.preset)
  const setCameraPreset = useUiStore((s) => s.setCameraPreset)
  const saveStatus = useUiStore((s) => s.saveStatus)
  const setMode = useUiStore((s) => s.setMode)

  const [exportOpen, setExportOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await importJsonFile(file)
      e.target.value = ''
    }
  }

  return (
    <header className="h-14 bg-[#121815]/95 backdrop-blur border-b border-[#1f2a24] px-4 flex items-center justify-between gap-4 z-40 select-none">
      {/* Lado Esquerdo: Logo + Nome do Exercício */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 pr-3 border-r border-[#1f2a24]">
          <div className="w-8 h-8 rounded-xl bg-[#c6f432] flex items-center justify-center font-black text-[#0b0f0d] text-base shadow-sm">
            F
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-black tracking-wider text-white uppercase font-['Outfit']">
              Futevôlei
            </span>
            <span className="text-[10px] font-semibold text-[#c6f432] leading-none">
              Studio 3D
            </span>
          </div>
        </div>

        {/* Nome editável */}
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={exerciseName}
            onChange={(e) => rename(e.target.value)}
            className="bg-transparent hover:bg-[#1a231e] focus:bg-[#1a231e] border border-transparent focus:border-[#2f4035] rounded-lg px-2.5 py-1 text-sm font-semibold text-white truncate transition-colors focus:outline-none max-w-[180px] md:max-w-[260px]"
            title="Clique para renomear"
          />
        </div>

        {/* Indicador de Salvamento */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
              <span>Salvando...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#c6f432]" />
              <span className="text-gray-300">Salvo</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-400">Erro ao salvar</span>
            </>
          )}
        </div>
      </div>

      {/* Centro: Desfazer/Refazer + Câmeras */}
      <div className="hidden md:flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center bg-[#161e19] p-0.5 rounded-xl border border-[#1f2a24]">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#233028] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#233028] disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Presets de Câmera */}
        <div className="flex items-center bg-[#161e19] p-0.5 rounded-xl border border-[#1f2a24]">
          {PRESETS.map((p) => {
            const active = currentCamera === p.id
            return (
              <button
                key={p.id}
                onClick={() => setCameraPreset(p.id)}
                title={`Câmera ${p.label} (${p.shortcut})`}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  active
                    ? 'bg-[#c6f432] text-[#0b0f0d] shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-[#233028]'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Lado Direito: Ações (Salvar, Projetos, Exportar, Apresentação) */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => void saveNow()}
          title="Salvar projeto (Ctrl+S)"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a231e] text-gray-200 hover:bg-[#233028] border border-[#2b3a31] transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-[#c6f432]" />
          <span>Salvar</span>
        </button>

        <button
          onClick={onOpenProjects}
          title="Abrir ou gerenciar projetos"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a231e] text-gray-200 hover:bg-[#233028] border border-[#2b3a31] transition-colors"
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span className="hidden sm:inline">Projetos</span>
        </button>

        {/* Dropdown de Exportação */}
        <div className="relative">
          <button
            onClick={() => setExportOpen((v) => !v)}
            title="Exportar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a231e] text-gray-200 hover:bg-[#233028] border border-[#2b3a31] transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#ff8a3d]" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          {exportOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#141c18] border border-[#233028] rounded-xl shadow-xl py-1.5 z-50">
              <button
                onClick={() => {
                  setExportOpen(false)
                  void exportPng()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-[#1f2a24] hover:text-[#c6f432] transition-colors text-left"
              >
                <Image className="w-4 h-4 text-[#ff8a3d]" />
                Exportar Imagem PNG
              </button>
              <button
                onClick={() => {
                  setExportOpen(false)
                  exportJson()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-[#1f2a24] hover:text-[#c6f432] transition-colors text-left"
              >
                <FileJson className="w-4 h-4 text-[#38bdf8]" />
                Exportar Projeto JSON
              </button>
              <div className="h-px bg-[#1f2a24] my-1" />
              <button
                onClick={() => {
                  setExportOpen(false)
                  fileInputRef.current?.click()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-200 hover:bg-[#1f2a24] hover:text-white transition-colors text-left"
              >
                <Upload className="w-4 h-4 text-gray-400" />
                Importar Projeto JSON
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.fs3d.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Guia Rápido do Treinador */}
        <button
          onClick={onOpenGuide}
          title="Guia do Treinador: como usar em 3 passos simples"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1a231e] text-amber-300 hover:bg-[#233028] border border-amber-500/30 transition-all shadow-sm"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          <span className="hidden md:inline">Como Usar</span>
        </button>

        {/* Modo Aula para Exibir na TV/Tablet */}
        <button
          onClick={() => setMode('present')}
          title="Entrar no Modo Aula para exibir na TV ou tablet pros alunos"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#c6f432] text-[#0b0f0d] hover:bg-[#b0de26] transition-all shadow-md shadow-[#c6f432]/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Modo Aula</span>
        </button>

        {/* Atalhos */}
        <button
          onClick={onOpenShortcuts}
          title="Ver atalhos do teclado"
          className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a231e] transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
