import { X, Footprints, Presentation, Sparkles, CheckCircle2 } from 'lucide-react'

interface CoachGuideModalProps {
  open: boolean
  onClose: () => void
  onTryPreset?: () => void
}

export function CoachGuideModal({ open, onClose, onTryPreset }: CoachGuideModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#121815] border-2 border-[#c6f432]/60 rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl w-full flex flex-col gap-6 relative text-white">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1a231e] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-[#c6f432] text-[#0b0f0d]">
              Guia Prático
            </span>
            <span className="text-xs font-semibold text-gray-400">
              Prancheta Tática para Treinadores
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Como usar o Studio 3D para ensinar seus alunos
          </h2>
          <p className="text-xs text-gray-300">
            Ferramenta desenvolvida para demonstrar posicionamento, corridas na areia e fundamentos técnicos em 3 passos simples.
          </p>
        </div>

        {/* 3 Passos Ilustrados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Passo 1 */}
          <div className="bg-[#161e19] border border-[#233028] hover:border-[#c6f432]/40 rounded-2xl p-4 flex flex-col gap-2.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#c6f432]/15 text-[#c6f432] border border-[#c6f432]/30 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-white">Escolha ou Monte o Treino</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Use o menu <strong className="text-white">"Projetos"</strong> no topo para abrir treinos prontos ou arraste cones e atletas pela barra lateral esquerda.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="bg-[#161e19] border border-[#233028] hover:border-[#c6f432]/40 rounded-2xl p-4 flex flex-col gap-2.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#c6f432] text-[#0b0f0d] flex items-center justify-center font-black text-sm shadow-md">
              <Footprints className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h4 className="font-bold text-sm text-white">Grave a Passada na Areia</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Clique em <strong className="text-[#c6f432]">"Gravar Trajeto na Areia"</strong>. Basta clicar onde o aluno corre e escolher o fundamento (<strong className="text-white">Chapa, Peito, Cabeceio, Ataque de Cabeça</strong>).
            </p>
          </div>

          {/* Passo 3 */}
          <div className="bg-[#161e19] border border-[#233028] hover:border-[#c6f432]/40 rounded-2xl p-4 flex flex-col gap-2.5 transition-all">
            <div className="w-9 h-9 rounded-xl bg-[#ff8a3d]/15 text-[#ff8a3d] border border-[#ff8a3d]/30 flex items-center justify-center font-black text-sm">
              <Presentation className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-sm text-white">Mostre em Aula pros Alunos</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Clique em <strong className="text-white">"Apresentar"</strong> no topo ou dê <strong className="text-white">Play</strong>. A tela fica limpa e os atletas 3D se movimentam e saltam na quadra!
            </p>
          </div>
        </div>

        {/* Dicas Rápidas */}
        <div className="p-3.5 bg-[#0e1411] border border-[#1f2a24] rounded-2xl flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#c6f432] shrink-0" />
          <p className="text-xs text-gray-300">
            <strong className="text-white">Dica do Professor:</strong> Você pode girar a quadra segurando o botão esquerdo do mouse ou usar os botões <strong className="text-[#c6f432]">"2D Tática"</strong> e <strong className="text-[#c6f432]">"Isométrica"</strong> no topo para mostrar de cima!
          </p>
        </div>

        {/* Rodapé com Botão Principal */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1f2a24]">
          <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#c6f432]" />
            Pronto para usar no treino de hoje
          </span>

          <div className="flex items-center gap-2">
            {onTryPreset && (
              <button
                onClick={() => {
                  onClose()
                  onTryPreset()
                }}
                className="px-4 py-2 bg-[#1a231e] hover:bg-[#233028] text-white font-bold text-xs rounded-xl border border-[#2b3a31] transition-all"
              >
                Abrir Treino Exemplo
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-[#c6f432] hover:bg-[#b0de26] text-[#0b0f0d] font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-[#c6f432]/20"
            >
              Entendido, Vamos Começar!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
