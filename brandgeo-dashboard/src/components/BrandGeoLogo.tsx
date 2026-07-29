import { useId } from 'react'
import { NavLink } from 'react-router-dom'
import { useTheme } from '../lib/themeContext'

/*
 * BrandGEO's OWN lockup: the approved v3 tile plus the wordmark.
 *
 * This replaces seven verbatim copies of the same inline markup that had drifted
 * apart (Layout, AuditReport, AuditRequest, Login, ResetPassword, Signup,
 * Welcome). Two of the seven had lost theme awareness and hardcoded a white
 * "Brand", two had lost the negative tracking entirely, and all seven opened the
 * GEO gradient on the pre-rebuild Gemini blue that
 * docs/design/colour-unification-2026-07-29.md section 6.2 lists as RETIRED (the
 * hex is named there; it is deliberately not repeated here so a repo-wide scan
 * for it stays clean). That single stop was the main reason the app read as a
 * different brand from getbrandgeo.com.
 *
 * Not to be confused with components/BrandLogo.tsx, which renders a CLIENT's logo
 * via Clearbit. This file is BrandGEO itself.
 *
 * Source of truth for the artwork:
 *   docs/growth/brand-identity-2026-07-29/v3/icon-tile.svg   (the mark, shipped inline below)
 *   docs/growth/brand-identity-2026-07-29/v3/logo-full.svg   (the type spec: weight 700,
 *     letter-spacing -3 at font-size 94, i.e. -0.032em)
 * Matching implementation on the marketing site: brandgeo/web/index.html .logo / .logo-text.
 *
 * Why the mark is INLINE rather than a file in public/:
 *   1. It appears on /login, the first paint an unauthenticated visitor gets. An
 *      <img> there is a second round trip that renders as an empty box on a cold
 *      cache. Inline, it is about 600 bytes inside an already loaded chunk.
 *   2. It retires the dependency on /logo.png, a 77 KB 799x1024 raster of the
 *      SUPERSEDED heavy-stroke glyph, which every one of the seven copies loaded
 *      and scaled down. The v3 mark is a different, lighter drawing on a tile.
 *   3. Geometry and type spec stay in one file, so a future edit cannot drift them
 *      apart again, which is exactly how the seven copies diverged.
 *   The one real cost of inlining, a duplicate gradient id when the component
 *   renders more than once per page (Layout renders it twice, sidebar plus mobile
 *   header), is handled by useId below.
 */

export type BrandGeoLogoSize = 'sm' | 'md' | 'lg' | 'xl'

/*
 * Every size the seven call sites used, preserved exactly so nothing reflows.
 * gap is always tile/4, which reproduces the marketing site's 32px tile with an
 * 8px gap at 'md' and the dashboard's existing 40px/10px pairing at 'xl'.
 * font is the px value of the Tailwind step each call site already had
 * (text-base 16, text-xl 20, text-2xl 24).
 */
const SIZES: Record<BrandGeoLogoSize, { tile: number; gap: number; font: number }> = {
  sm: { tile: 28, gap: 7,  font: 16 },  // AuditReport header
  md: { tile: 32, gap: 8,  font: 16 },  // Layout rail + mobile header. Website parity.
  lg: { tile: 36, gap: 9,  font: 20 },  // AuditRequest header
  xl: { tile: 40, gap: 10, font: 24 },  // Login, ResetPassword, Signup, Welcome
}

/*
 * Wordmark colours, forked by theme.
 *
 * TOKEN GAP, deliberate and flagged: src/index.css declares no accent tokens.
 * It has --dark-900/800/700/600 and the shell tokens, but nothing equivalent to
 * the marketing site's --ac / --ac-text / --t, which is why these are literal
 * hexes here. They SHOULD become named tokens in :root and html.light. Note the
 * dark ramp is no longer the site's verbatim pair, so whoever declares those
 * tokens must carry the measured values below, not copy index.html again.
 *
 * DARK RAMP, measured and lifted 2026-07-29. It shipped as the marketing site's
 * pair verbatim, #8B5CF6 -> #A78BFA. The dashboard's surfaces are darker than the
 * site's #0a0b0e, and on them the opening stop fell under the 4.5:1 text floor:
 * #8B5CF6 measures 4.24 on the nav rail #13152b, 4.22 on a card #0F172A and 4.51
 * on the page #0A0F1E. The whole ramp therefore moves one step lighter, to
 * #A78BFA -> #C4B5FD (violet-400 to violet-300), which puts the worst stop at
 * 6.56 and every stop over 6.5 on all three surfaces.
 *   Why shift the ramp rather than raise geoFrom to #A78BFA: that would collapse
 *   both stops onto one colour and kill the gradient the mark is built on. The
 *   shift keeps the ramp's perceptual span intact, 12.6 points of L* against the
 *   old pair's 13.0, so the gradient reads the same, only lighter.
 *   Why not a mid value like #9F7AEA for a wider ramp: it is off the Tailwind
 *   violet scale, and an unnamed fifth violet is exactly the drift this file was
 *   created to end. Both stops stay on-scale.
 *   The wordmark renders at 16px in the rail, so it is body text under SC 1.4.3,
 *   not large text, and 3:1 does not apply. A brand name is arguably exempt from
 *   1.4.3 altogether, but this is live HTML text in Inter, not an image, and
 *   4.22:1 is a legibility problem whether or not a standard excuses it.
 *   The marketing site keeps #8B5CF6, which measures 4.65 on its own darker
 *   #0a0b0e and passes there. The two properties now render the wordmark in
 *   different violets. Raising the site to this same pair is recommended and is
 *   tracked outside this file, which does not own it.
 *
 * LIGHT RAMP, unchanged and already correct: #7C3AED -> #6D28D9, measuring 4.79
 * and 5.98 at worst (the light nav #ECEAF6), 5.70 and 7.10 on a white card.
 * It is darker rather than a mirror of dark on purpose: #A78BFA measures 2.72:1
 * on a white card and #C4B5FD 1.85:1, so neither is usable there. Do not
 * symmetrise the two themes.
 *
 * "Brand" uses the dashboard's own ink (#0F172A, the value html.light maps
 * .text-white to) rather than the site's --t #09090F, so it sits identical to
 * every heading beside it. The two differ by under 2 points of contrast.
 */
