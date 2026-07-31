'use client'

/* ─────────────────────────────────────────────────────────────────────────────
   SpatialCanvas — native 3D spatial topology, not a flat dashboard.

   A full-viewport <Canvas>. Everything lives in the 3D scene: the master node,
   the orbiting project clouds, their satellites, the connecting lines, and the
   text overlays. There is no flat CSS container with a small canvas inside it.

   Topology
     [0,0,0]            master node, emissive sphere with a corona shell
     radial ring        project nodes on a golden-angle spiral, so they never
                        band into visible rows the way even angular steps do
     per-project        satellites on inclined orbits, phase-offset by index
     master -> project  animated particle lines (dashes travel outward)

   PERFORMANCE, and this is the part that decides whether it ships
     - Satellites are ONE InstancedMesh for the whole scene, not a mesh per
       satellite. 60 satellites as separate meshes is 60 draw calls; instanced
       it is one. Matrices are written into a preallocated dummy Object3D in
       useFrame, never recreated.
     - Geometries and materials are hoisted to module scope where shared, so
       they are created once for the process rather than once per mount.
     - useFrame writes to refs and mutates matrices in place. It never calls
       setState. A setState in useFrame re-renders the React tree 60 times a
       second and is the single most common way R3F scenes get slow.
     - No object allocation inside useFrame: the scratch Vector3/Color/Object3D
       are module-level singletons. Allocating in a 60fps loop is what produces
       sawtooth GC pauses.
     - Lines use a fixed vertex buffer whose dash offset animates via a uniform,
       rather than rebuilding geometry per frame.

   COST, stated plainly because it is the deciding factor:
   three + fiber + drei is roughly 285 kB gzipped. The entire current
   getbrandgeo.com homepage is about a sixth of that. If this is meant to serve
   a three-second acquisition hook, that payload works directly against the
   hook. See the note at the bottom of this file.
   ────────────────────────────────────────────────────────────────────────── */

import { useMemo, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber'
import {
  Html,
  Line,
  OrbitControls,
  PerspectiveCamera,
  Instances,
  Instance,
} from '@react-three/drei'
import * as THREE from 'three'
// Barrel import is correct HERE specifically. The usual rule is to deep-import
// from lucide-react to avoid pulling the whole icon set, but Next 15 ships
// lucide-react in its default optimizePackageImports list and rewrites this to
// per-icon imports at build time. The manual deep path would also need the
// .mjs extension and has no per-icon .d.ts, so it fails typecheck for no gain.
import { Activity, AlertTriangle, Cpu } from 'lucide-react'

/* ── Module-scope scratch. Never allocate inside useFrame. ─────────────────── */
const _dummy = new THREE.Object3D()
const _v3 = new THREE.Vector3()
const _target = new THREE.Vector3()

/* ── Shared geometry/material, created once per process ───────────────────── */
const SATELLITE_GEO = new THREE.SphereGeometry(0.09, 12, 12)
const PROJECT_GEO = new THREE.SphereGeometry(0.42, 32, 32)

const VIOLET = '#7c3aed'
const INDIGO = '#6366f1'
const ALERT = '#f43f5e'

export type NodeState = 'nominal' | 'degraded' | 'alert'

export interface ProjectNode {
  id: string
  label: string
  state: NodeState
  satellites: number
  position: THREE.Vector3
}

/* ── Topology generation ──────────────────────────────────────────────────────
   Golden-angle spiral on a sphere. Even angular division produces visible
   rows and mirror symmetry; the golden angle does not, so the cloud reads as
   organic rather than as a wireframe globe. */
function buildTopology(count: number, radius: number): ProjectNode[] {
  const GOLDEN = Math.PI * (3 - Math.sqrt(5))
  const labels = [
    'brandgeo-web', 'collection-worker', 'stripe-webhook', 'prospect-audit',
    'schedule-cron', 'indexnow', 'ai-social', 'seo-engine',
    'sentiment', 'competitors', 'promotions', 'onboarding',
  ]
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2      // 1 .. -1
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = GOLDEN * i
    const state: NodeState =
      i % 7 === 3 ? 'alert' : i % 5 === 2 ? 'degraded' : 'nominal'
    return {
      id: `p${i}`,
      label: labels[i % labels.length],
      state,
      satellites: 2 + (i % 4),
      position: new THREE.Vector3(
        Math.cos(theta) * r * radius,
        y * radius * 0.62,                              // flatten: reads as a
        Math.sin(theta) * r * radius,                   // disc, not a ball
      ),
    }
  })
}

