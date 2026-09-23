import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground border-rule-strong h-11 w-full min-w-0 rounded-[3px] border bg-sheet px-3 text-base outline-none transition-colors file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 md:text-sm',
        'hover:border-ink/40 focus-visible:border-rubric',
        'aria-invalid:border-rubric',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
