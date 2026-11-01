/**
 * observabilitySentry.ts  (docs/arch/observability.md section 3.5)
 *
 * The ONLY file that imports @sentry/browser, so the SDK lands in its own lazy
 * chunk and never in the main bundle. It is loaded by observability.ts with a
 * dynamic import, after window 'load', and only on app.getbrandgeo.com in a
 * production build with VITE_SENTRY_DSN set. Do not import it statically.
 *
 * Options are fixed by the spec: no default integrations, no breadcrumbs, no
 * tracing, no replay, no user, no PII. The scrub (section 7) is passed in by
 * the caller so this chunk does not import back into the main chunk.
 */

import {
  captureException,
  dedupeIntegration,
  eventFiltersIntegration,
  functionToStringIntegration,
  globalHandlersIntegration,
  httpClientIntegration,
  init,
  linkedErrorsIntegration,
} from '@sentry/browser'
import type { BufferedError } from './observability'

export function startSentry(
  buffered: BufferedError[],
  scrub: <T extends object>(event: T) => T,
  detach: () => void,
): void {
  init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    release: import.meta.env.VITE_RELEASE ?? undefined,
    environment: 'production',
    // @sentry/browser 11 has no sendDefaultPii option (dataCollection replaced
    // it). Every category that could carry PII is switched off explicitly.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    tracesSampleRate: 0,
    defaultIntegrations: false,
    integrations: [
      eventFiltersIntegration(),
      functionToStringIntegration(),
      linkedErrorsIntegration(),
      dedupeIntegration(),
      globalHandlersIntegration(),
      httpClientIntegration({
        failedRequestStatusCodes: [[500, 599]],
        failedRequestTargets: [/\/\.netlify\/functions\//],
      }),
    ],
    maxBreadcrumbs: 0,
    denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:/i],
    ignoreErrors: ['ResizeObserver loop'],
    beforeSend: (event) => {
      try {
        return scrub(event)
      } catch {
        return null // fail closed: an event that cannot be scrubbed is dropped
      }
    },
  })

  // The SDK's own global handlers are installed now. Stop buffering, then
  // replay what was caught before the SDK loaded. All synchronous, so no error
  // falls between the two.
  detach()
  for (const entry of buffered) {
    const err: unknown = entry.error ?? new Error(entry.message || 'Unknown error')
    captureException(err, {
      mechanism: {
        type: entry.kind === 'error' ? 'onerror' : 'onunhandledrejection',
        handled: false,
      },
    })
  }
}
