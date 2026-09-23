import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none",
  {
    variants: {
      variant: {
        default: 'bg-rubric text-on-rubric shadow-lift hover:brightness-[1.08] active:brightness-95',
        destructive:
          'border border-rubric/50 text-rubric bg-transparent hover:bg-rubric hover:text-on-rubric hover:border-rubric',
        outline: 'border border-rule-strong bg-sheet text-ink shadow-lift hover:bg-sunk',
        structure: 'bg-ballpoint text-on-ballpoint shadow-lift hover:brightness-[1.08]',
        secondary: 'bg-sunk text-ink hover:bg-rule',
        ghost: 'bg-transparent text-ink hover:bg-sunk',
        link: 'text-rubric underline decoration-rubric/35 hover:decoration-rubric',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs gap-1.5',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

function PrimaryAction({
  className,
  children,
  tone = 'rubric',
  scale = 'default',
  ...props
}: React.ComponentProps<'button'> & {
  tone?: 'rubric' | 'ballpoint' | 'ink' | 'stock'
  scale?: 'default' | 'lg'
}) {
  const toneClass = {
    rubric: 'bg-rubric text-on-rubric hover:brightness-[1.08]',
    ballpoint: 'bg-ballpoint text-on-ballpoint hover:brightness-[1.08]',
    ink: 'bg-ink text-stock hover:brightness-125',
    stock: 'bg-sheet text-ink hover:bg-white',
  }[tone]

  return (
    <button
      type="button"
      className={cn(
        'group inline-flex cursor-pointer items-center gap-3 rounded-[3px] font-medium shadow-lift transition-[filter,background-color,box-shadow] duration-150 hover:shadow-lift-raised disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-lift',
        scale === 'lg' ? 'h-14 pl-7 pr-6 text-base sm:h-[3.75rem] sm:text-lg' : 'h-11 pl-5 pr-4 text-sm',
        toneClass,
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={cn(
          'transition-transform duration-200 ease-out group-hover:translate-x-1 group-disabled:translate-x-0',
          scale === 'lg' ? 'size-5' : 'size-4',
        )}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export { Button, PrimaryAction, buttonVariants }
