# SPEC — FUTEVÔLEI STUDIO 3D

> Versão 2.0 — revisada. Mudanças em relação à v1: decisões técnicas fechadas (seção 2.1), modelo de dados (seção 13), regras de domínio corrigidas (área de jogo além da quadra), UX para tablet, atalhos de teclado e critérios de aceite por fase.

---

## 1. Objetivo do projeto

Aplicação web chamada **Futevôlei Studio 3D**, destinada a professores e treinadores de futevôlei.

Permite visualizar uma quadra de futevôlei em 3D, posicionar jogadores, equipamentos e bolas, criar exercícios, simular movimentações e organizar planejamentos de aulas.

Funciona como uma **prancheta tática interativa em 3D**, com simulação e planejamento de treinos.

**Prioridade máxima:** montar um exercício na quadra deve ser simples, fluido e intuitivo, mesmo para professores sem conhecimento técnico. Em caso de conflito entre "mais recursos" e "mais simples de usar", vence a simplicidade.

### 1.1 Público e contexto de uso

- **Professor planejando em casa** (desktop/notebook): cria exercícios e aulas com calma.
- **Professor na arena** (tablet, eventualmente celular): abre a aula do dia, mostra a animação para os alunos. Uso predominantemente de **leitura e reprodução**, com edição leve.

Consequência: o modo "Apresentação" (seção 10.6) é tão importante quanto o editor.

---

## 2. Tecnologias

**Frontend**
- React 19 + TypeScript (strict)
- Vite
- Three.js + React Three Fiber + @react-three/drei
- Tailwind CSS v4
- Componentes no padrão shadcn/ui (Radix + class-variance-authority + tailwind-merge)
- Zustand (estado) + **zundo** (histórico desfazer/refazer)
- Lucide React (ícones)
- **idb-keyval** (IndexedDB) para persistência local
- **zod** para validar JSON importado e dados carregados do armazenamento

**Persistência**
- Fase 1–4: IndexedDB local, atrás de uma interface `StorageAdapter`.
- Futuro: `ApiStorageAdapter` para FastAPI + PostgreSQL, sem alterar componentes.

### 2.1 Decisões técnicas

| Tema | Decisão | Motivo |
|---|---|---|
| Arrastar objetos | Arrastar direto no plano da areia (raycast no plano Y=0), não gizmo 3 eixos | Professor não pensa em X/Y/Z; ele "pega e solta" na areia |
| Rotação | Alça circular ao redor do objeto selecionado + atalho `R` (+15°) | Mais intuitivo que gizmo de rotação |
| Câmera x arraste | Desabilitar `OrbitControls` durante o arraste | Evita câmera girando junto |
| Undo/redo | `zundo` sobre o slice de "documento"; arraste gera **1** entrada no histórico (no soltar), não uma por frame | Histórico limpo |
| Estado | Separar **documento** (persistido, com histórico) de **UI** (seleção, ferramenta ativa, câmera — não persistido, sem histórico) | Undo não deve desfazer "selecionei um objeto" |
| IDs | `crypto.randomUUID()` | Sem dependência extra |
| Unidades | 1 unidade Three.js = 1 metro. Origem no centro da quadra, rede sobre o eixo X=0 | Coordenadas legíveis no painel |
| Trajetória da bola | `QuadraticBezierCurve3` (origem, destino, altura do ápice) | Parábola previsível e editável |
| Exportar PNG | `gl.domElement.toDataURL()` com `preserveDrawingBuffer: true` | Sem isso o PNG sai preto |
| Exportar PDF | Página de impressão dedicada + `window.print()` (fase 4); avaliar `jsPDF` só se necessário | Zero dependência, resultado bom |
| Modelos 3D | Jogador procedural (cápsula + cabeça + indicador de direção) na Fase 1; `.glb` low-poly opcional depois | Leve, sem assets externos |
| Performance | `frameloop="demand"` quando não houver animação tocando | Economiza bateria em tablet |

---

## 3. Quadra de futevôlei em 3D

Quadra de areia com dimensões configuráveis. **Padrão: 18 m × 9 m**, rede a **2,20 m**.

Presets de altura de rede (editáveis):

| Categoria | Altura |
|---|---|
| Masculino | 2,20 m |
| Misto | 2,10 m |
| Feminino | 2,00 m |
| Personalizada | livre |

> Os valores podem variar por federação/torneio; por isso todos são editáveis.

A cena deve conter:

