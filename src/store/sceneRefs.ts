import type { CameraControls } from '@react-three/drei'
import type { WebGLRenderer } from 'three'

/**
 * Referências imperativas da cena 3D, para uso fora do React Three Fiber
 * (exportar PNG, desabilitar a câmera de forma síncrona durante um arraste).
 */
export const sceneRefs: {
  gl: WebGLRenderer | null
  controls: CameraControls | null
  invalidate: (() => void) | null
} = {
  gl: null,
  controls: null,
  invalidate: null,
}

/** Desabilita a câmera imediatamente (antes que ela comece a girar junto com o arraste). */
export function setCameraEnabled(enabled: boolean) {
  if (sceneRefs.controls) sceneRefs.controls.enabled = enabled
}
