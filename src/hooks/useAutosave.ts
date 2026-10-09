import { useEffect } from 'react'
import { saveNow } from '@/services/projectActions'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'

const DEBOUNCE_MS = 800

/** Salva automaticamente o exercício após cada alteração (com debounce). */
export function useAutosave(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout> | undefined

    const unsub = useDocumentStore.subscribe((state, prev) => {
      if (state.exercise === prev.exercise) return
      // Troca de projeto já é salva pelas ações de projeto.
      if (state.exercise.id !== prev.exercise.id) return
      useUiStore.getState().setSaveStatus('saving')
      clearTimeout(timer)
      timer = setTimeout(() => void saveNow(true), DEBOUNCE_MS)
    })

    const flush = () => {
      if (useUiStore.getState().saveStatus === 'saving') void saveNow(true)
    }
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', flush)

    return () => {
      unsub()
      clearTimeout(timer)
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [enabled])
}
