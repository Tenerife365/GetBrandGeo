// ============================================================================
// _publishing.js  --  Swappable publishing-layer abstraction for AI Social.
//
// The rest of the app (social-* functions) talks ONLY to the provider returned
// by getProvider() -- never to Ayrshare (or any vendor) directly. Swapping the
// publishing layer later (Ayrshare <-> self-hosted Postiz/Mixpost) is therefore
// a matter of adding one new provider module and flipping the
// PUBLISHING_PROVIDER env var, with ZERO changes to any caller.
//
// PROVIDER INTERFACE  -- every provider module must export these async fns:
//
//   isConfigured(): boolean
//       True if the env vars this provider needs are present.
//
//   listAccounts({ profileKey }): Promise<Account[]>
//       Account = { platform, displayName, externalId, status }
//       platform is one of the INTERNAL platform ids (see PLATFORMS below).
//
//   createLinkingUrl({ profileKey }): Promise<{ url } | null>
//       A hosted URL where the user authorizes their social accounts.
//       Returns null if the provider/plan does not support in-app linking
//       (e.g. Ayrshare Premium -- accounts are linked in Ayrshare's own
//       dashboard, and the app just reads them back via listAccounts).
//
//   publish({ profileKey, targets, scheduleDate }): Promise<PublishResult>
//       targets  = [{ platform, text, mediaUrls, options }]   (one per network)
//       scheduleDate = ISO 8601 string | null   (null = publish now)
//       PublishResult = { statuses: TargetStatus[], raw }
//       TargetStatus = { platform, status, ref, permalink, error }
//         status in 'published' | 'scheduled' | 'failed'
//
//   getStatus({ refs, profileKey }): Promise<TargetStatus[]>
//       refs = [{ platform, ref }]  -- provider ids returned by publish()
//
//   deletePost({ ref, profileKey }): Promise<{ ok, error? }>
//       Cancel a scheduled post / delete a published one.
//
// MULTI-TENANT PROFILE MANAGEMENT (optional -- only providers that model one
// isolated workspace per tenant implement these; social-profile.js degrades
// gracefully when they are absent):
//
//   listProfiles(): Promise<Profile[]>
//       Profile = { title, refId, status, suspended, platforms[] }
//       Identifies the tenant workspaces that exist at the provider. NOTE: it
//       does NOT return the secret key -- see verifyProfileKey.
//
//   createProfile({ title }): Promise<{ title, refId, profileKey }>
//       Creates a workspace AND returns its key (often the only moment the key
//       is ever disclosed, so the caller must persist it immediately).
//
//   verifyProfileKey({ profileKey }): Promise<{ ok, title?, refId?, accounts?, error? }>
//       Proves a key is valid, and reveals which accounts it controls, BEFORE
//       it gets bound to a client.
// ============================================================================

// Internal platform ids used everywhere in the app + DB. Providers translate
// these to their own vendor ids internally (e.g. Ayrshare: gbp->gmb, x->twitter).
const PLATFORMS = [
  'instagram', 'facebook', 'linkedin', 'gbp', 'x',
  'bluesky', 'pinterest', 'reddit', 'snapchat', 'telegram', 'threads', 'tiktok', 'youtube',
];

const ayrshare = require('./_publishing_ayrshare');

const PROVIDERS = {
  ayrshare,
  // postiz:  require('./_publishing_postiz'),   // future self-hosted option
  // mixpost: require('./_publishing_mixpost'),  // future self-hosted option
};

function getProvider() {
  const name = (process.env.PUBLISHING_PROVIDER || 'ayrshare').toLowerCase();
  const provider = PROVIDERS[name];
  if (!provider) {
    throw new Error(`[publishing] Unknown PUBLISHING_PROVIDER "${name}". Known: ${Object.keys(PROVIDERS).join(', ')}`);
  }
  return provider;
}

module.exports = { getProvider, PLATFORMS };