const INK = {
  dark:  { brand: '#E8E9ED', geoFrom: '#A78BFA', geoTo: '#C4B5FD' },
  light: { brand: '#0F172A', geoFrom: '#7C3AED', geoTo: '#6D28D9' },
}

interface BrandGeoLogoProps {
  size?: BrandGeoLogoSize
  /** Internal route. Renders a NavLink. */
  to?: string
  /** External URL. Renders an anchor. Ignored when `to` is set. */
  href?: string
  onClick?: () => void
  /** Only used when the logo is a link. */
  ariaLabel?: string
  /** Extra classes for the caller's own spacing. */
  className?: string
}

export default function BrandGeoLogo({
  size = 'md',
  to,
  href,
  onClick,
  ariaLabel = 'BrandGEO',
  className = '',
}: BrandGeoLogoProps) {
  const { theme } = useTheme()
  const ink = theme === 'light' ? INK.light : INK.dark
  const { tile, gap, font } = SIZES[size]
  // Unique per instance: Layout mounts this twice on one page, and two <defs>
  // sharing a gradient id would make the second tile pick up the first's ramp.
  const gradId = `bg-tile-${useId().replace(/:/g, '')}`

  const content = (
    <>
      {/*
        v3 tile, transcribed from icon-tile.svg. Identical in both themes: it is a
        filled ground, so it carries itself on light and dark alike, which is the
        whole reason the tile variant was chosen as the favicon over the bare glyph.
        aria-hidden because the wordmark text right beside it already names the brand.
      */}
      <svg
        width={tile}
        height={tile}
        viewBox="0 0 512 512"
        aria-hidden="true"
        focusable="false"
        style={{ display: 'block', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="512" y2="512">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="0.55" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="120" fill={`url(#${gradId})`} />
        {/* Lowercase b. The bowl's counter holds the centred location dot. Stroke,
            dot diameter and the gap around it are all on one 56/56/28 modular grid,
            so the glyph must not be redrawn piecemeal. */}
        <g transform="translate(43.5 43.5) scale(0.83)">
          <g fill="none" stroke="#F5F3FF" strokeWidth="56" strokeLinecap="round">
            <path d="M156 116V388" />
            <circle cx="272" cy="304" r="84" />
          </g>
          <circle cx="272" cy="304" r="28" fill="#F5F3FF" />
        </g>
      </svg>

      {/* Weight 700 and -0.032em are the signed-off numerics from logo-full.svg.
          Tracking is in em, not px, so 'sm' through 'xl' stay optically identical
          instead of drifting apart the way the seven copies did. Family is not
          declared: it inherits Inter from body, same as the marketing site. */}
      <span
        style={{
          fontSize: font,
          fontWeight: 700,
          letterSpacing: '-0.032em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: ink.brand }}>Brand</span>
        <span
          style={{
            // color is the fallback any engine without background-clip:text falls back to.
            color: ink.geoTo,
            background: `linear-gradient(135deg, ${ink.geoFrom} 0%, ${ink.geoTo} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          GEO
        </span>
      </span>
    </>
  )

  const layout = `inline-flex items-center ${className}`.trim()
  const focus = 'rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500'

  if (to) {
    return (
      <NavLink to={to} onClick={onClick} aria-label={ariaLabel} className={`${layout} ${focus}`} style={{ gap }}>
        {content}
      </NavLink>
    )
  }

  if (href) {
    return (
      <a href={href} onClick={onClick} aria-label={ariaLabel} className={`${layout} ${focus}`} style={{ gap }}>
        {content}
      </a>
    )
  }

  return (
    <span className={layout} style={{ gap }}>
      {content}
    </span>
  )
}
