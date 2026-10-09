import * as THREE from 'three'

/**
 * Texturas procedurais foto-realistas de alta qualidade para o estúdio.
 * Gera mapa de cor difuso, mapa de normais 3D (relevo de areia penteada/dunas)
 * e mapa de rugosidade para iluminação dinâmica.
 */

interface SandTextures {
  map: THREE.CanvasTexture
  normalMap: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
}

let sandTexturesCache: SandTextures | null = null
let netCache: THREE.CanvasTexture | null = null

// Gerador pseudo-aleatório com semente para textura uniforme e reproduzível
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getSandTextures(): SandTextures {
  if (sandTexturesCache) return sandTexturesCache

  const size = 512
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = colorCanvas.height = size
  const colorCtx = colorCanvas.getContext('2d')!

  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = normalCanvas.height = size
  const normalCtx = normalCanvas.getContext('2d')!

  const roughnessCanvas = document.createElement('canvas')
  roughnessCanvas.width = roughnessCanvas.height = size
  const roughnessCtx = roughnessCanvas.getContext('2d')!

  const rand = mulberry32(1337)

  // 1. Matriz de altura (Heightmap) contínua para relevo e normais
  const heightData = new Float32Array(size * size)

  // Criamos camadas harmônicas: ondas de areia penteada típica de arena de futevôlei + dunas suaves
  for (let y = 0; y < size; y++) {
    const ny = y / size
    for (let x = 0; x < size; x++) {
      const nx = x / size
      const idx = y * size + x

      // Ondulação suave de areia penteada (trajetória de rastelo suave)
      const ripple1 = Math.sin(nx * Math.PI * 2 * 12 + Math.cos(ny * Math.PI * 2 * 3) * 1.5) * 0.35
      const ripple2 = Math.sin((nx + ny * 0.5) * Math.PI * 2 * 24) * 0.18
      const dune = Math.sin(nx * Math.PI * 2 * 2) * Math.cos(ny * Math.PI * 2 * 2) * 0.3

      // Micro-ruído aleatório para grânulos de areia
      const micro = (rand() - 0.5) * 0.12

      heightData[idx] = ripple1 + ripple2 + dune + micro
    }
  }

  // 2. Pintura do Mapa de Cor (Areia dourada de praia / arena tratada de alta qualidade)
  const colorImg = colorCtx.createImageData(size, size)
  const normalImg = normalCtx.createImageData(size, size)
  const roughnessImg = roughnessCtx.createImageData(size, size)

  // Paleta de areia de praia premium (Rio / Arena de Futevôlei)
  // Base: dourada/cremosa, cumes mais claros com brilho de sol, vales mais aquecidos
  const rHigh = 248, gHigh = 236, bHigh = 205 // #f8eccd (cristas iluminadas)
  const rLow = 214, gLow = 190, bLow = 146 // #d6be92 (sombras das ondulações)

  const normalStrength = 2.2

  for (let y = 0; y < size; y++) {
    const yPrev = (y - 1 + size) % size
    const yNext = (y + 1) % size

    for (let x = 0; x < size; x++) {
      const xPrev = (x - 1 + size) % size
      const xNext = (x + 1) % size

      const i = (y * size + x) * 4
      const hCenter = heightData[y * size + x]

      // Gradiente espacial para vetor normal
      const dhdx = (heightData[y * size + xNext] - heightData[y * size + xPrev]) * normalStrength
      const dhdy = (heightData[yNext * size + x] - heightData[yPrev * size + x]) * normalStrength

      // Normal vector normalizado: N = (-dhdx, -dhdy, 1.0)
      const nz = 1.0
      const len = Math.hypot(dhdx, dhdy, nz)
      const nx = -dhdx / len
      const ny = -dhdy / len
      const nnz = nz / len

      // Mapa de normais em espaço tangente (R=X, G=Y, B=Z)
      normalImg.data[i] = Math.round((nx * 0.5 + 0.5) * 255)
      normalImg.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      normalImg.data[i + 2] = Math.round((nnz * 0.5 + 0.5) * 255)
      normalImg.data[i + 3] = 255

      // Variação de cor baseada na altura e no micro-grão
      const t = Math.max(0, Math.min(1, hCenter * 0.6 + 0.5))
      const grain = (rand() - 0.5) * 14

      const r = Math.round(rLow + (rHigh - rLow) * t + grain)
      const g = Math.round(gLow + (gHigh - gLow) * t + grain)
      const b = Math.round(bLow + (bHigh - bLow) * t + grain * 0.8)

      colorImg.data[i] = Math.min(255, Math.max(0, r))
      colorImg.data[i + 1] = Math.min(255, Math.max(0, g))
      colorImg.data[i + 2] = Math.min(255, Math.max(0, b))
      colorImg.data[i + 3] = 255

      // Rugosidade da areia (entre 0.88 e 0.98, dispersão natural da luz)
      const roughVal = Math.round(230 + (rand() - 0.5) * 20)
      roughnessImg.data[i] = roughVal
      roughnessImg.data[i + 1] = roughVal
      roughnessImg.data[i + 2] = roughVal
      roughnessImg.data[i + 3] = 255
    }
  }

  colorCtx.putImageData(colorImg, 0, 0)
  normalCtx.putImageData(normalImg, 0, 0)
  roughnessCtx.putImageData(roughnessImg, 0, 0)

  const mapTex = new THREE.CanvasTexture(colorCanvas)
  mapTex.wrapS = mapTex.wrapT = THREE.RepeatWrapping
  mapTex.colorSpace = THREE.SRGBColorSpace
  mapTex.anisotropy = 8

  const normalTex = new THREE.CanvasTexture(normalCanvas)
  normalTex.wrapS = normalTex.wrapT = THREE.RepeatWrapping
  normalTex.anisotropy = 8

  const roughTex = new THREE.CanvasTexture(roughnessCanvas)
  roughTex.wrapS = roughTex.wrapT = THREE.RepeatWrapping
  roughTex.anisotropy = 8

  sandTexturesCache = {
    map: mapTex,
    normalMap: normalTex,
    roughnessMap: roughTex,
  }

  return sandTexturesCache
}

export function getNetTexture() {
  if (netCache) return netCache
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  
  // Fundo 100% transparente
  ctx.clearRect(0, 0, size, size)

  // Corda principal escura (polietileno de alta tenacidade preto)
  ctx.strokeStyle = '#18181b'
  ctx.lineWidth = 5.5
  ctx.strokeRect(3, 3, size - 6, size - 6)

  // Realce sutil de iluminação solar na corda
  ctx.strokeStyle = '#3f3f46'
  ctx.lineWidth = 1.8
  ctx.strokeRect(4, 4, size - 8, size - 8)

  // Pequenos nós esféricos nas 4 interseções da malha
  ctx.fillStyle = '#09090b'
  const knots: [number, number][] = [
    [3, 3],
    [size - 3, 3],
    [3, size - 3],
    [size - 3, size - 3],
  ]
  for (const [kx, ky] of knots) {
    ctx.beginPath()
    ctx.arc(kx, ky, 4.5, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  netCache = tex
  return tex
}
