import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[FutevoleiStudio3D ErrorBoundary]', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleClearAndReload = () => {
    try {
      indexedDB.deleteDatabase('fs3d-projects')
      indexedDB.deleteDatabase('fs3d-meta')
      localStorage.clear()
    } catch {
      // Ignora erro de exclusão
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-[#0b0f0d] flex items-center justify-center p-6 text-white font-['Inter'] select-none">
          <div className="max-w-md w-full bg-[#121815] border border-[#233028] rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Falha ao inicializar o Estúdio 3D</h2>
              <p className="text-xs text-gray-400">
                Ocorreu uma instabilidade no renderizador gráfico ou nos dados salvos no navegador.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full bg-[#0a0f0d] border border-[#1f2a24] rounded-xl p-3 text-[11px] font-mono text-amber-300/90 text-left overflow-x-auto max-h-28">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 w-full pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-[#c6f432] hover:bg-[#b0de26] text-[#0b0f0d] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>

              <button
                onClick={this.handleClearAndReload}
                title="Limpa dados corrompidos locais do navegador e restaura do zero"
                className="py-2.5 px-4 bg-[#1a231e] hover:bg-[#233028] text-gray-300 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-[#233028]"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Resetar</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
