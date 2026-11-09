/**
 * FeatureLocked.tsx: the locked screen for a gated feature. Rendered by a page
 * when the active client cannot use it (see planConfig hasFeature). Reusable for
 * any gated feature: pass its FeatureId.
 *
 * TWO STATES, and the difference is load bearing:
 *   1. Plan-gated. featureUnlockPlan() returns a plan, some plan really does
 *      include it, so the screen names that plan and offers a way to see plans.
 *   2. Admin-only / coming soon. featureUnlockPlan() returns null because NO
 *      plan grants it (planConfig ADMIN_ONLY_FEATURES). This screen must NOT
 *      name a plan and must NOT offer a purchase or upgrade call to action:
 *      there is nothing to buy, so any such button is a path that leads nowhere.
 *
 * COPY RULE, do not undo. No sentence here may put an indefinite article in
 * front of an interpolated plan label. "a {PLAN_LABELS[plan]} feature" shipped
 * as "AI Social is a Enterprise feature" (audit F6). The plan ladder has been
 * rewritten twice this month, so a computed a/an would be one label away from
 * breaking again. The plan sentences below use the fixed determiner "the ...
 * plan", which is correct for every current and future label.
 *
 * CONTENT RULE: no em dashes and no en dashes in anything a user can read,
 * including title and aria-label attributes.
 */
import { Lock, Sparkles, ArrowRight, Check, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FEATURE_META, featureUnlockPlan, PLAN_LABELS, type FeatureId } from '../lib/planConfig'
import Card from './ui/Card'
import Page from './ui/Page'
import { buttonClasses } from './ui/Button'

export default function FeatureLocked({ feature }: { feature: FeatureId }) {
  const navigate = useNavigate()
  const meta = FEATURE_META[feature]
  const plan = featureUnlockPlan(feature)

  // Coming soon: no plan grants this feature, so no plan is named and no
  // purchase path is offered.
  if (plan === null) {
    return (
      <Page>
        <Card pad="feature" className="max-w-2xl mx-auto text-center">
          <div className="w-10 h-10 rounded-control bg-surface-3 flex items-center justify-center mx-auto mb-4">
            <Clock size={20} aria-hidden="true" className="text-ink-3" />
          </div>
          <h1 className="text-title-sm text-ink">
            {meta.label} is coming soon
          </h1>
          <p className="text-body text-ink-2 mt-3 max-w-[48ch] mx-auto">{meta.blurb}</p>

          <div className="mt-6 inline-flex items-center gap-2 text-body text-ink-2 bg-surface-2 border border-line rounded-control px-4 py-2">
            <Sparkles size={15} aria-hidden="true" className="text-ink-3" />
            In development. Not part of any plan yet.
          </div>

          <p className="text-meta text-ink-3 mt-6 max-w-[48ch] mx-auto">
            Nothing to buy today. We will tell you here as soon as it is ready.
          </p>
        </Card>
      </Page>
    )
  }

  return (
    <Page>
      <Card pad="feature" className="max-w-2xl mx-auto text-center">
        <div className="w-10 h-10 rounded-control bg-surface-3 flex items-center justify-center mx-auto mb-4">
          <Lock size={20} aria-hidden="true" className="text-ink-3" />
        </div>
        <h1 className="text-title-sm text-ink">
          {meta.label} is included on the {PLAN_LABELS[plan]} plan
        </h1>
        <p className="text-body text-ink-2 mt-3 max-w-[48ch] mx-auto">{meta.blurb}</p>

        <div className="mt-6 inline-flex items-center gap-2 text-body text-ink-2 bg-surface-2 border border-line rounded-control px-4 py-2">
          <Check size={15} aria-hidden="true" className="text-pos-ink" />
          Available on the <span className="text-ink font-semibold">{PLAN_LABELS[plan]}</span> plan and above
        </div>

        <div className="mt-7">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className={buttonClasses('primary', 'md')}
          >
            <Sparkles size={15} aria-hidden="true" /> See plans <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </Card>
    </Page>
  )
}
