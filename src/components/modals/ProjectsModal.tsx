import { useEffect, useState } from 'react'
import { FolderOpen, Plus, Trash2, Copy, Upload, X, Clock, Layers, Sparkles } from 'lucide-react'
import { storage, type ProjectSummary } from '@/services/storage'
import { newProject, openProject, importJsonFile } from '@/services/projectActions'
import { useDocumentStore } from '@/store/documentStore'
import { duplicateExercise } from '@/domain/factories'
import { seedAtaqueCompleto, seedFrenteECostas, seedCircuitoChapaAtaque } from '@/domain/seed'
import { toast } from 'sonner'

interface ProjectsModalProps {
  open: boolean
  onClose: () => void
}

export function ProjectsModal({ open, onClose }: ProjectsModalProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const currentId = useDocumentStore((s) => s.exercise.id)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await storage.list()
      setProjects(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void reload()
  }, [open])

  if (!open) return null

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  )

  const handleOpen = async (id: string) => {
    await openProject(id)
    onClose()
  }

  const handleNew = async () => {
    await newProject()
    onClose()
  }

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const ex = await storage.get(id)
    if (!ex) return
    const copy = duplicateExercise(ex)
    await storage.save(copy)
    toast.success('Exercício duplicado')
    void reload()
  }

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`Excluir "${name}"?`)) return
    await storage.remove(id)
    toast.success('Exercício excluído')
    if (id === currentId) {
      await handleNew()
    } else {
      void reload()
    }
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await importJsonFile(file)
    e.target.value = ''
    onClose()
  }

  const handleLoadDemos = async () => {
    const d1 = seedCircuitoChapaAtaque()
    const d2 = seedAtaqueCompleto()
    const d3 = seedFrenteECostas()
    await storage.save(d1)
    await storage.save(d2)
    await storage.save(d3)
    toast.success('3 exercícios de demonstração adicionados à lista!')
    await reload()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#121815] border border-[#1f2a24] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2a24]">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-[#c6f432]" />
            <h2 className="text-lg font-bold text-white">Meus Projetos & Exercícios</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a231e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar de ações */}
        <div className="p-4 border-b border-[#1f2a24] flex flex-wrap items-center justify-between gap-3 bg-[#0d120f]">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-2 bg-[#161e19] border border-[#233028] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c6f432]"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadDemos}
              title="Carrega exercícios oficiais com simulação e jogadas prontas"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#ff8a3d]/15 text-[#ff8a3d] hover:bg-[#ff8a3d]/25 border border-[#ff8a3d]/30 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Carregar Demos
            </button>
            <button
              onClick={handleNew}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#c6f432] text-[#0b0f0d] hover:bg-[#b0de26] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Exercício
            </button>
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#1a231e] text-gray-200 hover:bg-[#233028] border border-[#2b3a31] transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Importar JSON
              <input type="file" accept=".json,.fs3d.json" onChange={handleFileInput} className="hidden" />
            </label>
          </div>
        </div>

        {/* Lista de projetos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Carregando projetos...</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              {search ? 'Nenhum exercício encontrado para essa busca.' : 'Nenhum exercício salvo ainda.'}
            </div>
          ) : (
            filtered.map((proj) => {
              const isCurrent = proj.id === currentId
              const dateStr = new Date(proj.updatedAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={proj.id}
                  onClick={() => handleOpen(proj.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#18261e] border-[#3e5f48]'
                      : 'bg-[#141c18] border-[#1f2a24] hover:border-[#2f4035] hover:bg-[#18221d]'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white truncate">{proj.name}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#c6f432]/20 text-[#c6f432] border border-[#c6f432]/40">
                          Aberto agora
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {dateStr}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {proj.objectCount} {proj.objectCount === 1 ? 'objeto' : 'objetos'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      title="Duplicar"
                      onClick={(e) => handleDuplicate(proj.id, e)}
                      className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#202c24] transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      title="Excluir"
                      onClick={(e) => handleDelete(proj.id, proj.name, e)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#2c1d20] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
