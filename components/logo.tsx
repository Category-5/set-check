interface LogoProps {
  size?: number
  className?: string
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="Set Check"
    >
      <rect
        x="1.75"
        y="1.75"
        width="28.5"
        height="28.5"
        rx="2.5"
        fill="var(--sheet)"
        stroke="var(--rule-strong)"
        strokeWidth="1.25"
      />
      <path d="M7.5 11h9" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 16h13" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 21h7" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M17.5 21.5 21 25l7-9.5"
        stroke="var(--rubric)"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export function Wordmark({ size = 24, className = '' }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Logo size={size} />
      <span
        className="font-display font-semibold leading-none"
        style={{ fontSize: size * 0.72 }}
      >
        Set Check
      </span>
    </span>
  )
}
