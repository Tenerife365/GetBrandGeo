/**
 * Copy for MCP stage 3 (OAuth sign-in and Connected apps), keyed as in
 * docs/copy/mcp-stage3-oauth-2026-11-06.md sections 1 and 2. Strings marked
 * NEW were not in the deck (design spec section 11) and are written here in
 * the deck's voice for bg-verify to check.
 */

export const CONSENT = {
  loading: 'Checking your sign-in request...',
  title: 'Connect an app · BrandGEO', // NEW consent.title
  deciding: 'Sending your choice...', // NEW consent.deciding
  appFallback: 'the app', // NEW consent.app_fallback
  accountLabel: 'BrandGEO account',
  readHeading: (appName: string) => `With read access, ${appName} can:`,
  heading: (appName: string) => `Connect ${appName} to BrandGEO`,
  intro: (appName: string, brandName: string) => `${appName} is asking to read data from ${brandName}, your BrandGEO account.`,
  redirectBefore: 'After you choose, you will be sent back to ',
  redirectAfter: '.',
  redirectLoopback: 'After you choose, you will be sent back to an app on this computer.',
  loopbackWarning: (appName: string) =>
    `${appName} is running on this computer. Continue only if you started this connection yourself, from an app you installed. A different program on this computer could be pretending to be ${appName}.`,
  readItems: [
    'See your brand name, website and plan, and which AI engines BrandGEO tracks for you',
    'See how often AI engines mention your brand',
    'See the prompts BrandGEO tracks for you',
    'Read what each AI engine answered to those prompts',
    'See which competitors come up next to you',
    'See how positive or negative the answers are',
    'Read your latest BrandGEO recommendations',
    'Read your Fix This list and which items are done',
  ],
  readLimits: 'It cannot start a collection, change a setting, or see any other BrandGEO account.',
  writeLabel: 'Also let it mark Fix This items done',
  writeHelper: 'Off by default. Marking an item done tells BrandGEO to check it again later. It cannot change anything else.',
  allow: 'Allow',
  cancel: 'Cancel',
  footnote: (appName: string) => `You can disconnect ${appName} at any time on your BrandGEO Account page, under MCP access.`,
  sending: (hostOrThisComputer: string) => `Sending you back to ${hostOrThisComputer}...`,
  thisComputer: 'your app',
  brandFallback: 'Your account', // NEW, plan_required and account_unavailable carry no brand name
} as const

export const ERROR_BUTTONS = {
  dashboard: 'Go to your dashboard', // NEW error.btn_dashboard
  plans: 'See plans', // NEW error.btn_plans
  signOut: 'Sign out', // NEW error.btn_signout
  retry: 'Try again', // NEW error.btn_retry
} as const

export type ErrorKey =
  | 'unknown_client' | 'metadata_unavailable' | 'redirect_not_allowed' | 'request_expired'
  | 'admin_refused' | 'no_account' | 'plan_below_radar' | 'research_account' | 'invalid_request' | 'generic'

export interface ErrorCopy { heading: string; body: string }

export function errorCopy(key: ErrorKey, v: { appName: string; brandName: string; planName: string }): ErrorCopy {
  switch (key) {
    case 'unknown_client':
      return {
        heading: 'We do not recognise this app',
        body: 'This sign-in request names an app BrandGEO does not know, so we did not continue. Nothing was shared. If you started this from Claude, go back to Claude and try again. If it keeps happening, write to support@getbrandgeo.com.',
      }
    case 'metadata_unavailable': // NEW, not in the deck
      return {
        heading: 'We could not check this app',
        body: 'We could not load the details of this app just now, so we stopped. Nothing was shared. This is not something you did. Select Try again in a minute.',
      }
    case 'redirect_not_allowed':
      return {
        heading: 'We could not verify where to send you',
        body: 'The address this app asked us to return you to is not one we allow, so we stopped. Nothing was shared. This is not something you did. Go back to the app and start again.',
      }
    case 'request_expired':
      return {
        heading: 'This sign-in request expired',
        body: `Requests last 5 minutes. Go back to ${v.appName} and start the connection again.`,
      }
    case 'admin_refused':
      return {
        heading: 'Use a viewer login for this',
        body: 'You are signed in with an administrator login, which is not tied to one brand, so there is nothing to connect. Sign in with the viewer login of the brand you want to connect, then start again.',
      }
    case 'no_account': // NEW, not in the deck
      return {
        heading: 'No BrandGEO account found',
        body: 'This login is not tied to a BrandGEO account, so there is nothing to connect. Sign in with the login of the brand you want to connect, then start again.',
      }
    case 'plan_below_radar':
      return {
        heading: 'MCP access starts on the Radar plan',
        body: `${v.brandName} is on the ${v.planName} plan. Connecting an AI app is included from Radar up. Nothing was shared.`,
      }
    case 'research_account':
      return {
        heading: 'This account cannot be connected',
        body: `${v.brandName} is a research account, and research accounts cannot be connected to AI apps. Sign in with a customer account instead.`,
      }
    case 'invalid_request':
      return {
        heading: 'This request is not valid',
        body: `The request from ${v.appName} is incomplete or malformed, so we stopped. This is not something you did. Go back to the app and try again.`,
      }
    default:
      return {
        heading: 'We could not finish connecting',
        body: 'Something failed on our side and nothing was shared. This is not something you did. Select Try again.',
      }
  }
}

export const SUPPORT_EMAIL = 'support@getbrandgeo.com'
/** Appended to the generic error body; the address renders as a mailto link. */
export const GENERIC_SUPPORT_BEFORE = ' If it fails again, write to '
export const GENERIC_SUPPORT_AFTER = ' and tell us the time.'

export const APPS = {
  heading: 'Connected apps',
  helper: 'Apps you signed in to BrandGEO from, such as Claude. Disconnect one and it loses access at once.',
  colApp: 'App',
  colRedirect: 'Sends back to',
  colAccess: 'Access',
  colConnected: 'Connected',
  colLastUsed: 'Last used',
  colActions: 'Actions', // NEW apps.col_actions
  accessRead: 'Read only',
  accessWrite: 'Read and write',
  neverUsed: 'Not used yet',
  redirectLoopback: 'An app on this computer',
  disconnect: 'Disconnect',
  confirm: (appName: string) => `Disconnect ${appName}? It stops working at once. To use it again, connect it again and approve access.`,
  confirmYes: 'Disconnect',
  confirmNo: 'Keep connected',
  success: (appName: string) => `Disconnected ${appName}. It can no longer read your BrandGEO data.`,
  failure: (appName: string) => `We could not disconnect ${appName}, and nothing changed. Try again. If it keeps failing, write to ${SUPPORT_EMAIL}.`,
  emptyBefore: 'No apps connected yet. To connect Claude, add ',
  emptyAfter: ' as a connector in Claude and sign in when asked.',
  loadError: `We could not load your connected apps. This is not something you did. Reload the page. If it fails again, write to ${SUPPORT_EMAIL}.`,
  loading: 'Loading connected apps...', // NEW apps.loading
  disconnecting: (appName: string) => `Disconnecting ${appName}...`, // NEW apps.disconnecting
  disconnectAria: (appName: string) => `Disconnect ${appName}`, // NEW apps.disconnect_aria
  partialNote: 'Apps connected before your plan changed are listed below. They cannot reach your data while your plan is below Radar, and after upgrading an app may need to connect again. You can disconnect them at any time.', // NEW apps.partial_note
  nameFallback: 'Unnamed app', // NEW apps.name_fallback
  retry: 'Retry', // NEW apps.retry
} as const