- Areia com textura procedural (sem depender de imagem externa).
- Linhas de demarcação (fitas) e linha central sob a rede.
- Rede com postes e faixa superior.
- **Área de jogo ao redor da quadra** (padrão 4 m em cada lado): saque, defesa e exercícios acontecem fora das linhas.
- Iluminação e sombras suaves.
- Grade/marcações opcionais (liga/desliga) a cada 1 m.
- Ambiente limpo, sem elementos que distraiam.

**Câmera**
- Presets: **Superior (2D tática)**, **Isométrica**, **Lateral**, **Fundo** (atrás da quadra), **Livre**.
- Zoom com scroll/pinça, rotação com botão esquerdo, pan com botão direito/dois dedos.
- Transição animada entre presets.
- Botão "Restaurar câmera".
- Na vista Superior, rotação desabilitada (só pan/zoom) para se comportar como prancheta 2D.

---

## 4. Jogadores

Cada jogador possui:

- Nome e número (o número aparece sobre a cabeça).
- Cor do uniforme.
- Papel: `aluno`, `professor` (lançador), `outro`.
- Equipe/grupo (A, B, ou nenhum).
- Posição (x, z) e rotação (em graus). Y é sempre o chão.
- Indicador visual de orientação (seta/cone no chão à frente).
- Flag de bloqueio.

**Interações**
- Adicionar (clique na ferramenta, depois clique na areia para posicionar — ou clique simples para colocar no centro).
- Selecionar (clique), multi-seleção com `Shift`.
- Arrastar pela areia.
- Girar (alça circular ou `R` / `Shift+R`).
- Duplicar (`Ctrl+D`), excluir (`Delete`).
- Editar nome, número, cor, papel e equipe no painel direito.
- Bloquear (objeto bloqueado não arrasta nem exclui, mas pode ser selecionado).

---

## 5. Equipamentos

- Bola
- Cone
- Arco (bambolê no chão)
- Marcador de posição (disco chato)
- Zona/alvo no chão (retângulo ou círculo colorido semitransparente, redimensionável)
- Obstáculo (barreira baixa)
- Setas e linhas direcionais (Fase 2)

Todos: arrastar, rotacionar, duplicar, excluir, bloquear, mudar cor.

Todos os objetos ficam **restritos à área de jogo** (quadra + margem), não à quadra.

---

## 6. Exercícios

O exercício é a unidade central do sistema. Um exercício contém a **cena** (objetos + posições iniciais) e, a partir da Fase 3, a **animação** (timeline).

**Metadados**
- Nome
- Objetivo
- Fundamentos trabalhados (multi: deslocamento, recepção, chapa, peito, cabeça, ombro, coxa, pé, levantamento, ataque, defesa, saque, posicionamento)
- Nível (iniciante, intermediário, avançado)
- Participantes (mín./máx.)
- Duração estimada (min)
- Séries, repetições, descanso
- Materiais (gerado automaticamente a partir dos objetos da cena, editável)
- Instruções de execução (passo a passo)
- Observações do professor
- Variações (progressão/regressão) — opcional

**Exemplos de referência** (usados como seed na biblioteca)

1. **Frente e costas** — aluno no centro, cone à frente e atrás, setas de ida e volta.
2. **Deslocamento lateral + chapa** — aluno no centro, dois marcadores laterais, deslocamento até um ponto, bola na zona de contato, retorno ao centro.
3. **Recepção, levantamento e ataque** — dois alunos + professor lançador; trajetória lançamento → recepção → levantador → ataque por cima da rede.

---

## 7. Animação e simulação (Fase 3)

Modelo: **timeline baseada em keyframes por entidade**.

- Cada jogador tem uma lista de keyframes `{ t, x, z, rotation, action? }`.
- Entre keyframes, interpolação linear (posição) e pelo menor ângulo (rotação), com easing opcional.
- `action` é um rótulo visual (recepção, chapa, levantamento, ataque…) que exibe um ícone/balão e, futuramente, uma pose.
- A bola tem **segmentos de trajetória** `{ tStart, tEnd, from, to, apexHeight }` desenhados como curva 3D.
- Atalho: "a bola vai até o jogador X no tempo T" — `to` segue a posição do jogador naquele instante.

**Fluxo de edição**
1. Selecionar jogador.
2. Mover o cursor da timeline para o tempo desejado.
3. Arrastar o jogador na quadra → cria/atualiza keyframe naquele tempo.
4. Caminho do jogador aparece como linha tracejada no chão com pontos editáveis.

**Controles**: play, pause, reiniciar, 0,5x / 1x / 2x, loop, scrub (arrastar o cursor), avançar/voltar 1 s.

Sem física realista. Prioridade: previsível, editável, coerente.

---

## 8. Planejamento de aulas (Fase 4)

