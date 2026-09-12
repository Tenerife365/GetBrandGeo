/**
 * _affiliate_email.js -- the seven affiliate notifications, all through the
 * shared Resend shell in _email.js so they carry the BrandGEO look and the
 * transactional (no unsubscribe) footer. Every function returns
 * sendBrandedEmail's { ok, skipped?, error? } and never throws; a missing
 * RESEND_API_KEY makes them no-ops, which is what the tests rely on.
 *
 * Every email links to the exact affiliate page it is about.
 */

const { sendBrandedEmail, APP_URL } = require('./_email')
const { formatMoney, summarizeRules } = require('./_affiliate_core')

const PORTAL_URL = `${APP_URL}/affiliate`
const AFFILIATE_LOGIN_URL = `${APP_URL}/affiliate/login`
const ADMIN_URL = `${APP_URL}/affiliates`
const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'support@getbrandgeo.com'
const REPLY_TO = process.env.AFFILIATE_REPLY_TO || 'support@getbrandgeo.com'

function joinUrl(token) { return `${APP_URL}/affiliate/join/${encodeURIComponent(token)}` }

async function sendInvitation({ affiliate, programs, token, inviterName }) {
  const names = (programs || []).map((p) => p.name)
  const list = (programs || []).map((p) => `${p.name}: ${summarizeRules(p)}`)
  return sendBrandedEmail({
    to: affiliate.email,
    replyTo: REPLY_TO,
    subject: names.length === 1 ? `You are invited to the ${names[0]} affiliate program` : 'You are invited to join our affiliate programs',
    heading: `Hi ${affiliate.full_name.split(' ')[0]}, you are invited`,
    paragraphs: [
      `${inviterName || 'We'} invited you to earn commission by referring customers to ${names.join(' and ')}.`,
      'Accept the invitation to get your personal tracking link, see the program terms and set how you would like to be paid. The link below signs you in directly and stays valid for 7 days.',
    ],
    bullets: list,
    cta: { label: 'Accept the invitation', url: joinUrl(token) },
    footerNote: 'If you did not expect this invitation you can ignore this email; nothing is created until you accept.',
  })
}

async function sendApplicationReceived({ application, program }) {
  return sendBrandedEmail({
    to: application.email,
    replyTo: REPLY_TO,
    subject: `We received your application to the ${program.name} affiliate program`,
    heading: 'Application received',
    paragraphs: [
      `Thanks ${application.full_name.split(' ')[0]}. Your application to the ${program.name} affiliate program is in review. We reply to every application, usually within 3 business days.`,
      `Program terms: ${summarizeRules(program)}. Approval period ${program.approval_days} days, payouts ${String(program.payout_schedule || '').toLowerCase()}.`,
    ],
    cta: { label: 'Affiliate sign in', url: AFFILIATE_LOGIN_URL },
    footerNote: 'Sign-in works once your application is approved.',
  })
}

async function sendApplicationApproved({ affiliate, program, code, token }) {
  const link = `${APP_URL}/r/${program.slug}/${code}`
  return sendBrandedEmail({
    to: affiliate.email,
    replyTo: REPLY_TO,
    subject: `Approved: you are now a ${program.name} affiliate`,
    heading: `Welcome to the ${program.name} program`,
    paragraphs: [
      `Your application was approved. Your personal referral link is ${link} and your code is ${code}.`,
      `Terms: ${summarizeRules(program)}. Commissions are approved ${program.approval_days} days after the sale and paid ${String(program.payout_schedule || '').toLowerCase()}.`,
      'Open your affiliate dashboard to copy your link, add your payout details and follow every click, lead and commission.',
    ],
    cta: { label: 'Open your affiliate dashboard', url: token ? joinUrl(token) : PORTAL_URL },
  })
}

async function sendApplicationRejected({ application, program, note }) {
  return sendBrandedEmail({
    to: application.email,
    replyTo: REPLY_TO,
    subject: `Your application to the ${program.name} affiliate program`,
    heading: 'Thank you for applying',
    paragraphs: [
      `We reviewed your application to the ${program.name} affiliate program and we are not able to approve it right now.`,
      note ? `Note from our team: ${note}` : 'This is usually about audience fit rather than anything you did wrong.',
      'You are welcome to apply again later, and you can reply to this email if you would like to talk it through.',
    ],
  })
}

