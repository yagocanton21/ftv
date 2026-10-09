import { create } from 'zustand'
import type { CameraPreset, Tool, Vec2 } from '@/domain/types'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

/** Pré-visualização transitória durante arraste/rotação (não entra no histórico). */
export type Preview = Record<string, { position?: Vec2; rotation?: number }>

/**
 * Store de INTERFACE: não é persistido nem entra no desfazer/refazer.
 */
interface UiState {
  tool: Tool
  selectedIds: string[]
  hoveredId: string | null
  preview: Preview
  isDragging: boolean
  camera: { preset: CameraPreset; nonce: number }
  mode: 'edit' | 'present'
  propertiesOpen: boolean
  saveStatus: SaveStatus
  lastSavedAt: string | null

  setTool: (tool: Tool) => void
  select: (ids: string[]) => void
  toggleSelect: (id: string) => void
  clearSelection: () => void
  setHovered: (id: string | null) => void
  setPreview: (preview: Preview) => void
  setDragging: (v: boolean) => void
  /** Aplica um preset de câmera. Chamar de novo com o mesmo preset restaura a câmera. */
  setCameraPreset: (preset: CameraPreset) => void
  setMode: (mode: 'edit' | 'present') => void
  setPropertiesOpen: (v: boolean) => void
  setSaveStatus: (s: SaveStatus, at?: string) => void
  /** ID do jogador cujo trajeto está sendo gravado com cliques na areia */
  recordingPlayerId: string | null
  setRecordingPlayerId: (id: string | null) => void
  /** Ponto pendente clicado na areia aguardando a seleção do fundamento */
  pendingStepPoint: Vec2 | null
  setPendingStepPoint: (pt: Vec2 | null) => void
}

export const useUiStore = create<UiState>()((set) => ({
  tool: 'select',
  selectedIds: [],
  hoveredId: null,
  preview: {},
  isDragging: false,
  camera: { preset: 'iso', nonce: 0 },
  mode: 'edit',
  propertiesOpen: false,
  saveStatus: 'idle',
  lastSavedAt: null,
  recordingPlayerId: null,
  pendingStepPoint: null,

  setTool: (tool) => set({ tool }),
  select: (ids) => set({ selectedIds: ids }),
  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id) ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  setHovered: (hoveredId) => set({ hoveredId }),
  setPreview: (preview) => set({ preview }),
  setDragging: (isDragging) => set({ isDragging }),
  setCameraPreset: (preset) => set((s) => ({ camera: { preset, nonce: s.camera.nonce + 1 } })),
  setMode: (mode) => set({ mode, tool: 'select' }),
  setPropertiesOpen: (propertiesOpen) => set({ propertiesOpen }),
  setSaveStatus: (saveStatus, at) => set((s) => ({ saveStatus, lastSavedAt: at ?? s.lastSavedAt })),
  setRecordingPlayerId: (recordingPlayerId) => set({ recordingPlayerId }),
  setPendingStepPoint: (pendingStepPoint) => set({ pendingStepPoint }),
}))
