# Futevôlei Studio 3D 🏐

Prancheta tática e simulador de treinos em 3D para professores e treinadores de futevôlei.

---

## 🚀 Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

3. **Gerar build de produção**:
   ```bash
   npm run build
   ```

---

## 🛠️ Tecnologias Utilizadas

- **React 19 + TypeScript (Strict)**
- **Vite 8**
- **Three.js + React Three Fiber + @react-three/drei**
- **Tailwind CSS v4**
- **Zustand + Zundo** (estado reativo + histórico completo de Desfazer/Refazer com `zundo`)
- **IndexedDB via idb-keyval** (persistência local e recuperação automática de projetos)
- **Zod** (validação de integridade e migração de schema)
- **Lucide React & Sonner** (ícones e notificações)

---

## 🎯 Funcionalidades da Fase 1 (Entregues)

- **Quadra 3D Oficial de Futevôlei**:
  - Dimensões oficiais 18m × 9m com margem de segurança configurável (área de jogo).
  - Rede com postes, antenas e alturas ajustáveis (presets: Masculino 2,20m, Misto 2,10m, Feminino 2,00m).
  - Linhas de demarcação oficiais e linha de medição / grade de 1m opcional.
  - Textura de areia realista gerada proceduralmente via canvas.
- **Câmera Tática Interativa**:
  - Presets instantâneos com transição suave: **2D Tática (Superior)**, **Isométrica**, **Lateral**, **Fundo (Saque)** e Livre.
  - Controles de órbita, zoom com roda do mouse e pan suave com botão direito.
- **Manipulação de Jogadores e Equipamentos**:
  - Jogadores (aluno, professor, outro), Bolas, Cones, Arcos, Marcadores, Zonas/Alvos e Obstáculos.
  - Arraste direto e natural no plano da areia (a câmera trava automaticamente durante o movimento).
  - Alça circular de rotação com indicação de orientação e atalho `R` / `Shift+R`.
  - Regulagem de altura da bola (chão, cintura, cabeça, rede).
  - Duplicação rápida (`Ctrl+D`), exclusão (`Del`), bloqueio de posição (`Ctrl+L`) e paleta de cores.
- **Histórico & Persistência**:
  - Desfazer / Refazer ilimitado (`Ctrl+Z`, `Ctrl+Y`).
  - Salvamento automático contínuo em IndexedDB (restaura o último projeto ao recarregar).
  - Exportação e importação de projetos em arquivo `.fs3d.json`.
  - Exportação de imagem PNG em alta resolução da quadra (`gl.preserveDrawingBuffer`).
  - Modal "Meus Projetos" para gerenciar e duplicar múltiplos treinos.
- **Modo Apresentação**:
  - Interface limpa e minimalista em tela cheia para o professor demonstrar o exercício aos alunos no tablet ou celular na quadra.

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
|---|---|
| `V` | Ferramenta Selecionar |
| `P` | Adicionar Jogador |
| `B` | Adicionar Bola |
| `C` | Adicionar Cone |
| `R` / `Shift+R` | Girar objeto (+15° / -15°) |
| `Ctrl+D` | Duplicar objeto selecionado |
| `Ctrl+L` | Travar / Destravar objeto |
| `Ctrl+A` | Selecionar todos os objetos |
| `Del` / `Backspace` | Excluir objeto(s) selecionado(s) |
| `Ctrl+Z` | Desfazer |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Refazer |
| `Ctrl+S` | Salvar projeto |
| `Esc` | Limpar seleção ou sair da ferramenta / apresentação |
| `1` a `5` | Alternar entre presets de câmera |