Aula: nome, data, turma, nível, duração, nº de alunos, objetivo principal, etapas.

Cada etapa: exercício, duração, observação.

Exemplo — aula de 60 min, iniciantes:

| Etapa | Exercício | Duração |
|---|---|---|
| 1 | Aquecimento e mobilidade | 10 min |
| 2 | Frente e costas | 10 min |
| 3 | Deslocamento lateral | 10 min |
| 4 | Fundamento de chapa | 15 min |
| 5 | Chapa com deslocamento | 10 min |
| 6 | Volta à calma | 5 min |

- Soma das durações x duração da aula: exibir aviso se divergirem.
- Ao selecionar uma etapa, a quadra carrega a cena do exercício.
- Duplicar aulas, reordenar etapas (arrastar), reutilizar exercícios.
- **Referência x cópia**: a etapa referencia o exercício da biblioteca. Editar a partir da aula pergunta: "Alterar o exercício original (afeta outras aulas)" ou "Criar cópia só para esta aula".

---

## 9. Biblioteca de exercícios (Fase 2)

Categorias: aquecimento, coordenação motora, deslocamento, recepção, chapa, peito, cabeça, levantamento, ataque, defesa, posicionamento, combinados, treinos em dupla, situações de jogo.

Filtros: nível, nº de jogadores, duração, fundamento, favoritos. Busca por texto.

Ações: criar, editar, duplicar, excluir (com confirmação), favoritar.

Cada card mostra miniatura (PNG gerado da vista superior ao salvar).

Seed inicial com pelo menos os 3 exercícios da seção 6 + aquecimento + volta à calma.

---

## 10. Interface

Tema escuro, acento **verde-limão/areia** (primária) e **laranja** (destaque/alerta), painéis com leve translucidez.

### 10.1 Barra superior
Logo, nome do projeto/exercício (editável inline), salvar (com indicador "Salvo / Salvando…"), desfazer/refazer, presets de câmera, exportar, alternar modo Editor/Apresentação.

### 10.2 Barra lateral esquerda — Ferramentas
Selecionar, Jogador, Bola, Cone, Arco, Marcador, Zona, Obstáculo, Seta (F2), Trajetória (F2), Biblioteca (F2).

### 10.3 Área central
Quadra 3D, mini-toolbar flutuante de câmera (presets, restaurar, grade on/off).

### 10.4 Barra lateral direita — Propriedades
- Nada selecionado: propriedades do exercício e da quadra.
- Objeto selecionado: nome, cor, posição (x, z), rotação, bloqueio, campos específicos do tipo.
- Multi-seleção: cor, bloqueio, excluir em lote.

### 10.5 Painel inferior (Fase 3)
Timeline, faixas por entidade, controles de reprodução.

### 10.6 Modo Apresentação
Esconde painéis, mostra só a quadra, controles de reprodução grandes e o nome/instruções do exercício. Pensado para mostrar aos alunos no tablet.

### 10.7 Tablet / telas pequenas
- Abaixo de 1024 px: painéis laterais viram gavetas (sheet) acionadas por botões; ferramentas viram barra flutuante.
- Alvos de toque ≥ 44 px.
- Gestos: um dedo arrasta objeto (se tocar nele) ou gira câmera (se tocar no vazio); dois dedos = zoom/pan.

### 10.8 Atalhos de teclado
| Atalho | Ação |
|---|---|
| `V` | Ferramenta selecionar |
| `P` | Adicionar jogador |
| `B` | Adicionar bola |
| `C` | Adicionar cone |
| `R` / `Shift+R` | Girar +15° / −15° |
| `Ctrl+D` | Duplicar |
| `Delete` / `Backspace` | Excluir |
| `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` | Desfazer / refazer |
| `Ctrl+S` | Salvar |
| `Esc` | Limpar seleção / cancelar ferramenta |
| `1`–`5` | Presets de câmera |
| `Espaço` | Play/pause (Fase 3) |

---

## 11. Salvamento e exportação

- Salvamento automático (debounce ~800 ms) + `Ctrl+S` manual.
- Abrir, duplicar, renomear, excluir projetos (tela "Meus projetos").
- Exportar/importar JSON (validado com zod; erro claro se inválido).
- Campo `schemaVersion` no JSON + função de migração.
- Exportar PNG da vista atual.
- Exportar planejamento de aula em PDF (Fase 4).
- Recuperação do último projeto aberto ao recarregar.

---

## 12. Funcionalidades futuras (não implementar agora)

