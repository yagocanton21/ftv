import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { BallObject, PlayerObject, SceneObject, ZoneObject } from '@/domain/types'
import { useSimulationStore } from '@/store/simulationStore'
import { useDocumentStore } from '@/store/documentStore'
import { getInterpolatedState } from '@/domain/simulation'

/**
 * Modelos 3D anatômicos esportivos para futevôlei, bolas e equipamentos de quadra.
 * Convenção: frente do atleta = +X local.
 */

const SKIN = '#c98e62'
const SHORTS = '#1e293b'
const HAIR = '#1c1917'
const noRaycast = () => null

export function PlayerModel({ obj }: { obj: PlayerObject }) {
  const rootGroupRef = useRef<THREE.Group>(null)
  const shadowMeshRef = useRef<THREE.Mesh>(null)

  // Membros inferiores articulados (quadril -> joelho -> pé)
  const leftLegRef = useRef<THREE.Group>(null)
  const leftKneeRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)
  const rightKneeRef = useRef<THREE.Group>(null)

  // Tronco, peito e respiração
  const torsoRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)

  // Membros superiores articulados (ombro -> cotovelo -> mão)
  const leftArmRef = useRef<THREE.Group>(null)
  const leftForearmRef = useRef<THREE.Group>(null)
  const rightArmRef = useRef<THREE.Group>(null)
  const rightForearmRef = useRef<THREE.Group>(null)

  const timeline = useDocumentStore((s) => s.exercise.timeline)
  const keyframes = timeline?.keyframes?.[obj.id]

  // Estado cinemático contínuo para marcha e corrida
  const walkPhaseRef = useRef(0)
  const prevPosRef = useRef({ x: obj.position.x, z: obj.position.z })

  useFrame((_, delta) => {
    if (!rootGroupRef.current) return

    const isPlaying = useSimulationStore.getState().isPlaying
    const currTime = useSimulationStore.getState().currentTime

    let isMoving = false
    let speed = 0

    if (keyframes && keyframes.length > 0) {
      const interpolated = getInterpolatedState(obj, currTime, keyframes)

      const dx = interpolated.position.x - prevPosRef.current.x
      const dz = interpolated.position.z - prevPosRef.current.z
      const dist = Math.hypot(dx, dz)
      speed = dist / Math.max(0.001, delta)
      isMoving = isPlaying && speed > 0.12

      prevPosRef.current.x = interpolated.position.x
      prevPosRef.current.z = interpolated.position.z
    }

    if (isMoving) {
      walkPhaseRef.current += delta * Math.min(18, Math.max(7, speed * 2.8))
    }

    const t = walkPhaseRef.current
    const isCoach = obj.role === 'coach'

    // 1. ELEVAÇÃO VERTICAL E DETECÇÃO DE AÇÕES DA SIMULAÇÃO
    let jumpElev = 0
    let isAtaque = false
    let isCabeca = false
    let isChapa = false
    let isPeito = false

    if (keyframes && keyframes.length > 0) {
      for (const kf of keyframes) {
        if (!kf.action) continue
        const act = kf.action.toLowerCase()
        const dt = currTime - kf.time
        const absDt = Math.abs(dt)

        if (act.includes('ataque')) {
          // Janela de salto de ataque na rede: 1.1s de impulsão e aterrissagem
          if (absDt < 0.55) {
            isAtaque = true
            const norm = absDt / 0.55
            // Parábola de física de salto: no pico (dt = 0) atinge 1.10m!
            // Com 1.75m de altura base, o topo da cabeça alcança 2.85m (bem acima da rede de 2.20m!)
            const curve = Math.max(0, 1 - norm * norm)
            jumpElev = Math.max(jumpElev, 1.10 * curve)
          }
        } else if (act.includes('cabeça') || act.includes('cabeca')) {
          if (absDt < 0.45) {
            isCabeca = true
            const norm = absDt / 0.45
            const curve = Math.max(0, 1 - norm * norm)
            jumpElev = Math.max(jumpElev, 0.65 * curve)
          }
        } else if (act.includes('chapa') && absDt < 0.50) {
          isChapa = true
        } else if (act.includes('peito') && absDt < 0.50) {
          isPeito = true
        }
      }
    }

    // Se estiver em salto técnico (ataque ou cabeceio), segue com alta responsividade a curva parabólica
    // garantindo que atinja o pico completo de 1.10m no ataque sobre a rede de 2.20m
    if (jumpElev > 0) {
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(
        rootGroupRef.current.position.y,
        jumpElev,
        0.85
      )
    } else if (isMoving) {
      const runBob = Math.abs(Math.sin(t * 2)) * 0.052
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(
        rootGroupRef.current.position.y,
        runBob,
        0.35
      )
    } else {
      rootGroupRef.current.position.y = THREE.MathUtils.lerp(
        rootGroupRef.current.position.y,
        0,
        0.35
      )
    }

    // Atualiza a sombra no solo: fica fixa na areia e diminui proporcionalmente à altura do salto
    if (shadowMeshRef.current) {
      const currentY = rootGroupRef.current.position.y
      const shadowScale = Math.max(0.35, 1 - currentY * 0.45)
      shadowMeshRef.current.scale.set(shadowScale, shadowScale, 1)
      const mat = shadowMeshRef.current.material as THREE.MeshBasicMaterial
      if (mat) {
        mat.opacity = Math.max(0.10, 0.38 - currentY * 0.25)
      }
    }

    // Balanço lateral orgânico de quadril (transferência de peso entre passadas na areia)
    const targetPelvisRoll = isChapa ? -0.06 : isMoving ? Math.sin(t) * 0.048 : Math.sin(currTime * 1.6) * 0.012
    rootGroupRef.current.rotation.x = THREE.MathUtils.lerp(
      rootGroupRef.current.rotation.x,
      targetPelvisRoll,
      0.2
    )

    // 2. BIOMECÂNICA DAS PERNAS
    let targetLeftHipZ = 0
    let targetRightHipZ = 0
    let targetLeftHipX = 0
    let targetRightHipX = 0
    let targetLeftKneeZ = 0
    let targetRightKneeZ = 0

    if (isAtaque) {
      // ATAQUE DE CABEÇA: pernas fletidas para trás no ar criando o arco de força para a testada
      targetLeftHipZ = -0.42
      targetRightHipZ = -0.42
      targetLeftHipX = -0.12
      targetRightHipX = 0.12
      targetLeftKneeZ = 1.35
      targetRightKneeZ = 1.35
    } else if (isCabeca) {
      // CABECEIO / PASSE DE CABEÇA: flexão de impulsão vertical
      targetLeftHipZ = -0.32
      targetRightHipZ = -0.32
      targetLeftKneeZ = 0.95
      targetRightKneeZ = 0.95
    } else if (isChapa) {
      // CHAPA: abertura de perna com rotação externa de quadril (mostrando a face interna do pé)
      targetRightHipZ = 0.96
      targetRightHipX = 0.86
      targetRightKneeZ = 0.78
      targetLeftHipZ = -0.22
      targetLeftKneeZ = 0.38
    } else if (isPeito) {
      // PEITO: base baixa com joelhos flexionados entrando embaixo da trajetória da bola
      targetLeftHipZ = -0.2
      targetRightHipZ = 0.2
      targetLeftKneeZ = 0.55
      targetRightKneeZ = 0.55
    } else if (isMoving) {
      const legAmp = Math.min(0.78, 0.45 + speed * 0.07)
      const swing = Math.sin(t) * legAmp
      targetLeftHipZ = swing
      targetRightHipZ = -swing
      // Joelho dobra na perna de trás e estende na passada da frente
      targetLeftKneeZ = swing < 0 ? Math.min(1.45, -swing * 2.0) : 0.08
      targetRightKneeZ = -swing < 0 ? Math.min(1.45, swing * 2.0) : 0.08
    } else {
      const idleBreath = Math.sin(currTime * 2.2) * 0.015
      targetLeftHipZ = -0.06
      targetRightHipZ = -0.06
      targetLeftHipX = -0.08
      targetRightHipX = 0.08
      targetLeftKneeZ = 0.18 + idleBreath
      targetRightKneeZ = 0.18 + idleBreath
    }

    if (leftLegRef.current && rightLegRef.current) {
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, targetLeftHipZ, 0.25)
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, targetRightHipZ, 0.25)
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, targetLeftHipX, 0.25)
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, targetRightHipX, 0.25)
    }

    if (leftKneeRef.current && rightKneeRef.current) {
      leftKneeRef.current.rotation.z = THREE.MathUtils.lerp(leftKneeRef.current.rotation.z, targetLeftKneeZ, 0.28)
      rightKneeRef.current.rotation.z = THREE.MathUtils.lerp(rightKneeRef.current.rotation.z, targetRightKneeZ, 0.28)
    }

    // 3. TRONCO E CABEÇA (Postura atlética e impacto da testada)
    let targetTorsoZ = 0
    let targetHeadZ = 0

    if (isAtaque) {
      // ATAQUE DE CABEÇA: tronco flete com força para frente projetando a testada para baixo
      targetTorsoZ = 0.58
      targetHeadZ = 0.45
    } else if (isCabeca) {
      // CABECEIO: tronco arqueia e cabeceia na altura da bola
      targetTorsoZ = 0.40
      targetHeadZ = 0.30
    } else if (isPeito) {
      // PEITO: tronco estufa e projeta a caixa torácica para cima e para trás
      targetTorsoZ = -0.52
      targetHeadZ = -0.32
    } else if (isChapa) {
      // CHAPA: tronco compensa o golpe recuando suavemente
      targetTorsoZ = -0.25
      targetHeadZ = 0.15
    } else if (isMoving) {
      targetTorsoZ = 0.08 + Math.sin(t * 2) * 0.025
      targetHeadZ = 0
    } else {
      targetTorsoZ = 0.05 + Math.sin(currTime * 2.2) * 0.018
      targetHeadZ = Math.sin(currTime * 1.5) * 0.012
    }

    if (torsoRef.current) {
      torsoRef.current.rotation.z = THREE.MathUtils.lerp(torsoRef.current.rotation.z, targetTorsoZ, 0.25)
    }
    if (headRef.current) {
      headRef.current.rotation.z = THREE.MathUtils.lerp(headRef.current.rotation.z, targetHeadZ, 0.28)
    }

    // 4. BRAÇOS E COTOVELOS
    let targetLeftShoulderZ = 0
    let targetRightShoulderZ = 0
    let targetLeftShoulderX = 0
    let targetRightShoulderX = 0
    let targetLeftElbowZ = 0
    let targetRightElbowZ = 0

    if (isCoach && isPlaying) {
      const toss = Math.sin(currTime * 2.6)
      targetLeftShoulderZ = toss > 0 ? 0.8 : -0.2
      targetRightShoulderZ = toss > 0 ? 0.8 : -0.2
      targetLeftElbowZ = -0.4
      targetRightElbowZ = -0.4
    } else if (isPeito) {
      // PEITO: braços bem abertos para trás dando estabilidade
      targetLeftShoulderX = -0.92
      targetRightShoulderX = 0.92
      targetLeftElbowZ = -0.45
      targetRightElbowZ = -0.45
    } else if (isAtaque) {
      // ATAQUE DE CABEÇA: braços flexionados para impulsão e equilíbrio no salto
      targetLeftShoulderZ = -0.55
      targetRightShoulderZ = -0.55
      targetLeftShoulderX = -0.45
      targetRightShoulderX = 0.45
      targetLeftElbowZ = -0.85
      targetRightElbowZ = -0.85
    } else if (isCabeca) {
      targetLeftShoulderZ = -0.7
      targetRightShoulderZ = -0.7
      targetLeftShoulderX = -0.35
      targetRightShoulderX = 0.35
      targetLeftElbowZ = -0.5
      targetRightElbowZ = -0.5
    } else if (isChapa) {
      // CHAPA: braços abertos em cruz para manter equilíbrio
      targetLeftShoulderX = -0.82
      targetRightShoulderX = 0.82
      targetLeftElbowZ = -0.85
      targetRightElbowZ = -0.85
    } else if (isMoving) {
      const swing = Math.sin(t) * 0.65
      targetLeftShoulderZ = -swing
      targetRightShoulderZ = swing
      targetLeftShoulderX = -0.15
      targetRightShoulderX = 0.15
      targetLeftElbowZ = -1.25 + Math.sin(t) * 0.2
      targetRightElbowZ = -1.25 - Math.sin(t) * 0.2
    } else {
      const idleSway = Math.sin(currTime * 1.5) * 0.02
      targetLeftShoulderZ = 0.05 + idleSway
      targetRightShoulderZ = 0.05 - idleSway
      targetLeftShoulderX = -0.18
      targetRightShoulderX = 0.18
      targetLeftElbowZ = -0.38
      targetRightElbowZ = -0.38
    }

    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, targetLeftShoulderZ, 0.25)
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, targetRightShoulderZ, 0.25)
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, targetLeftShoulderX, 0.25)
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, targetRightShoulderX, 0.25)
    }

    if (leftForearmRef.current && rightForearmRef.current) {
      leftForearmRef.current.rotation.z = THREE.MathUtils.lerp(leftForearmRef.current.rotation.z, targetLeftElbowZ, 0.26)
      rightForearmRef.current.rotation.z = THREE.MathUtils.lerp(rightForearmRef.current.rotation.z, targetRightElbowZ, 0.26)
    }
  })

  const shirtColor = obj.role === 'coach' ? '#111827' : obj.color

  return (
    <group>
      {/* Sombra de contato que permanece na areia mesmo no salto alto */}
      <mesh ref={shadowMeshRef} position-y={0.012} rotation-x={-Math.PI / 2} raycast={noRaycast}>
        <circleGeometry args={[0.34, 24]} />
        <meshBasicMaterial color="#000" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Indicador de orientação no chão */}
      <DirectionArrow color={obj.color} distance={0.55} />
      {obj.role === 'coach' && (
        <mesh position={[0, 0.012, 0]} rotation-x={-Math.PI / 2} raycast={noRaycast}>
          <ringGeometry args={[0.34, 0.40, 6]} />
          <meshBasicMaterial color={obj.color} transparent opacity={0.9} />
        </mesh>
      )}

      {/* Corpo do atleta com elevação vertical e salto no ar */}
      <group ref={rootGroupRef}>
        {/* 1. PERNA ESQUERDA ARTICULADA (Bermuda -> Coxa -> Joelho -> Canela -> Pé) */}
      <group ref={leftLegRef} position={[0, 0.82, -0.13]}>
        {/* Perna da bermuda esportiva (acompanha o movimento da coxa) */}
        <mesh position={[0, -0.09, 0]} castShadow>
          <cylinderGeometry args={[0.096, 0.088, 0.20, 16]} />
          <meshStandardMaterial color={SHORTS} roughness={0.8} />
        </mesh>
        {/* Friso lateral esportivo branco da bermuda */}
        <mesh position={[0, -0.09, -0.09]} castShadow>
          <boxGeometry args={[0.03, 0.18, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>

        {/* Coxa de atleta em tom de pele */}
        <mesh position={[0, -0.20, 0]} castShadow>
          <cylinderGeometry args={[0.076, 0.064, 0.22, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>

        {/* Joelho esquerdo articulado */}
        <group ref={leftKneeRef} position={[0, -0.31, 0]}>
          {/* Patela anatômica */}
          <mesh position={[0.01, 0, 0]} castShadow>
            <sphereGeometry args={[0.062, 12, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* Canela e panturrilha de atleta */}
          <mesh position={[0, -0.19, 0]} castShadow>
            <cylinderGeometry args={[0.060, 0.048, 0.38, 16]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* Pé anatômico apoiado na areia */}
          <mesh position={[0.05, -0.38, 0]} castShadow>
            <boxGeometry args={[0.19, 0.065, 0.095]} />
            <meshStandardMaterial color={SKIN} roughness={0.75} />
          </mesh>
        </group>
      </group>

      {/* 2. PERNA DIREITA ARTICULADA */}
      <group ref={rightLegRef} position={[0, 0.82, 0.13]}>
        {/* Perna da bermuda esportiva */}
        <mesh position={[0, -0.09, 0]} castShadow>
          <cylinderGeometry args={[0.096, 0.088, 0.20, 16]} />
          <meshStandardMaterial color={SHORTS} roughness={0.8} />
        </mesh>
        {/* Friso lateral esportivo branco */}
        <mesh position={[0, -0.09, 0.09]} castShadow>
          <boxGeometry args={[0.03, 0.18, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>

        {/* Coxa de atleta */}
        <mesh position={[0, -0.20, 0]} castShadow>
          <cylinderGeometry args={[0.076, 0.064, 0.22, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>

        {/* Joelho direito articulado */}
        <group ref={rightKneeRef} position={[0, -0.31, 0]}>
          {/* Patela anatômica */}
          <mesh position={[0.01, 0, 0]} castShadow>
            <sphereGeometry args={[0.062, 12, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* Canela e panturrilha */}
          <mesh position={[0, -0.19, 0]} castShadow>
            <cylinderGeometry args={[0.060, 0.048, 0.38, 16]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* Pé anatômico apoiado na areia */}
          <mesh position={[0.05, -0.38, 0]} castShadow>
            <boxGeometry args={[0.19, 0.065, 0.095]} />
            <meshStandardMaterial color={SKIN} roughness={0.75} />
          </mesh>
        </group>
      </group>

      {/* Bermuda de Futevôlei - Quadril e Cós */}
      <mesh position={[0, 0.87, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.185, 0.22, 20]} />
        <meshStandardMaterial color={SHORTS} roughness={0.8} />
      </mesh>

      {/* 3. TRONCO SUPERIOR - CAMISETA ESPORTIVA E CABEÇA */}
      <group ref={torsoRef} position={[0, 0.96, 0]}>
        {/* Abdômen e cintura na cor da camiseta */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.19, 0.18, 0.20, 20]} />
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>

        {/* Peitoral e Tórax com corte atlético */}
        <mesh position={[0, 0.30, 0]} castShadow>
          <cylinderGeometry args={[0.225, 0.19, 0.22, 20]} />
          <meshStandardMaterial color={shirtColor} roughness={0.6} />
        </mesh>

        {/* Frisos brancos esportivos nas laterais da camiseta */}
        <mesh position={[0, 0.21, -0.19]} castShadow>
          <boxGeometry args={[0.04, 0.34, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.21, 0.19]} castShadow>
          <boxGeometry args={[0.04, 0.34, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>

        {/* Dorsal atlética nas costas da camiseta */}
        <mesh position={[-0.195, 0.30, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[0.14, 0.14]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} depthWrite={false} />
        </mesh>

        {/* Emblema esportivo no peito */}
        <mesh position={[0.195, 0.31, -0.06]} rotation-y={-Math.PI / 2}>
          <circleGeometry args={[0.028, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
        </mesh>

        {/* Gola esportiva branca */}
        <mesh position={[0, 0.41, 0]} rotation-x={Math.PI / 2} castShadow>
          <torusGeometry args={[0.078, 0.014, 12, 24]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>

        {/* Pescoço anatômico (conecta suavemente o tórax à cabeça sem nenhum vão!) */}
        <mesh position={[0, 0.46, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.082, 0.12, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>

        {/* 4. CABEÇA E CABELO ARTICULADOS (Pivô perfeitamente sobre o topo do pescoço) */}
        <group ref={headRef} position={[0, 0.52, 0]}>
          {/* Cabeça / Rosto */}
          <mesh position={[0, 0.10, 0]} castShadow>
            <sphereGeometry args={[0.128, 24, 20]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          {/* Cabelo esportivo moderno (cobre o topo, traseira e nuca) */}
          <mesh position={[0, 0.12, -0.01]} castShadow>
            <sphereGeometry args={[0.134, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <meshStandardMaterial color={HAIR} roughness={0.9} />
          </mesh>
          {/* Olhos esportivos estilizados (olhando para a frente +X) */}
          <mesh position={[0.115, 0.10, -0.04]}>
            <boxGeometry args={[0.02, 0.022, 0.028]} />
            <meshStandardMaterial color="#1a1816" roughness={0.5} />
          </mesh>
          <mesh position={[0.115, 0.10, 0.04]}>
            <boxGeometry args={[0.02, 0.022, 0.028]} />
            <meshStandardMaterial color="#1a1816" roughness={0.5} />
          </mesh>
        </group>

        {/* 5. BRAÇO ESQUERDO (Manga da camiseta -> Ombro -> Bíceps -> Cotovelo -> Munhequeira -> Mão) */}
        <group ref={leftArmRef} position={[0, 0.38, -0.25]}>
          {/* Manga da camiseta cobrindo o ombro */}
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.078, 16, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.074, 0.068, 0.10, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.6} />
          </mesh>
          {/* Braço superior (bíceps) */}
          <mesh position={[0, -0.14, 0]} castShadow>
            <cylinderGeometry args={[0.060, 0.050, 0.16, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>

          {/* Cotovelo esquerdo articulado */}
          <group ref={leftForearmRef} position={[0, -0.22, 0]}>
            {/* Rótula do cotovelo */}
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.050, 10, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.65} />
            </mesh>
            {/* Antebraço atlético */}
            <mesh position={[0, -0.09, 0]} castShadow>
              <cylinderGeometry args={[0.048, 0.040, 0.18, 14]} />
              <meshStandardMaterial color={SKIN} roughness={0.65} />
            </mesh>
            {/* Munhequeira branca de futevôlei */}
            <mesh position={[0, -0.17, 0]} castShadow>
              <cylinderGeometry args={[0.044, 0.044, 0.04, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            {/* Mão de atleta */}
            <mesh position={[0, -0.22, 0]} castShadow>
              <sphereGeometry args={[0.042, 10, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.65} />
            </mesh>
          </group>
        </group>

        {/* 6. BRAÇO DIREITO */}
        <group ref={rightArmRef} position={[0, 0.38, 0.25]}>
          {/* Manga da camiseta cobrindo o ombro */}
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.078, 16, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.074, 0.068, 0.10, 16]} />
            <meshStandardMaterial color={shirtColor} roughness={0.6} />
          </mesh>
          {/* Braço superior */}
          <mesh position={[0, -0.14, 0]} castShadow>
            <cylinderGeometry args={[0.060, 0.050, 0.16, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>

          {/* Cotovelo direito articulado */}
          <group ref={rightForearmRef} position={[0, -0.22, 0]}>
            {/* Rótula do cotovelo */}
            <mesh position={[0, 0, 0]} castShadow>
              <sphereGeometry args={[0.050, 10, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.65} />
            </mesh>
            {/* Antebraço atlético */}
            <mesh position={[0, -0.09, 0]} castShadow>
              <cylinderGeometry args={[0.048, 0.040, 0.18, 14]} />
              <meshStandardMaterial color={SKIN} roughness={0.65} />
            </mesh>
            {/* Munhequeira branca */}
            <mesh position={[0, -0.17, 0]} castShadow>
              <cylinderGeometry args={[0.044, 0.044, 0.04, 12]} />
              <meshStandardMaterial color="#ffffff" roughness={0.4} />
            </mesh>
            {/* Mão de atleta */}
            <mesh position={[0, -0.22, 0]} castShadow>
              <sphereGeometry args={[0.042, 10, 10]} />
              <meshStandardMaterial color={SKIN} roughness={0.65} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  </group>
)
}

export function DirectionArrow({ color, distance }: { color: string; distance: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0.22, 0)
    s.lineTo(-0.02, 0.15)
    s.lineTo(0.04, 0)
    s.lineTo(-0.02, -0.15)
    s.closePath()
    return s
  }, [])
  return (
    <mesh position={[distance, 0.014, 0]} rotation-x={-Math.PI / 2} raycast={noRaycast}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} depthWrite={false} />
    </mesh>
  )
}

export function BallModel({ obj }: { obj: BallObject }) {
  const r = 0.11
  const y = Math.max(r, obj.height)
  const airborne = y > r + 0.05
  return (
    <group>
      <group position-y={y}>
        <mesh castShadow>
          <sphereGeometry args={[r, 28, 20]} />
          <meshStandardMaterial color={obj.color} roughness={0.45} />
        </mesh>
        {/* Gomos */}
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[r * 1.001, 0.008, 6, 40]} />
          <meshStandardMaterial color="#1d4ed8" />
        </mesh>
        <mesh rotation-y={Math.PI / 2}>
          <torusGeometry args={[r * 1.001, 0.008, 6, 40]} />
          <meshStandardMaterial color="#16a34a" />
        </mesh>
      </group>
      {airborne && (
        <>
          <Line points={[[0, 0.01, 0], [0, y - r, 0]]} color="#ffffff" lineWidth={1} dashed dashSize={0.08} gapSize={0.06} transparent opacity={0.7} raycast={noRaycast} />
          <mesh position-y={0.012} rotation-x={-Math.PI / 2} raycast={noRaycast}>
            <circleGeometry args={[r * 0.9, 24]} />
            <meshBasicMaterial color="#000" transparent opacity={0.25} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  )
}

function ConeModel({ color }: { color: string }) {
  return (
    <group>
      <mesh position-y={0.15} castShadow>
        <coneGeometry args={[0.11, 0.28, 20]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position-y={0.01} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.02, 0.24]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}

function HoopModel({ color }: { color: string }) {
  return (
    <mesh position-y={0.02} rotation-x={Math.PI / 2} castShadow>
      <torusGeometry args={[0.4, 0.02, 10, 48]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  )
}

function MarkerModel({ color }: { color: string }) {
  return (
    <mesh position-y={0.008} castShadow receiveShadow>
      <cylinderGeometry args={[0.15, 0.16, 0.016, 28]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  )
}

function ObstacleModel({ color }: { color: string }) {
  return (
    <group>
      {[-0.4, 0.4].map((z) => (
        <group key={z}>
          <mesh position={[0, 0.16, z]} castShadow>
            <boxGeometry args={[0.03, 0.32, 0.03]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.01, z]} castShadow>
            <boxGeometry args={[0.25, 0.02, 0.04]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.035, 0.035, 0.84]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </group>
  )
}

function ZoneModel({ obj }: { obj: ZoneObject }) {
  const { w, d } = obj.size
  const outline = useMemo<[number, number, number][]>(() => {
    if (obj.shape === 'rect') {
      return [
        [-w / 2, 0, -d / 2],
        [w / 2, 0, -d / 2],
        [w / 2, 0, d / 2],
        [-w / 2, 0, d / 2],
        [-w / 2, 0, -d / 2],
      ]
    }
    return Array.from({ length: 65 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2
      return [Math.cos(a) * (w / 2), 0, Math.sin(a) * (d / 2)] as [number, number, number]
    })
  }, [obj.shape, w, d])

  return (
    <group position-y={0.012}>
      <mesh rotation-x={-Math.PI / 2} scale={obj.shape === 'circle' ? [w / 2, d / 2, 1] : [1, 1, 1]} renderOrder={-1}>
        {obj.shape === 'rect' ? <planeGeometry args={[w, d]} /> : <circleGeometry args={[1, 48]} />}
        <meshBasicMaterial color={obj.color} transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <Line points={outline} color={obj.color} lineWidth={2} raycast={noRaycast} />
    </group>
  )
}

export function ObjectModel({ obj }: { obj: SceneObject }) {
  switch (obj.type) {
    case 'player':
      return <PlayerModel obj={obj} />
    case 'ball':
      return <BallModel obj={obj} />
    case 'cone':
      return <ConeModel color={obj.color} />
    case 'hoop':
      return <HoopModel color={obj.color} />
    case 'marker':
      return <MarkerModel color={obj.color} />
    case 'obstacle':
      return <ObstacleModel color={obj.color} />
    case 'zone':
      return <ZoneModel obj={obj} />
  }
}

/** Raio aproximado do objeto no chão (anel de seleção e alça de rotação). */
export function footprintRadius(obj: SceneObject) {
  switch (obj.type) {
    case 'player':
      return 0.45
    case 'hoop':
      return 0.5
    case 'obstacle':
      return 0.55
    case 'zone':
      return Math.max(obj.size.w, obj.size.d) / 2 + 0.15
    default:
      return 0.25
  }
}
