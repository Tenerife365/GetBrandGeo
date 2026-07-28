import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border whitespace-nowrap text-[11px] font-medium leading-none transition-colors [&>svg]:size-3 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        /** Violet chip. The hero eyebrow. */
        brand:
          'border-brand/28 bg-brand/10 text-[rgb(180_175_255_/_0.92)]',
        /** Neutral glass chip. Payment trust row. */
        glass:
          'border-white/10 bg-white/[0.04] text-ink-2 backdrop-blur-md',
        /** Quiet outline, no fill. Group labels. */
        outline: 'border-white/10 bg-transparent text-ink-3',
      },
      size: {
        sm: 'px-2.5 py-1',
        md: 'px-3 py-1.5 text-xs',
      },
    },
    defaultVariants: { variant: 'brand', size: 'sm' },
  },
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'
  return <Comp className={cn(badgeVariants({ variant, size }), className)} {...props} />
}

export { Badge, badgeVariants }
