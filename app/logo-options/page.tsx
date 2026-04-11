"use client"

import { useState } from "react"

// Logo Option 1: Curved arrow with three bubbly circles
function LogoOption1({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three bubbly list items */}
      <circle cx="35" cy="30" r="14" fill="#A855F7" />
      <circle cx="35" cy="60" r="14" fill="#C084FC" />
      <circle cx="35" cy="90" r="14" fill="#E9D5FF" />
      
      {/* Curved arrow showing top item moving down */}
      <path
        d="M55 30 Q85 30 85 60 Q85 90 70 90"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head */}
      <path
        d="M75 82 L70 92 L62 85"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// Logo Option 2: Rounded rectangle items with bouncy arrow
function LogoOption2({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three rounded rectangle items */}
      <rect x="20" y="18" rx="10" ry="10" width="45" height="20" fill="#A855F7" />
      <rect x="20" y="50" rx="10" ry="10" width="45" height="20" fill="#C084FC" />
      <rect x="20" y="82" rx="10" ry="10" width="45" height="20" fill="#E9D5FF" />
      
      {/* Bubbly curved arrow */}
      <path
        d="M72 28 C100 28 100 92 82 92"
        stroke="#A855F7"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head - more bubbly */}
      <circle cx="82" cy="92" r="6" fill="#A855F7" />
      <path
        d="M88 84 L82 95 L74 86"
        stroke="#A855F7"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

// Logo Option 3: Musical note-inspired circles with flowing arrow
function LogoOption3({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three bubbly circles with varying sizes for playfulness */}
      <circle cx="32" cy="28" r="16" fill="#A855F7" />
      <circle cx="32" cy="60" r="12" fill="#C084FC" />
      <circle cx="32" cy="88" r="14" fill="#E9D5FF" />
      
      {/* Flowing S-curve arrow */}
      <path
        d="M52 28 C80 28 65 60 80 60 C95 60 80 88 60 88"
        stroke="url(#gradient3)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head */}
      <polygon points="60,88 68,80 68,96" fill="#A855F7" />
      
      <defs>
        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Logo Option 4: Pill-shaped items with simple down arrow
function LogoOption4({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three pill/capsule items */}
      <rect x="15" y="20" rx="12" ry="12" width="50" height="22" fill="#A855F7" />
      <rect x="15" y="50" rx="12" ry="12" width="50" height="22" fill="#C084FC" />
      <rect x="15" y="80" rx="12" ry="12" width="50" height="22" fill="#E9D5FF" />
      
      {/* Simple curved arrow on right */}
      <path
        d="M75 31 L75 89"
        stroke="#A855F7"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M67 78 L75 91 L83 78"
        stroke="#A855F7"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Small circle at top indicating "from here" */}
      <circle cx="75" cy="31" r="8" fill="#E9D5FF" stroke="#A855F7" strokeWidth="3" />
    </svg>
  )
}

// Logo Option 5: Super bubbly with bounce effect
function LogoOption5({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three super bubbly circles with slight overlap feel */}
      <circle cx="38" cy="30" r="18" fill="#E9D5FF" />
      <circle cx="38" cy="30" r="18" fill="#A855F7" opacity="0.9" />
      <circle cx="38" cy="62" r="15" fill="#C084FC" />
      <circle cx="38" cy="92" r="13" fill="#E9D5FF" />
      
      {/* Bouncy curved arrow */}
      <path
        d="M60 30 Q95 30 90 60 Q85 95 65 92"
        stroke="#A855F7"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bubbly arrow tip */}
      <circle cx="65" cy="92" r="8" fill="#A855F7" />
      <circle cx="65" cy="92" r="4" fill="#E9D5FF" />
    </svg>
  )
}

// Logo Option 6: Minimalist with clean lines
function LogoOption6({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three circles with consistent sizing */}
      <circle cx="35" cy="30" r="12" fill="#A855F7" />
      <circle cx="35" cy="60" r="12" fill="#C084FC" />
      <circle cx="35" cy="90" r="12" fill="#E9D5FF" />
      
      {/* Short line connectors */}
      <line x1="35" y1="42" x2="35" y2="48" stroke="#C084FC" strokeWidth="3" strokeLinecap="round" />
      <line x1="35" y1="72" x2="35" y2="78" stroke="#E9D5FF" strokeWidth="3" strokeLinecap="round" />
      
      {/* Clean curved reorder arrow */}
      <path
        d="M52 30 C75 30 75 60 75 60 C75 90 60 90 55 90"
        stroke="#A855F7"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M62 83 L55 92 L55 83"
        fill="#A855F7"
      />
    </svg>
  )
}

export default function LogoOptionsPage() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const logos = [
    { id: 1, name: "Classic Curved", description: "Three circles with elegant curved arrow", Component: LogoOption1 },
    { id: 2, name: "Rounded Bars", description: "Rounded rectangles with bouncy arrow dot", Component: LogoOption2 },
    { id: 3, name: "Musical Flow", description: "Varying circle sizes with flowing S-curve", Component: LogoOption3 },
    { id: 4, name: "Pill Stack", description: "Capsule items with direct down arrow", Component: LogoOption4 },
    { id: 5, name: "Super Bubbly", description: "Extra bubbly circles with dot-tip arrow", Component: LogoOption5 },
    { id: 6, name: "Minimalist", description: "Clean circles with connector lines", Component: LogoOption6 },
  ]

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Set Check Logo Options</h1>
        <p className="text-muted-foreground mb-8">
          Select a logo option. All feature three bubbly list items with an arrow indicating reordering.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
          {logos.map(({ id, name, description, Component }) => (
            <button
              key={id}
              onClick={() => setSelectedOption(id)}
              className={`p-6 rounded-2xl border-2 transition-all ${
                selectedOption === id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <div className="flex items-center justify-center mb-4">
                <Component size={100} />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{name}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </button>
          ))}
        </div>

        {selectedOption && (
          <div className="border border-border rounded-2xl bg-card p-8">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Selected: Option {selectedOption}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Large preview */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Large (120px)</p>
                <div className="bg-background rounded-xl p-4 inline-block">
                  {logos[selectedOption - 1].Component({ size: 120 })}
                </div>
              </div>
              
              {/* Medium preview */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Medium (64px)</p>
                <div className="bg-background rounded-xl p-4 inline-block">
                  {logos[selectedOption - 1].Component({ size: 64 })}
                </div>
              </div>
              
              {/* Favicon size */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Favicon (32px)</p>
                <div className="bg-background rounded-xl p-4 inline-block">
                  {logos[selectedOption - 1].Component({ size: 32 })}
                </div>
              </div>
              
              {/* Tiny */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Tiny (16px)</p>
                <div className="bg-background rounded-xl p-4 inline-block">
                  {logos[selectedOption - 1].Component({ size: 16 })}
                </div>
              </div>
            </div>

            {/* Light background preview */}
            <div className="mt-8">
              <p className="text-sm text-muted-foreground mb-2">On Light Background</p>
              <div className="bg-white rounded-xl p-6 flex items-center justify-center gap-8">
                {logos[selectedOption - 1].Component({ size: 80 })}
                {logos[selectedOption - 1].Component({ size: 48 })}
                {logos[selectedOption - 1].Component({ size: 32 })}
              </div>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Tell me which option you prefer and I will apply it as the favicon, OG image, and add it to the homepage.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