async function sendNewConversion({ affiliate, program, conversion, commission }) {
  const label = conversion.conversion_type === 'recurring' ? 'renewal' : conversion.conversion_type.replace('_', ' ')
  return sendBrandedEmail({
    to: affiliate.email,
    replyTo: REPLY_TO,
    subject: `New ${label} for ${program.name}: ${formatMoney(commission.amount_cents, commission.currency)} commission pending`,
    heading: 'You have a new conversion',
    paragraphs: [
      `A ${label} was attributed to you in the ${program.name} program${conversion.customer_ref ? ` (${conversion.customer_ref})` : ''}.`,
      `Commission: ${formatMoney(commission.amount_cents, commission.currency)}, pending until ${new Date(commission.approve_after).toISOString().slice(0, 10)} (the ${program.approval_days}-day approval period covers refunds).`,
    ],
    cta: { label: 'See your commissions', url: `${PORTAL_URL}#commissions` },
  })
}

async function sendCommissionApproved({ affiliate, program, commissions }) {
  const total = commissions.reduce((s, c) => s + Number(c.amount_cents), 0)
  const currency = commissions[0] ? commissions[0].currency : 'EUR'
  return sendBrandedEmail({
    to: affiliate.email,
    replyTo: REPLY_TO,
    subject: `${formatMoney(total, currency)} approved in the ${program.name} program`,
    heading: 'Commission approved',
    paragraphs: [
      `${commissions.length} commission${commissions.length === 1 ? '' : 's'} totalling ${formatMoney(total, currency)} ${commissions.length === 1 ? 'was' : 'were'} approved and will be included in your next payout once your balance reaches the program minimum of ${formatMoney(program.min_payout_cents, program.currency)}.`,
      `Payouts: ${String(program.payout_schedule || '').toLowerCase()}.`,
    ],
    cta: { label: 'See your balance', url: `${PORTAL_URL}#commissions` },
  })
}

async function sendPayoutCompleted({ affiliate, batch }) {
  return sendBrandedEmail({
    to: affiliate.email,
    replyTo: REPLY_TO,
    subject: `Payout sent: ${formatMoney(batch.total_cents, batch.currency)}`,
    heading: 'Your payout is on its way',
    paragraphs: [
      `We sent ${formatMoney(batch.total_cents, batch.currency)} via ${String(batch.payout_method || 'your chosen method')} on ${new Date(batch.paid_at || Date.now()).toISOString().slice(0, 10)}.`,
      batch.external_reference ? `Payment reference: ${batch.external_reference}.` : 'Depending on the provider it can take a few business days to arrive.',
      `${batch.item_count} commission${batch.item_count === 1 ? '' : 's'} ${batch.item_count === 1 ? 'is' : 'are'} included; the full breakdown is in your payout history.`,
    ],
    cta: { label: 'See payout history', url: `${PORTAL_URL}#payouts` },
  })
}

async function notifyAdminNewApplication({ application, program }) {
  return sendBrandedEmail({
    to: ADMIN_ALERT_EMAIL,
    subject: `New affiliate application: ${application.full_name} for ${program.name}`,
    heading: 'New affiliate application',
    paragraphs: [
      `${application.full_name} (${application.email}${application.company ? `, ${application.company}` : ''}) applied to the ${program.name} program from ${application.country || 'an unknown country'}.`,
      `Promotion method: ${application.promo_method || 'not stated'}.`,
    ],
    cta: { label: 'Review in the admin', url: `${ADMIN_URL}#applications` },
  })
}

module.exports = {
  sendInvitation, sendApplicationReceived, sendApplicationApproved, sendApplicationRejected,
  sendNewConversion, sendCommissionApproved, sendPayoutCompleted, notifyAdminNewApplication,
  PORTAL_URL, AFFILIATE_LOGIN_URL, ADMIN_URL, joinUrl,
}
