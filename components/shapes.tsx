import { cn } from '@/lib/utils'

type Finish = 'solid' | 'outline'

interface MarkProps {
  size?: number
  finish?: Finish
  className?: string
  tone?: string
}

export function SetMark({ size = 10, finish = 'solid', className, tone }: MarkProps) {
  const color = tone ?? 'var(--rubric)'
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 rounded-full', className)}
      style={{
        width: size,
        height: size,
        background: finish === 'solid' ? color : 'transparent',
        border: finish === 'outline' ? `1.25px solid ${color}` : undefined,
      }}
    />
  )
}

export function IdeaMark({ size = 10, finish = 'outline', className, tone }: MarkProps) {
  const color = tone ?? 'var(--ballpoint)'
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 rounded-full', className)}
      style={{
        width: size,
        height: size,
        background: finish === 'solid' ? color : 'transparent',
        border: `1.25px solid ${color}`,
      }}
    />
  )
}

export function RubricMark({ size = 12, className, tone }: MarkProps) {
  const color = tone ?? 'var(--rubric)'
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block shrink-0 rounded-full', className)}
      style={{ width: size, height: 1.5, background: color }}
    />
  )
}

export function Trio({ size = 10, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <SetMark size={size} />
      <IdeaMark size={size} />
      <RubricMark size={size + 2} />
    </span>
  )
}
