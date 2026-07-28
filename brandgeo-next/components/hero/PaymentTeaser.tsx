'use client'

import { motion } from 'framer-motion'
import { CreditCard, Coins } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

/**
 * Payment trust chips under the audit field.
 *
 * "Coming soon" is load-bearing wording, not filler: no Crypto.com merchant
 * account exists yet and nothing on the checkout path accepts crypto. The chip
 * is a positioning signal only. If crypto acceptance ships, this component and
 * the wording both change together.
 */
export function PaymentTeaser() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.62, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-center gap-2"
    >
      <Badge variant="glass">
        <CreditCard aria-hidden />
        Stripe supported
      </Badge>
      <Badge variant="glass">
        <Coins aria-hidden />
        Crypto payments coming soon
        <span className="text-ink-3">(Crypto.com Pay)</span>
      </Badge>
    </motion.div>
  )
}