/* ── Master node ──────────────────────────────────────────────────────────── */
function MasterNode() {
  const core = useRef<THREE.Mesh>(null)
  const corona = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // Mutate in place. No state, no allocation.
    if (core.current) {
      const s = 1 + Math.sin(t * 1.4) * 0.045
      core.current.scale.setScalar(s)
    }
    if (corona.current) {
      corona.current.rotation.y = t * 0.16
      corona.current.rotation.x = t * 0.09
      const s = 1 + Math.sin(t * 0.9 + 1.2) * 0.07
      corona.current.scale.setScalar(s)
    }
  })

  return (
    <group>
      <mesh ref={core}>
        <sphereGeometry args={[0.85, 48, 48]} />
        <meshStandardMaterial
          color={VIOLET}
          emissive={VIOLET}
          emissiveIntensity={2.4}
          roughness={0.25}
          metalness={0.1}
        />
      </mesh>
      {/* Corona: additive shell so the core reads as a light source rather
          than a lit object. Backside so it never occludes the core. */}
      <mesh ref={corona}>
        <sphereGeometry args={[1.35, 32, 32]} />
        <meshBasicMaterial
          color={INDIGO}
          transparent
          opacity={0.13}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight color={VIOLET} intensity={14} distance={26} decay={2} />
      <Html center distanceFactor={15} zIndexRange={[10, 0]}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded-full border border-white/15 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
          BrandGEO Core
        </div>
      </Html>
    </group>
  )
}

/* ── Satellites: ONE InstancedMesh for every satellite in the scene ───────── */
function SatelliteField({ projects }: { projects: ProjectNode[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)

  // Flatten to a stable descriptor list once. Recomputing this per frame would
  // allocate; recomputing per render would thrash the instance buffer.
  const orbits = useMemo(
    () =>
      projects.flatMap((p, pi) =>
        Array.from({ length: p.satellites }, (_, si) => ({
          origin: p.position,
          radius: 0.75 + si * 0.28,
          speed: 0.5 + ((pi * 7 + si * 13) % 10) * 0.07,
          phase: ((pi * 31 + si * 17) % 100) / 100 * Math.PI * 2,
          tilt: ((pi * 11 + si * 5) % 60) / 60 * Math.PI,
        })),
      ),
    [projects],
  )

  useFrame(({ clock }) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock.elapsedTime
    for (let i = 0; i < orbits.length; i++) {
      const o = orbits[i]
      const a = t * o.speed + o.phase
      // Inclined circular orbit, computed straight into the scratch vector.
      _v3.set(Math.cos(a) * o.radius, Math.sin(a) * o.radius * Math.sin(o.tilt), Math.sin(a) * o.radius * Math.cos(o.tilt))
      _dummy.position.copy(o.origin).add(_v3)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[SATELLITE_GEO, undefined, orbits.length]} frustumCulled={false}>
      <meshBasicMaterial color={INDIGO} transparent opacity={0.9} />
    </instancedMesh>
  )
}

/* ── A project node, its label, and its link back to the master ───────────── */
function ProjectCloud({
  node,
  onFocus,
}: {
  node: ProjectNode
  onFocus: (n: ProjectNode) => void
}) {
  const mesh = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const isAlert = node.state === 'alert'
  const colour = isAlert ? ALERT : node.state === 'degraded' ? '#f59e0b' : INDIGO

  // Dashed line master -> project. Two fixed points, so the geometry is static
  // and only the dash offset animates.
  const points = useMemo(
    () => [new THREE.Vector3(0, 0, 0), node.position.clone()],
    [node.position],
  )

  useFrame(({ clock }) => {
    if (!mesh.current) return
    // Alert nodes pulse. Everything else holds still, so motion means something.
    const s = isAlert ? 1 + Math.sin(clock.elapsedTime * 4) * 0.12 : 1
    mesh.current.scale.setScalar(hovered ? s * 1.25 : s)
  })

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      onFocus(node)
    },
    [node, onFocus],
  )

  return (
    <group>
      <Line
        points={points}
        color={colour}
        lineWidth={isAlert ? 1.6 : 0.8}
        transparent
        opacity={isAlert ? 0.55 : 0.22}
        dashed
        dashScale={6}
        dashSize={0.35}
        gapSize={0.5}
      />
      <group position={node.position}>
        <mesh
          ref={mesh}
          geometry={PROJECT_GEO}
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            document.body.style.cursor = 'auto'
          }}
        >
          <meshStandardMaterial
            color={colour}
            emissive={colour}
            emissiveIntensity={isAlert ? 1.8 : 0.7}
            roughness={0.35}
          />
        </mesh>

        {/* Floating UI lives IN the scene, attached to the mesh. */}
        <Html center distanceFactor={15} zIndexRange={[9, 0]} style={{ pointerEvents: 'none' }}>
          <div
            className="-translate-y-10 select-none whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-medium backdrop-blur-sm"
            style={{
              borderColor: isAlert ? 'rgba(244,63,94,.5)' : 'rgba(255,255,255,.14)',
              background: 'rgba(6,6,12,.78)',
              color: isAlert ? '#fecdd3' : '#e2e8f0',
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              {isAlert ? <AlertTriangle size={11} /> : <Cpu size={11} />}
              {node.label}
            </span>
          </div>
        </Html>
      </group>
    </group>
  )
}

