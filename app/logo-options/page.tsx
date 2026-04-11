"use client"

import { useState } from "react"

// Pill Stack Variation 1: Gentle curve with dot indicator
function LogoOption1({ size = 120 }: { size?: number }) {
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
      
      {/* Gentle curved arrow */}
      <path
        d="M75 31 Q90 31 90 60 Q90 89 75 89"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head */}
      <path
        d="M82 80 L75 91 L68 82"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Small circle at top indicating origin */}
      <circle cx="75" cy="31" r="7" fill="#E9D5FF" stroke="#A855F7" strokeWidth="2.5" />
    </svg>
  )
}

// Pill Stack Variation 2: Tighter curve, bubbly arrow tip
function LogoOption2({ size = 120 }: { size?: number }) {
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
      
      {/* Tighter curved arrow */}
      <path
        d="M75 31 Q98 31 98 60 Q98 91 78 91"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bubbly arrow tip */}
      <circle cx="78" cy="91" r="7" fill="#A855F7" />
      <circle cx="78" cy="91" r="3" fill="#E9D5FF" />
      {/* Origin indicator */}
      <circle cx="75" cy="31" r="6" fill="#A855F7" />
    </svg>
  )
}

// Pill Stack Variation 3: Wide swooping curve
function LogoOption3({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three pill/capsule items */}
      <rect x="12" y="20" rx="12" ry="12" width="48" height="22" fill="#A855F7" />
      <rect x="12" y="50" rx="12" ry="12" width="48" height="22" fill="#C084FC" />
      <rect x="12" y="80" rx="12" ry="12" width="48" height="22" fill="#E9D5FF" />
      
      {/* Wide swooping curve */}
      <path
        d="M70 31 C105 31 105 91 70 91"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rounded arrow head */}
      <path
        d="M78 82 L70 93 L62 84"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Dot at origin */}
      <circle cx="70" cy="31" r="5" fill="#E9D5FF" />
    </svg>
  )
}

// Pill Stack Variation 4: Soft S-curve
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
      
      {/* Soft S-curve */}
      <path
        d="M75 31 Q95 31 90 55 Q85 75 75 91"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow head */}
      <path
        d="M82 83 L75 94 L68 85"
        stroke="#A855F7"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Origin ring */}
      <circle cx="75" cy="31" r="7" fill="none" stroke="#A855F7" strokeWidth="3" />
    </svg>
  )
}

// Pill Stack Variation 5: Elegant curve with gradient
function LogoOption5({ size = 120 }: { size?: number }) {
  const gradientId = `pillGradient5-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
      </defs>
      
      {/* Three pill/capsule items */}
      <rect x="15" y="20" rx="12" ry="12" width="50" height="22" fill="#A855F7" />
      <rect x="15" y="50" rx="12" ry="12" width="50" height="22" fill="#C084FC" />
      <rect x="15" y="80" rx="12" ry="12" width="50" height="22" fill="#E9D5FF" />
      
      {/* Elegant curved arrow with gradient */}
      <path
        d="M75 31 Q100 35 95 60 Q90 85 75 91"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Rounded triangle arrow */}
      <path
        d="M82 83 L75 94 L68 85 Z"
        fill="#E9D5FF"
      />
      {/* Dot at origin */}
      <circle cx="75" cy="31" r="6" fill="#A855F7" />
      <circle cx="75" cy="31" r="3" fill="white" />
    </svg>
  )
}

// Pill Stack Variation 6: Bouncy curve with emphasis
function LogoOption6({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three pill/capsule items - slightly rounder */}
      <rect x="15" y="20" rx="11" ry="11" width="48" height="22" fill="#A855F7" />
      <rect x="15" y="50" rx="11" ry="11" width="48" height="22" fill="#C084FC" />
      <rect x="15" y="80" rx="11" ry="11" width="48" height="22" fill="#E9D5FF" />
      
      {/* Bouncy curve - wider arc */}
      <path
        d="M73 31 Q102 36 100 60 Q98 84 73 91"
        stroke="#A855F7"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bubbly filled arrow tip */}
      <circle cx="73" cy="91" r="8" fill="#A855F7" />
      <path
        d="M73 91 L80 83 L66 83 Z"
        fill="#A855F7"
      />
      {/* Origin circle */}
      <circle cx="73" cy="31" r="8" fill="#E9D5FF" stroke="#A855F7" strokeWidth="2" />
    </svg>
  )
}

export default function LogoOptionsPage() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const logos = [
    { id: 1, name: "Gentle Curve", description: "Soft curve with dot indicator at origin", Component: LogoOption1 },
    { id: 2, name: "Bubbly Tip", description: "Tighter curve with nested circle arrow tip", Component: LogoOption2 },
    { id: 3, name: "Wide Swoop", description: "Wide symmetrical swooping curve", Component: LogoOption3 },
    { id: 4, name: "S-Curve Flow", description: "Soft S-curve with ring indicator", Component: LogoOption4 },
    { id: 5, name: "Gradient Elegant", description: "Elegant curve with gradient stroke", Component: LogoOption5 },
    { id: 6, name: "Bouncy Arc", description: "Wide bouncy arc with filled arrow tip", Component: LogoOption6 },
  ]

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Set Check Logo Options</h1>
        <p className="text-muted-foreground mb-8">
          Pill Stack variations with curved arrows. Select to preview at different sizes.
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
              Selected: {logos[selectedOption - 1].name}
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
