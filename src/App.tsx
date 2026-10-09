import { useState } from 'react'
import { Toaster } from 'sonner'
import { StudioCanvas } from '@/scene/StudioCanvas'
import { TopBar } from '@/components/layout/TopBar'
import { ToolBar } from '@/components/layout/ToolBar'
import { PropertiesPanel } from '@/components/layout/PropertiesPanel'
import { TimelineBar } from '@/components/timeline/TimelineBar'
import { SequenceRecorderModal } from '@/components/timeline/SequenceRecorderModal'
import { PresentationOverlay } from '@/components/presentation/PresentationOverlay'
import { ProjectsModal } from '@/components/modals/ProjectsModal'
import { ShortcutsModal } from '@/components/modals/ShortcutsModal'
import { CoachGuideModal } from '@/components/modals/CoachGuideModal'
import { useBootstrap } from '@/hooks/useBootstrap'
import { useAutosave } from '@/hooks/useAutosave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useUiStore } from '@/store/uiStore'
import { OBJECT_LABELS } from '@/domain/constants'
import { Loader2 } from 'lucide-react'

export default function App() {
  const ready = useBootstrap()
  useAutosave(ready)
  useKeyboardShortcuts()

  const mode = useUiStore((s) => s.mode)
  const tool = useUiStore((s) => s.tool)
  const setTool = useUiStore((s) => s.setTool)

  const [projectsOpen, setProjectsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)

  if (!ready) {
    return (
      <div className="w-screen h-screen bg-[#0b0f0d] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#c6f432] flex items-center justify-center text-3xl font-black text-[#0b0f0d] shadow-lg shadow-[#c6f432]/20 animate-pulse">
          F
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 text-[#c6f432] animate-spin" />
          <span>Iniciando Futevôlei Studio 3D...</span>
        </div>
      </div>
    )
  }

  const isPlacing = tool !== 'select'

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-[#0b0f0d] text-gray-100 relative font-['Inter'] select-none">
      {/* Barra superior (oculta no modo apresentação) */}
      {mode === 'edit' && (
        <TopBar
          onOpenProjects={() => setProjectsOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onOpenGuide={() => setGuideOpen(true)}
        />
      )}

      {/* Área central com Canvas 3D */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        <StudioCanvas />

        {/* Ferramentas e propriedades no modo de edição */}
        {mode === 'edit' && (
          <>
            <ToolBar />
            <PropertiesPanel />

            {/* Dica de ferramenta ativa */}
            {isPlacing ? (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-[#121815]/95 backdrop-blur-md border border-[#c6f432]/40 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c6f432] animate-ping" />
                <span className="text-xs font-semibold text-white">
                  Clique na areia para posicionar: <strong className="text-[#c6f432]">{OBJECT_LABELS[tool]}</strong>
                </span>
                <button
                  onClick={() => setTool('select')}
                  className="px-2 py-0.5 rounded-lg bg-[#233028] text-[11px] font-bold text-gray-300 hover:text-white"
                >
                  Cancelar (Esc)
                </button>
              </div>
            ) : (
              <TimelineBar />
            )}
          </>
        )}

        {/* Modal interativa de gravação de passos por cliques na areia */}
        <SequenceRecorderModal />

        {/* Overlay no modo apresentação */}
        <PresentationOverlay />
      </main>

      {/* Modais */}
      <ProjectsModal open={projectsOpen} onClose={() => setProjectsOpen(false)} />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CoachGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        onTryPreset={() => setProjectsOpen(true)}
      />

      {/* Notificações toast */}
      <Toaster
        position="bottom-left"
        richColors
        theme="dark"
        toastOptions={{
          style: {
            background: '#121815',
            borderColor: '#1f2a24',
            color: '#f3f4f6',
          },
        }}
      />
    </div>
  )
}
