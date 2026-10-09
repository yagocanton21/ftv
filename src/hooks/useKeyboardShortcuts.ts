import { useEffect } from 'react'
import type { CameraPreset } from '@/domain/types'
import {
  activateTool,
  deleteSelected,
  duplicateSelected,
  rotateSelected,
  selectAll,
  toggleLockSelected,
} from '@/services/editorActions'
import { saveNow } from '@/services/projectActions'
import { useDocumentStore } from '@/store/documentStore'
import { useSimulationStore } from '@/store/simulationStore'
import { useUiStore } from '@/store/uiStore'
import { ensureExerciseKeyframes } from '@/domain/simulation'
import { isTypingTarget } from '@/lib/utils'

const CAMERA_KEYS: Record<string, CameraPreset> = { '1': 'top', '2': 'iso', '3': 'side', '4': 'end', '5': 'free' }

/** Atalhos de teclado globais (seção 10.8 da spec). */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      // Ctrl+S funciona até dentro de campos de texto.
      if (mod && key === 's') {
        e.preventDefault()
        void saveNow()
        return
      }
      if (isTypingTarget(e.target)) return

      const ui = useUiStore.getState()
      const { undo, redo } = useDocumentStore.temporal.getState()

      if (mod) {
        if (key === 'z' && !e.shiftKey) undo()
        else if ((key === 'z' && e.shiftKey) || key === 'y') redo()
        else if (key === 'd') duplicateSelected()
        else if (key === 'a') selectAll()
        else if (key === 'l') toggleLockSelected()
        else return
        e.preventDefault()
        return
      }

      // Espaço: Play / Pause da simulação
      if (e.code === 'Space' || key === ' ') {
        e.preventDefault()
        const doc = useDocumentStore.getState()
        ensureExerciseKeyframes(doc.exercise, (kfs, d) => {
          doc.setKeyframesForExercise(kfs, d)
          if (d) useSimulationStore.getState().setDuration(d)
        })
        useSimulationStore.getState().togglePlay()
        return
      }

      if (ui.mode === 'present') {
        if (key === 'escape') ui.setMode('edit')
        else if (CAMERA_KEYS[key]) ui.setCameraPreset(CAMERA_KEYS[key])
        return
      }

      switch (key) {
        case 'v':
          ui.setTool('select')
          break
        case 'p':
          activateTool('player')
          break
        case 'b':
          activateTool('ball')
          break
        case 'c':
          activateTool('cone')
          break
        case 'r':
          rotateSelected(e.shiftKey ? -15 : 15)
          break
        case 'delete':
        case 'backspace':
          deleteSelected()
          break
        case 'escape':
          if (ui.tool !== 'select') ui.setTool('select')
          else ui.clearSelection()
          break
        default:
          if (CAMERA_KEYS[key]) ui.setCameraPreset(CAMERA_KEYS[key])
          else return
      }
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
