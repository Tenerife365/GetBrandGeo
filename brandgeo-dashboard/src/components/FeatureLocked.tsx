/**
 * FeatureLocked.tsx — the locked / upgrade screen for a plan-gated feature.
 * Rendered by a page when the active client's plan is below the feature's
 * minimum plan (see planConfig FEATURE_MIN_PLAN / hasFeature). Reusable for any
 * future gated feature — pass its FeatureId.
 */
import { Lock, Sparkles, ArrowRight, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { FEATURE_META, featureUnlockPlan, PLAN_LABELS, type FeatureId } from '../lib/planConfig'

export default function FeatureLocked({ feature }: { feature: FeatureId }) {
  const navigate = useNavigate()
  const meta = FEATURE_META[feature]
  const plan = featureUnlockPlan(feature)

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-2xl mx-auto">
      <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 sm:p-10 text-center">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto mb-5">
          <Lock size={22} className="text-brand-300" />
        </div>
        <h1 className="text-xl font-semibold text-white">
          {meta.label} is a {PLAN_LABELS[plan]} feature
        </h1>
        <p className="text-sm text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">{meta.blurb}</p>

        <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-300 bg-dark-700/50 border border-dark-600 rounded-lg px-4 py-2">
          <Check size={15} className="text-brand-300" />
          Unlocks on the <span className="text-brand-300 font-medium">{PLAN_LABELS[plan]}</span> plan and above
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
