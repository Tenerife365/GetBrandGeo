/**
 * SupportWidget.tsx — bottom-right floating "Need a hand?" button on every
 * dashboard page. Opens a small panel; the message is POSTed to the
 * support-request Netlify function, which emails support@getbrandgeo.com.
 * Built so an AI assistant can slot in behind the same launcher later.
 * Degrades gracefully: on any send failure it offers a mailto: fallback.
 */
import { useEffect, useState } from 'react'
import { MessageCircle, X, Send, Loader2, Check } from 'lucide-react'
import { supabase, isDemoMode } from '../lib/supabase'
import { useClient } from '../lib/clientContext'

export default function SupportWidget() {
  const { activeClient } = useClient()
  const [open, setOpen]       = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [email, setEmail]     = useState('')
  const [state, setState]     = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (isDemoMode) { setEmail('demo@getbrandgeo.com'); return }
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [])

  const send = async () => {
    if (!message.trim() || state === 'sending') return
    setState('sending')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? ''
      const res = await fetch('/.netlify/functions/support-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          subject: subject.trim() || 'Support request',
          message: message.trim(),
          email,
          brand: activeClient?.name ?? '',
          page: window.location.pathname,
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setState('sent')
      setMessage(''); setSubject('')
    } catch {
      setState('error')
    }
  }

  const mailtoFallback =
    `mailto:support@getbrandgeo.com?subject=${encodeURIComponent(subject || 'Support request')}` +
    `&body=${encodeURIComponent(message)}`

  return (
    <>
      {/* Launcher — clears the mobile bottom nav on small screens */}
      <button
        onClick={() => { setOpen(v => !v); if (state === 'sent') setState('idle') }}
        aria-label={open ? 'Close support' : 'Get help'}
        className="fixed z-50 bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/25 flex items-center justify-center hover:bg-brand-400 transition-colors"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open && (
        <div className="fixed z-50 bottom-36 right-4 md:bottom-24 md:right-6 w-[calc(100vw-2rem)] max-w-sm bg-dark-800 rounded-2xl shadow-2xl border border-dark-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-dark-700/60 bg-brand-500/5">
            <div className="text-sm font-semibold text-white">Need a hand?</div>
            <div className="text-xs text-slate-400 mt-0.5">Ask about a feature, report a problem, or make a request — we&apos;ll reply to your email.</div>
          </div>

          {state === 'sent' ? (
            <div className="px-5 py-8 text-center">
              <div className="w-11 h-11 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto mb-3"><Check size={20} /></div>
              <div className="text-sm font-medium text-slate-200 mb-1">Message sent</div>
              <p className="text-xs text-slate-500">Thanks — we&apos;ll get back to you at {email || 'your email'}.</p>
              <button onClick={() => setState('idle')} className="mt-4 text-xs text-brand-400 hover:text-brand-300 font-medium">Send another</button>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-3">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)"
                aria-label="Subject"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500" />
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                placeholder="How can we help?"
                aria-label="Message"
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500 resize-none" />
              {state === 'error' && (
                <p className="text-xs text-red-400">
                  Could not send right now.{' '}
                  <a href={mailtoFallback} className="underline hover:text-red-300">Email us directly</a>.
                </p>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-600 truncate">To support@getbrandgeo.com</span>
                <button onClick={send} disabled={!message.trim() || state === 'sending'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors disabled:opacity-50 shrink-0">
                  {state === 'sending' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
