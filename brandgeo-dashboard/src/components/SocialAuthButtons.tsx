import { useState } from 'react'
import { Linkedin, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * SocialAuthButtons — "Continue with Google / LinkedIn" for both Signup and Login.
 *
 * Both are the SAME flow (OAuth is signup-or-login): on success Supabase creates
 * the auth.users row (first time) or signs the user in, then redirects back to the
 * app. A brand-new user arrives with no profile and the onboarding gate routes them
 * to /welcome (see App.tsx + clientContext.tsx needsOnboarding); a returning user
 * lands on their dashboard.
 *
 * LinkedIn is a Phase-2 fast-follow: the provider needs a LinkedIn developer app
 * approved and enabled in Supabase first. Flip LINKEDIN_ENABLED to true once that
 * is live (SIGNUP-RESEARCH.md §2.3 / §6). Google works as soon as the Google
 * provider is enabled in Supabase.
 */
const LINKEDIN_ENABLED = false

// Google's multicolour "G" (lucide has no brand marks).
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C39.9 36.5 44 31 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}

const btn =
  'w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-medium ' +
  'bg-dark-700 border border-dark-600 text-slate-200 hover:bg-dark-600 hover:border-dark-500 ' +
  'transition-colors disabled:opacity-60 disabled:cursor-not-allowed'

export default function SocialAuthButtons({ onError }: { onError?: (msg: string) => void }) {
  const [busy, setBusy] = useState<'google' | 'linkedin_oidc' | null>(null)

  async function signInWith(provider: 'google' | 'linkedin_oidc') {
    if (busy) return
    setBusy(provider)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      })
      // On success the browser is redirecting, so we normally never get here.
      if (error) {
        setBusy(null)
        onError?.(error.message || 'Could not start sign-in. Please try again.')
      }
    } catch (e: any) {
      setBusy(null)
      onError?.(e?.message || 'Could not start sign-in. Please try again.')
    }
  }

  return (
    <div className="space-y-2.5">
      <button type="button" className={btn} disabled={busy !== null} onClick={() => signInWith('google')}>
        {busy === 'google' ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      {LINKEDIN_ENABLED ? (
        <button type="button" className={btn} disabled={busy !== null} onClick={() => signInWith('linkedin_oidc')}>
          {busy === 'linkedin_oidc'
            ? <Loader2 size={16} className="animate-spin" />
            : <Linkedin size={16} className="text-[#0a66c2]" />}
          Continue with LinkedIn
        </button>
      ) : (
        <button type="button" className={btn} disabled title="LinkedIn sign-in is coming soon">
          <Linkedin size={16} className="text-slate-500" />
          Continue with LinkedIn <span className="text-[10px] text-slate-500">soon</span>
        </button>
      )}
    </div>
  )
}
