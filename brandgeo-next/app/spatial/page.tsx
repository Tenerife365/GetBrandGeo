'use client'

/* This page is a Client Component purely so `ssr: false` is legal below. Next 15
   forbids next/dynamic with ssr:false inside a Server Component, which is what
   this file was until it 500'd. The cost is small: this route renders nothing
   but the canvas, so there is no server-rendered content being given up. */

import dynamic from 'next/dynamic'

/* The whole R3F stack is client-only and ~285 kB gzipped, so it is dynamically
   imported with ssr disabled. Importing it statically would put three.js in the
   server bundle and in the initial payload of every route that shares a chunk
   with this one, which is exactly the cost this prototype is meant to let us
   measure rather than pay by accident. */
const SpatialCanvas = dynamic(
  () => import('@/components/spatial/SpatialCanvas').then((m) => m.SpatialCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 grid place-items-center bg-[#06060c] text-xs uppercase tracking-[0.3em] text-white/40">
        initialising topology
      </div>
    ),
  },
)

export default function SpatialPage() {
  return <SpatialCanvas />
}
