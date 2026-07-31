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

export default function FeatureLocked({ feature }: { feature: FeatureId }) {
  const navigate = useNavigate()
  const meta = FEATURE_META[feature]
  const plan = featureUnlockPlan(feature)

  // Coming soon: no plan grants this feature, so no plan is named and no
  // purchase path is offered.
  if (plan === null) {
    return (
      <div className="p-4 sm:p-6 md:p-10 max-w-2xl mx-auto">
        <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 sm:p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-5">
            <Clock size={22} className="text-brand-300" />
          </div>
          <h1 className="text-xl font-semibold text-white">
            {meta.label} is coming soon
          </h1>
          <p className="text-sm text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">{meta.blurb}</p>

          <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-300 bg-dark-700/50 border border-dark-600 rounded-lg px-4 py-2">
            <Sparkles size={15} className="text-brand-300" />
            In development. Not part of any plan yet.
          </div>

          <p className="text-xs text-slate-400 mt-6 max-w-md mx-auto leading-relaxed">
            Nothing to buy today. We will tell you here as soon as it is ready.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-2xl mx-auto">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-5">
          <Lock size={22} className="text-brand-300" />
        </div>
        <h1 className="text-xl font-semibold text-white">
          {meta.label} is included on the {PLAN_LABELS[plan]} plan
        </h1>
        <p className="text-sm text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">{meta.blurb}</p>

        <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-300 bg-dark-700/50 border border-dark-600 rounded-lg px-4 py-2">
          <Check size={15} className="text-brand-300" />
          Available on the <span className="text-brand-300 font-medium">{PLAN_LABELS[plan]}</span> plan and above
        </div>

        <div className="mt-7">
          <button
            onClick={() => navigate('/account')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-brand-500 text-white hover:bg-brand-400 transition-colors"
          >
            <Sparkles size={15} /> See plans <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
