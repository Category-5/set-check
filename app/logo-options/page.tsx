"use client"

import { useState } from "react"

// Variation 1: Blobby teardrop arrow emerging from top pill
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
      
      {/* Blobby arrow body emerging from top pill, curving to bottom */}
      <path
        d="M65 31 C65 26 72 26 75 31 C85 31 95 40 95 55 C95 70 88 80 80 88 C78 90 73 92 70 92 C67 92 65 90 67 86 C72 80 78 72 78 55 C78 45 72 38 65 38 C62 38 62 34 65 31 Z"
        fill="#A855F7"
      />
      {/* Blobby arrow head pointing at third pill */}
      <ellipse cx="65" cy="91" rx="10" ry="8" fill="#A855F7" />
      <path
        d="M55 85 Q65 102 75 85"
        fill="#A855F7"
      />
    </svg>
  )
}

// Variation 2: Thick blobby curved stroke with rounded arrow tip
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
      
      {/* Blob starting point emerging from top pill */}
      <ellipse cx="68" cy="31" rx="9" ry="7" fill="#A855F7" />
      
      {/* Thick blobby curved arrow body */}
      <path
        d="M75 31 Q100 35 95 60 Q90 85 68 91"
        stroke="#A855F7"
        strokeWidth="12"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Blobby arrow head - points down at third pill */}
      <ellipse cx="68" cy="91" rx="10" ry="6" fill="#A855F7" />
      <circle cx="58" cy="86" r="6" fill="#A855F7" />
      <circle cx="78" cy="86" r="6" fill="#A855F7" />
      <ellipse cx="68" cy="97" rx="7" ry="5" fill="#A855F7" />
    </svg>
  )
}

// Variation 3: Organic blob shape with clear downward pointer
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
      
      {/* Organic blob arrow emerging from top pill */}
      <path
        d="M60 25 C68 22 78 25 85 35 C95 50 92 70 82 82 C78 87 72 91 68 95 C64 99 60 99 60 95 C60 91 66 87 72 80 C80 70 82 55 76 42 C72 35 66 32 60 32 C55 32 55 28 60 25 Z"
        fill="#A855F7"
      />
      {/* Arrow tip blob pointing at third pill */}
      <ellipse cx="60" cy="91" rx="12" ry="6" fill="#A855F7" />
      <ellipse cx="60" cy="98" rx="6" ry="4" fill="#A855F7" />
    </svg>
  )
}

// Variation 4: Puffy cloud-like arrow with soft curves
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
      
      {/* Puffy blob emerging from top pill */}
      <circle cx="72" cy="30" r="10" fill="#A855F7" />
      
      {/* Cloud-like blobby curve made of overlapping circles */}
      <circle cx="85" cy="38" r="9" fill="#A855F7" />
      <circle cx="92" cy="50" r="9" fill="#A855F7" />
      <circle cx="90" cy="64" r="9" fill="#A855F7" />
      <circle cx="82" cy="76" r="9" fill="#A855F7" />
      <circle cx="72" cy="84" r="9" fill="#A855F7" />
      
      {/* Blobby arrow tip pointing at third pill */}
      <ellipse cx="65" cy="91" rx="12" ry="7" fill="#A855F7" />
      <ellipse cx="65" cy="99" rx="7" ry="5" fill="#A855F7" />
    </svg>
  )
}

// Variation 5: Smooth tapered blob with gradient
function LogoOption5({ size = 120 }: { size?: number }) {
  const gradientId = `blobGradient5-${size}`
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
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      
      {/* Three pill/capsule items */}
      <rect x="15" y="20" rx="12" ry="12" width="50" height="22" fill="#A855F7" />
      <rect x="15" y="50" rx="12" ry="12" width="50" height="22" fill="#C084FC" />
      <rect x="15" y="80" rx="12" ry="12" width="50" height="22" fill="#E9D5FF" />
      
      {/* Smooth tapered blob emerging from top, curving to bottom */}
      <path
        d="M65 24 C75 20 88 28 94 45 C100 62 92 80 78 90 L68 97 C62 100 58 97 62 92 L70 86 C82 76 88 60 82 45 C78 35 70 30 65 32 C58 34 58 28 65 24 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Rounded arrow tip */}
      <ellipse cx="65" cy="94" rx="9" ry="6" fill="#C084FC" />
      <ellipse cx="65" cy="100" rx="5" ry="4" fill="#C084FC" />
    </svg>
  )
}

// Variation 6: Simple thick blobby arrow with clear direction
function LogoOption6({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Three pill/capsule items */}
      <rect x="15" y="20" rx="11" ry="11" width="48" height="22" fill="#A855F7" />
      <rect x="15" y="50" rx="11" ry="11" width="48" height="22" fill="#C084FC" />
      <rect x="15" y="80" rx="11" ry="11" width="48" height="22" fill="#E9D5FF" />
      
      {/* Blob origin emerging from top pill */}
      <ellipse cx="66" cy="31" rx="10" ry="8" fill="#A855F7" />
      
      {/* Thick blobby curved body */}
      <path
        d="M66 31 C66 31 98 35 96 60 C94 85 72 88 66 91"
        stroke="#A855F7"
        strokeWidth="14"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Clearly pointing blobby arrow head at third pill */}
      <ellipse cx="66" cy="91" rx="14" ry="8" fill="#A855F7" />
      {/* Arrow point extending down toward third pill */}
      <path
        d="M52 88 Q66 108 80 88"
        fill="#A855F7"
      />
    </svg>
  )
}

export default function LogoOptionsPage() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const logos = [
    { id: 1, name: "Teardrop Flow", description: "Organic teardrop blob curving from top to bottom", Component: LogoOption1 },
    { id: 2, name: "Thick & Bubbly", description: "Extra thick stroke with bubbly arrow head", Component: LogoOption2 },
    { id: 3, name: "Organic Blob", description: "Smooth organic shape with soft pointer", Component: LogoOption3 },
    { id: 4, name: "Puffy Cloud", description: "Cloud-like stacked circles forming the curve", Component: LogoOption4 },
    { id: 5, name: "Gradient Taper", description: "Smooth tapered blob with purple gradient", Component: LogoOption5 },
    { id: 6, name: "Bold Bubble", description: "Simple thick blobby curve with clear arrow", Component: LogoOption6 },
  ]

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Set Check Logo Options</h1>
        <p className="text-muted-foreground mb-8">
          Blobby arrows emerging from the top pill, pointing to the third item. Click to preview at different sizes.
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
