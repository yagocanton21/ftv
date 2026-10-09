import { create } from 'zustand'
import { sceneRefs } from './sceneRefs'

interface SimulationState {
  isPlaying: boolean
  currentTime: number
  speed: number
  loop: boolean
  duration: number

  play: () => void
  pause: () => void
  togglePlay: () => void
  seek: (time: number) => void
  reset: () => void
  setSpeed: (speed: number) => void
  setLoop: (loop: boolean) => void
  setDuration: (duration: number) => void
  advanceTime: (deltaSeconds: number) => void
}

export const useSimulationStore = create<SimulationState>()((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  speed: 1,
  loop: true,
  duration: 8,

  play: () => {
    set({ isPlaying: true })
    sceneRefs.invalidate?.()
  },
  pause: () => {
    set({ isPlaying: false })
    sceneRefs.invalidate?.()
  },
  togglePlay: () => {
    set((s) => ({ isPlaying: !s.isPlaying }))
    sceneRefs.invalidate?.()
  },

  seek: (time) => {
    const d = get().duration
    set({ currentTime: Math.max(0, Math.min(d, time)) })
    sceneRefs.invalidate?.()
  },

  reset: () => {
    set({ currentTime: 0 })
    sceneRefs.invalidate?.()
  },

  setSpeed: (speed) => set({ speed }),
  setLoop: (loop) => set({ loop }),
  setDuration: (duration) => set({ duration: Math.max(1, duration) }),

  advanceTime: (deltaSeconds) => {
    const { isPlaying, currentTime, speed, duration, loop } = get()
    if (!isPlaying) return

    const nextTime = currentTime + deltaSeconds * speed
    if (nextTime >= duration) {
      if (loop) {
        set({ currentTime: nextTime % duration })
      } else {
        set({ currentTime: duration, isPlaying: false })
      }
    } else {
      set({ currentTime: nextTime })
    }
    sceneRefs.invalidate?.()
  },
}))