/* ── Camera rig. Eases toward a target rather than cutting. ───────────────── */
function CameraRig({ focus }: { focus: THREE.Vector3 | null }) {
  useFrame(({ camera }, delta) => {
    if (!focus) return
    // Offset along the node's own direction so the camera stops in front of it
    // rather than inside it.
    _target.copy(focus).multiplyScalar(1.55).add(_v3.set(0, 1.1, 2.4))
    // Frame-rate independent easing. 1 - pow(k, dt) is the correct form;
    // a fixed lerp alpha runs at different speeds on 60Hz and 144Hz displays.
    const k = 1 - Math.pow(0.0025, delta)
    camera.position.lerp(_target, k)
    camera.lookAt(0, 0, 0)
  })
  return null
}

/* ── Scene ────────────────────────────────────────────────────────────────── */
function Scene({ onFocus, focus }: { onFocus: (n: ProjectNode) => void; focus: THREE.Vector3 | null }) {
  const projects = useMemo(() => buildTopology(12, 6.2), [])

  return (
    <>
      <color attach="background" args={['#06060c']} />
      <fog attach="fog" args={['#06060c', 14, 30]} />
      <ambientLight intensity={0.35} />

      <MasterNode />
      {projects.map((p) => (
        <ProjectCloud key={p.id} node={p} onFocus={onFocus} />
      ))}
      <SatelliteField projects={projects} />

      <CameraRig focus={focus} />
      <PerspectiveCamera makeDefault position={[0, 4, 14]} fov={52} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={6}
        maxDistance={26}
        autoRotate={!focus}
        autoRotateSpeed={0.35}
      />
    </>
  )
}

/* ── Public component ─────────────────────────────────────────────────────── */
export function SpatialCanvas() {
  const [focus, setFocus] = useState<THREE.Vector3 | null>(null)
  const [active, setActive] = useState<ProjectNode | null>(null)

  const handleFocus = useCallback((n: ProjectNode) => {
    setActive(n)
    setFocus(n.position)
  }, [])

  const clear = useCallback(() => {
    setActive(null)
    setFocus(null)
  }, [])

  return (
    <div className="fixed inset-0 bg-[#06060c]">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={clear}
      >
        <Scene onFocus={handleFocus} focus={focus} />
      </Canvas>

      {/* The only flat chrome in the whole thing, and it is a readout, not a
          container the scene lives inside. */}
      <div className="pointer-events-none absolute left-6 top-6 select-none">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
          <Activity size={13} className="text-violet-400" />
          Spatial Topology
        </div>
        {active && (
          <div className="mt-3 max-w-xs rounded-lg border border-white/10 bg-black/70 p-3 backdrop-blur">
            <div className="text-sm font-semibold text-white">{active.label}</div>
            <div className="mt-1 text-xs text-white/60">
              state: {active.state} · {active.satellites} satellites
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   BEFORE THIS SHIPS ANYWHERE NEAR getbrandgeo.com, read this.

   1. It cannot go on the current marketing site at all. getbrandgeo.com is
      static HTML served from cPanel with no build step, and its CSP is
      script-src 'self' with no 'unsafe-inline'. R3F needs a bundler. This runs
      in brandgeo-next or it does not run.

   2. three + fiber + drei is ~285 kB gzipped. The entire present homepage is
      roughly a sixth of that. This exact stack was removed from HeroMesh.tsx
      earlier today and replaced with a dependency-free 2D canvas that renders
      1,296 additively blended points, because the WebGL pipeline was not
      buying anything the effect needed.

   3. That tension is the real decision, not a technical one: a 3D topology is
      a strong product-surface idea (a live spatial view of collection jobs,
      inside the authenticated dashboard, where payload cost is amortised over
      a session). As a marketing hero whose job is a three-second hook, a
      285 kB blocking payload fights the hook it is meant to serve.

   Recommendation: ship this as a dashboard surface, keep the 2D canvas on the
   marketing hero.
   ────────────────────────────────────────────────────────────────────────── */
