/**
 * BrandLogo — a client's brand logo tile, reused across the app (sidebar +
 * My Profile) so brand identity is consistent everywhere, not just on one page.
 *
 * Source ladder (same as the original Account.tsx logic, now shared):
 *   1. Clearbit crisp brand logo for the site's domain
 *   2. Google favicon fallback if Clearbit has none
 *   3. Initials avatar if there's no usable domain / both image sources fail
 */
import { useEffect, useState } from 'react'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function domainOf(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = url.includes('://') ? url : `https://${url}`
    return new URL(u).hostname.replace(/^www\./, '')
  } catch { return null }
}

export default function BrandLogo({
  name,
  website,
  sizeClass = 'w-9 h-9',
  roundedClass = 'rounded-lg',
  textClass = 'text-xs',
}: {
  name: string
  website?: string | null
  sizeClass?: string
  roundedClass?: string
  textClass?: string
}) {
  const domain = domainOf(website)
  const [src, setSrc] = useState<string | null>(domain ? `https://logo.clearbit.com/${domain}` : null)

  useEffect(() => {
    setSrc(domain ? `https://logo.clearbit.com/${domain}` : null)
  }, [domain])

  const onError = () => {
    if (domain && src && src.includes('clearbit')) {
      setSrc(`https://www.google.com/s2/favicons?sz=128&domain_url=https://${domain}`)
    } else {
      setSrc(null)
    }
  }

  return (
    <span className={`${sizeClass} ${roundedClass} bg-brand-500/15 text-brand-300 ring-1 ring-brand-500/25 flex items-center justify-center ${textClass} font-bold shrink-0 overflow-hidden`}>
      {src
        ? <img src={src} alt={name} onError={onError} className="w-full h-full object-contain bg-white" />
        : initials(name)}
    </span>
  )
}