Turmas e alunos, histórico de aulas, avaliação de evolução, planejamento semanal/mensal, compartilhamento por link, biblioteca comunitária, sincronização em nuvem, PWA offline, assistente de IA para sugerir exercícios/aulas.

Diretrizes para não bloquear o futuro:
- Toda entidade tem `id`, `createdAt`, `updatedAt`.
- Persistência só via `StorageAdapter`.
- Nada de lógica de negócio dentro de componentes 3D.

---

## 13. Modelo de dados (resumo)

```ts
type Vec2 = { x: number; z: number };

type SceneObjectType =
  | 'player' | 'ball' | 'cone' | 'hoop' | 'marker' | 'zone' | 'obstacle' | 'arrow';

interface BaseObject {
  id: string;
  type: SceneObjectType;
  position: Vec2;
  rotation: number;       // graus
  color: string;
  locked: boolean;
  label?: string;
}

interface PlayerObject extends BaseObject {
  type: 'player';
  name: string;
  number: number;
  role: 'student' | 'coach' | 'other';
  team: 'A' | 'B' | null;
}

interface ZoneObject extends BaseObject {
  type: 'zone';
  shape: 'rect' | 'circle';
  size: { w: number; d: number };
}

interface CourtSettings {
  length: number;         // 18
  width: number;          // 9
  netHeight: number;      // 2.2
  margin: number;         // 4
  showGrid: boolean;
}

interface Exercise {
  id: string;
  schemaVersion: number;
  name: string;
  meta: ExerciseMeta;      // seção 6
  court: CourtSettings;
  objects: SceneObject[];
  timeline?: Timeline;     // fase 3
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: string;
  name: string;
  date: string;
  group: string;
  level: Level;
  durationMin: number;
  students: number;
  goal: string;
  stages: { id: string; exerciseId: string; durationMin: number; notes?: string }[];
}
```

---

## 14. Fases e critérios de aceite

### Fase 1 — Base funcional
- Projeto criado (Vite + React + TS + Tailwind + R3F).
- Layout completo (barra superior, ferramentas, propriedades), responsivo.
- Quadra 3D com rede, linhas, área de jogo, grade opcional, sombras.
- Câmera com 5 presets animados + restaurar.
- Adicionar/selecionar/arrastar/girar/duplicar/excluir/bloquear jogadores e equipamentos.
- Painel de propriedades funcional (objeto, exercício, quadra).
- Undo/redo.
- Autosave em IndexedDB, restauração ao recarregar, exportar/importar JSON, exportar PNG.

**Aceite:** montar o exercício "Frente e costas" em menos de 1 minuto, recarregar a página e ele continuar lá; Ctrl+Z desfaz cada passo; arrastar não move a câmera.

### Fase 2 — Editor tático
Setas e linhas, trajetórias estáticas de bola, multi-seleção, biblioteca com filtros/favoritos/seed, tela "Meus projetos".

**Aceite:** criar os 3 exemplos da seção 6 (sem animação) e encontrá-los via filtro.

### Fase 3 — Simulação
Keyframes de jogadores, trajetórias de bola animadas, timeline com scrub, velocidades, loop, modo Apresentação.

**Aceite:** exemplo 3 (recepção → levantamento → ataque) reproduzindo em loop a 0,5x/1x/2x.

### Fase 4 — Planejamento
Aulas, etapas reordenáveis, referência x cópia, exportar PDF.

**Aceite:** montar a aula de 60 min do exemplo e exportar PDF com miniaturas.

---

## 15. Critérios de qualidade

- Nenhum botão decorativo: toda ação visível funciona ou não aparece.
- Objetos restritos à área de jogo.
- Arrastar nunca move a câmera.
- Projetos salvos restauram 100% (incluindo cores, rotação, bloqueio).
- Editar um exercício não altera outro (deep clone ao duplicar).
- Mensagens de erro claras (toast) em importação, salvamento e exportação.
- 60 fps em notebook comum com até 30 objetos.

---

## 16. Entrega

Código organizado por domínio, README com instalação/execução, ao fim de cada fase:
1. Funcionalidades desenvolvidas
2. Como testar
3. Limitações conhecidas
4. Próximos passos

### Estrutura de pastas

```
src/
  app/            # App, layout, providers
  components/
    ui/           # botões, inputs, etc. (padrão shadcn)
    layout/       # TopBar, ToolBar, PropertiesPanel...
  scene/          # Canvas, Court, Net, objetos 3D, câmera, drag
  store/          # zustand (document + ui), histórico
  domain/         # tipos, fábricas de objetos, constantes, validação zod
  services/       # storage adapter, export (png/json)
  hooks/          # atalhos, autosave
  lib/            # utils
```