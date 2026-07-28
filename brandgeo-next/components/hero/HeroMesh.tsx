'use client'

import { useEffect, useRef } from 'react'

import { useIsSmallViewport, useReducedMotion } from '@/hooks/useReducedMotion'

/* ─────────────────────────────────────────────────────────────────────────────
   Interactive hero mesh — 2D canvas, zero dependencies.

   This replaces an earlier React Three Fiber implementation. Same visual: a
   perspective grid of glowing points, two crossing waves, cursor lift, radial
   edge fade. The three.js version cost 285 kB gzipped, roughly six times the
   entire current getbrandgeo.com homepage, for an effect that does not need a
   GPU pipeline. Measured, then cut.

   What makes 1,296 additively-blended points affordable in 2D:
     - The glow is a PRE-RENDERED sprite, drawn once into an offscreen canvas at
       startup and then blitted with drawImage. Per-point createRadialGradient
       would be the slow path and is the usual reason people reach for WebGL here.
     - Eight pre-tinted copies of that sprite cover the violet->indigo ramp, so
       colour varies per point without any per-frame tinting.
     - globalCompositeOperation 'lighter' gives the additive blend three.js was
       doing with AdditiveBlending.
     - Points are sorted implicitly by grid order; no depth buffer needed because
       additive blending is order-independent.

   Guardrails kept from the previous version, all deliberate:
     - Phones never run the loop. They get a CSS radial gradient instead.
     - prefers-reduced-motion stops the loop rather than just slowing it.
     - Off-screen or hidden tab stops the loop.
   ────────────────────────────────────────────────────────────────────────── */

const COLS = 48
const ROWS = 27
const SPACING = 0.56
const FOV = 11 // camera distance in world units
const TINTS = 8

/** Pre-render the glow once per tint step. */
function buildSprites(dpr: number) {
  const size = Math.ceil(26 * dpr)
  const half = size / 2
  const from = [124, 58, 237] // #7c3aed deep purple
  const to = [99, 102, 241] // #6366f1 electric indigo

  return Array.from({ length: TINTS }, (_, i) => {
    const t = i / (TINTS - 1)
    const r = Math.round(from[0] + (to[0] - from[0]) * t)
    const g = Math.round(from[1] + (to[1] - from[1]) * t)
    const b = Math.round(from[2] + (to[2] - from[2]) * t)

    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')!
    const grad = ctx.createRadialGradient(half, half, 0, half, half, half)
    // Matches the old fragment shader's pow(core, 2.4) falloff closely enough
    // that the two are hard to tell apart side by side.
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
    grad.addColorStop(0.28, `rgba(${r},${g},${b},0.42)`)
    grad.addColorStop(0.6, `rgba(${r},${g},${b},0.08)`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    return c
  })
}

function AmbientFallback() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(60% 50% at 50% 34%, rgba(124,58,237,0.20) 0%, rgba(99,102,241,0.10) 42%, rgba(9,10,15,0) 78%)',
      }}
    />
  )
}

export function HeroMesh() {
  const reduced = useReducedMotion()
  const small = useIsSmallViewport()
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const active = !small && !reduced

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const sprites = buildSprites(dpr)

    let width = 0
    let height = 0

    // Measure synchronously first. Relying on ResizeObserver's initial callback
    // alone leaves the canvas at the 300x150 HTML default until the next frame,
    // which shows as a blank hero on the first paint.
    const measure = () => {
      const r = host.getBoundingClientRect()
      width = r.width
      height = r.height
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(host)

    // Cursor: raw target, then an eased value, so the lift trails the pointer.
    const target = { x: 0, y: 0 }
    const eased = { x: 0, y: 0 }
    let held = 0

    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      // Convert to the same world units the grid lives in.
      const ndcX = ((e.clientX - r.left) / r.width) * 2 - 1
      const ndcY = -(((e.clientY - r.top) / r.height) * 2 - 1)
      const visH = 2 * FOV * Math.tan((52 * Math.PI) / 180 / 2)
      const visW = visH * (r.width / r.height || 1)
      target.x = (ndcX * visW) / 2
      target.y = (ndcY * visH) / 2
      held = 1
    }
    const onLeave = () => {
      held = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)

    // Pause when off-screen or the tab is hidden.
    let onScreen = true
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting
    })
    io.observe(host)
    let tabVisible = !document.hidden
    const onVis = () => {
      tabVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', onVis)

    const halfCols = (COLS - 1) / 2
    const halfRows = (ROWS - 1) / 2
    const extentX = COLS * SPACING * 0.5
    const extentY = ROWS * SPACING * 0.5

    let raf = 0
    let time = 0
    let last = performance.now()
    let heldEased = 0

    const draw = (dt: number) => {
      if (width === 0 || height === 0) return

      time += dt

      // Ease cursor influence.
      const k = 1 - Math.pow(0.0015, dt)
      eased.x += (target.x - eased.x) * k
      eased.y += (target.y - eased.y) * k
      const kh = 1 - Math.pow(0.02, dt)
      heldEased += (held - heldEased) * kh
      const h = heldEased

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      const visH = 2 * FOV * Math.tan((52 * Math.PI) / 180 / 2)
      const scale = height / visH

      for (let gy = 0; gy < ROWS; gy++) {
        const wy = (gy - halfRows) * SPACING
        for (let gx = 0; gx < COLS; gx++) {
          const wx = (gx - halfCols) * SPACING

          // Two crossing waves — same frequencies as the old vertex shader.
          let lift = Math.sin(wx * 0.55 + time * 0.42) * 0.3 + Math.cos(wy * 0.7 - time * 0.31) * 0.22

          // Cursor pushes the surface up locally.
          const dx = wx - eased.x
          const dy = wy - eased.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const pull = dist < 3.4 ? Math.pow(1 - dist / 3.4, 2) * h : 0
          lift += pull * 1.15

          // Radial edge fade so the grid dissolves into the canvas colour
          // rather than ending on a visible rectangle.
          const rr = Math.sqrt((wx / extentX) ** 2 + (wy / extentY) ** 2)
          if (rr >= 1) continue
          const edge = 1 - smoothstep(0.35, 1, rr)
          if (edge <= 0.004) continue

          // Perspective divide. z of 0 sits at the grid plane; lift moves toward
          // the camera, which also grows the point.
          const z = FOV - lift
          const persp = FOV / z
          const sxp = width / 2 + wx * scale * persp
          const syp = height / 2 - wy * scale * persp

          const alpha = edge * (0.34 + Math.min(Math.max(lift, 0), 1.4) * 0.42)
          if (alpha <= 0.004) continue

          const tint = sprites[Math.min(TINTS - 1, Math.max(0, Math.round((lift * 0.55 + 0.5) * (TINTS - 1))))]
          const s = (7 + pull * 9) * persp * 1.5

          ctx.globalAlpha = Math.min(alpha, 1)
          ctx.drawImage(tint, sxp - s / 2, syp - s / 2, s, s)
        }
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      // Skip the work, keep the loop alive, so resuming is instant.
      if (!onScreen || !tabVisible) return
      draw(dt)
    }

    // Paint one frame immediately so the hero is never blank before the first
    // animation frame arrives — and so it still renders at all in contexts
    // where rAF is suspended (a hidden tab, a prerender).
    draw(0)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [active])

  return (
    <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-0">
      {active ? (
        <canvas ref={canvasRef} className="absolute inset-0 block size-full" />
      ) : (
        <AmbientFallback />
      )}
    </div>
  )
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}
