'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Clock, Lock, Zap } from 'lucide-react'

import { PaymentTeaser } from './PaymentTeaser'

const TRUST = [
  { icon: Zap, label: 'Free audit' },
  { icon: Clock, label: 'Results in 10s' },
  { icon: Lock, label: 'No credit card required' },
]

/**
 * Audit entry field.
 *
 * The honeypot mirrors the live static site: a field invisible to real visitors
 * that bots fill in, dropped client-side before the audit endpoint is called.
 * Real gating stays server-side — this is only a cheap first filter.
 *
 * NOTE: submission is not wired to the audit endpoint yet. The live site calls
 * it from site.js; porting that call belongs with the API/env work, not with
 * the hero's visual pass, so this currently only validates and reports state.
 */
export function AuditSearchBar() {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const hp = (e.currentTarget.elements.namedItem('company_website') as HTMLInputElement)?.value
    if (hp) return // bot

    const domain = value.trim()
    if (!domain) {
      setStatus('Enter a website URL to run the audit.')
      return
    }
    setStatus('Audit endpoint is not wired up in this build yet.')
  }

  return (
    <div className="space-y-4">
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="group relative"
      >
        {/* Focus glow. Sits behind the field and lights up with focus-within. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-2xl opacity-0 blur-xl transition-opacity duration-500 group-focus-within:opacity-100"
          style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.35), rgba(99,102,241,0.22))' }}
        />

        <div className="relative flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-xl transition-colors focus-within:border-brand/45 sm:flex-row sm:items-center">
          <label htmlFor="brandInput" className="sr-only">
            Enter your website URL
          </label>
          <input
            id="brandInput"
            name="brandInput"
            type="text"
            inputMode="url"
            autoComplete="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="enter your website URL..."
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
          />

          {/* Honeypot — invisible to real visitors, never focusable. */}
          <input
            type="text"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="pointer-events-none absolute left-[-9999px] size-0 opacity-0"
          />

          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-medium text-white transition-transform duration-200 hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
          >
            Check my visibility
            <ArrowRight aria-hidden className="size-4" />
          </button>
        </div>
      </motion.form>

      {status && (
        <p aria-live="polite" className="text-[13px] text-ink-3">
          {status}
        </p>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.52, duration: 0.5 }}
        className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-2"
      >
        {TRUST.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Icon aria-hidden className="size-3.5 text-brand" />
            {label}
          </span>
        ))}
      </motion.div>

      <PaymentTeaser />
    </div>
  )
}
