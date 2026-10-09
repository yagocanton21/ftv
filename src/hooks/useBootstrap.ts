import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { seedFrenteECostas, seedAtaqueCompleto } from '@/domain/seed'
import type { Exercise } from '@/domain/types'
import { storage } from '@/services/storage'
import { useDocumentStore } from '@/store/documentStore'
import { useUiStore } from '@/store/uiStore'
import { nowIso } from '@/lib/utils'

/** Carrega o último projeto aberto (ou cria os exercícios de demonstração no primeiro acesso). */
export function useBootstrap() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let ex: Exercise | null = null
      try {
        const lastId = await storage.getLastOpenedId()
        if (lastId) ex = await storage.get(lastId)
        if (!ex) {
          const list = await storage.list()
          if (list[0]) ex = await storage.get(list[0].id)
        }
      } catch (err) {
        console.error(err)
        toast.error('Não foi possível recuperar o último projeto. Um novo foi criado.')
      }
      if (!ex) {
        ex = seedAtaqueCompleto()
        const ex2 = seedFrenteECostas()
        await storage.save(ex).catch(() => undefined)
        await storage.save(ex2).catch(() => undefined)
      }
      await storage.setLastOpenedId(ex.id).catch(() => undefined)
      if (cancelled) return
      useDocumentStore.getState().load(ex)
      useUiStore.getState().setSaveStatus('saved', nowIso())
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return ready
}
