import { X, Keyboard } from 'lucide-react'

interface ShortcutsModalProps {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: 'V', desc: 'Ferramenta Selecionar' },
  { key: 'P', desc: 'Adicionar Jogador' },
  { key: 'B', desc: 'Adicionar Bola' },
  { key: 'C', desc: 'Adicionar Cone' },
  { key: 'R', desc: 'Girar objeto selecionado (+15°)' },
  { key: 'Shift + R', desc: 'Girar objeto selecionado (-15°)' },
  { key: 'Ctrl + D', desc: 'Duplicar objeto(s) selecionado(s)' },
  { key: 'Ctrl + L', desc: 'Travar / Destravar objeto(s)' },
  { key: 'Ctrl + A', desc: 'Selecionar todos os objetos' },
  { key: 'Del / Backspace', desc: 'Excluir objeto(s) selecionado(s)' },
  { key: 'Ctrl + Z', desc: 'Desfazer última alteração' },
  { key: 'Ctrl + Shift + Z / Ctrl + Y', desc: 'Refazer' },
  { key: 'Ctrl + S', desc: 'Salvar projeto' },
  { key: 'Esc', desc: 'Limpar seleção ou sair do modo apresentação' },
  { key: '1', desc: 'Câmera Superior (2D tática)' },
  { key: '2', desc: 'Câmera Isométrica padrão' },
  { key: '3', desc: 'Câmera Lateral' },
  { key: '4', desc: 'Câmera de Fundo (Saque)' },
  { key: '5', desc: 'Câmera Livre' },
]

export function ShortcutsModal({ open, onClose }: ShortcutsModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#121815] border border-[#1f2a24] rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2a24]">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#c6f432]" />
            <h2 className="text-lg font-bold text-white">Atalhos do Teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a231e] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#161e19] border border-[#1f2a24]"
            >
              <span className="text-xs text-gray-300">{s.desc}</span>
              <kbd className="px-2 py-1 bg-[#233028] border border-[#314337] rounded text-[11px] font-mono font-semibold text-[#c6f432] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
