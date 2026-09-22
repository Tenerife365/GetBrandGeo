/**
 * src/components/TruncatedText.tsx
 *
 * A single-line, ellipsis-truncated text that shows its full content in a
 * popup while the pointer rests on it (or while it holds keyboard focus).
 *
 * Why a portal: the prompt table on AI Visibility sits inside
 * `overflow-hidden` and `overflow-x-auto` wrappers, so an absolutely
 * positioned child would be clipped at the table edge. The popup is
 * rendered on `document.body` with fixed coordinates read from the text
 * element instead.
 *
 * The popup only appears when the text is actually cut off
 * (`scrollWidth > clientWidth`), so short prompts never get a redundant
 * bubble. It is `pointer-events-none`, so the row underneath keeps its
 * click and hover behaviour.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface TruncatedTextProps {
  text: string
  className?: string
}

interface PopupPosition {
  left: number
  width: number
  top?: number
  bottom?: number
}

const MIN_WIDTH = 280
const MAX_WIDTH = 520
const GAP = 6
const EDGE = 12

export default function TruncatedText({ text, className }: TruncatedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [pos, setPos] = useState<PopupPosition | null>(null)

  const show = () => {
    const el = ref.current
    if (!el) return
    // Not truncated: nothing to reveal.
    if (el.scrollWidth <= el.clientWidth + 1) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, r.width), vw - 2 * EDGE)
    const left = Math.min(Math.max(EDGE, r.left), vw - width - EDGE)
    // Open upward when the row sits in the lower part of the viewport so a
    // long prompt does not run off the bottom of the screen.
    if (r.bottom > vh * 0.7) {
      setPos({ left, width, bottom: vh - r.top + GAP })
    } else {
      setPos({ left, width, top: r.bottom + GAP })
    }
  }

  const hide = () => setPos(null)

  // Any scroll or resize while open invalidates the measured position.
  useEffect(() => {
    if (!pos) return
    const close = () => setPos(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [pos])

  return (
    <>
      <p
        ref={ref}
        className={className}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {text}
      </p>
      {pos && createPortal(
        <div
          role="tooltip"
          className="fixed z-50 pointer-events-none bg-dark-800 border border-dark-600 rounded-lg shadow-2xl px-3 py-2 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap break-words"
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
        >
          {text}
        </div>,
        document.body,
      )}
    </>
  )
}
