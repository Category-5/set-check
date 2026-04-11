"use client"

import { useState } from "react"

// Variation 1: Organic blob with gradient, southwest-pointing arrowhead
function LogoOption1({ size = 120 }: { size?: number }) {
  const gradientId = `blobGradient1-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
      </defs>
      
      {/* Three pill/capsule items */}
      <rect x="12" y="20" rx="12" ry="12" width="48" height="22" fill="#A855F7" />
      <rect x="12" y="50" rx="12" ry="12" width="48" height="22" fill="#C084FC" />
      <rect x="12" y="80" rx="12" ry="12" width="48" height="22" fill="#E9D5FF" />
      
      {/* Organic blob arrow emerging from top pill */}
      <path
        d="M60 24 C70 20 85 28 92 45 C98 62 90 78 75 88 C72 90 68 92 65 93 C60 95 56 92 58 88 C62 82 70 76 76 65 C82 54 80 42 72 34 C66 28 60 28 58 30 C54 32 54 26 60 24 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Southwest-pointing blobby arrowhead */}
      <ellipse cx="58" cy="95" rx="8" ry="5" fill="#E9D5FF" transform="rotate(-25 58 95)" />
      <path
        d="M50 90 Q48 102 58 100 Q52 98 50 90 Z"
        fill="#E9D5FF"
      />
    </svg>
  )
}

// Variation 2: Thicker organic blob with bold gradient and clear SW arrow
function LogoOption2({ size = 120 }: { size?: number }) {
  const gradientId = `blobGradient2-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="80%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#D8B4FE" />
        </linearGradient>
      </defs>
      
      {/* Three pill/capsule items */}
      <rect x="12" y="20" rx="12" ry="12" width="48" height="22" fill="#A855F7" />
      <rect x="12" y="50" rx="12" ry="12" width="48" height="22" fill="#C084FC" />
      <rect x="12" y="80" rx="12" ry="12" width="48" height="22" fill="#E9D5FF" />
      
      {/* Thicker organic blob emerging from top pill */}
      <path
        d="M62 22 C75 18 92 30 96 50 C100 70 88 85 70 92 C65 94 58 94 55 90 C52 86 56 82 62 78 C74 70 82 58 78 44 C74 32 64 28 58 30 C52 32 52 26 62 22 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Southwest-pointing blobby arrowhead */}
      <ellipse cx="52" cy="94" rx="10" ry="6" fill="#D8B4FE" transform="rotate(-30 52 94)" />
      <path
        d="M42 88 C38 96 44 104 52 100 C46 100 42 95 42 88 Z"
        fill="#D8B4FE"
      />
    </svg>
  )
}

// Variation 3: Smooth flowing blob with subtle gradient and rounded SW tip
function LogoOption3({ size = 120 }: { size?: number }) {
  const gradientId = `blobGradient3-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="70%" y1="10%" x2="30%" y2="90%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>
      
      {/* Three pill/capsule items */}
      <rect x="12" y="20" rx="12" ry="12" width="48" height="22" fill="#A855F7" />
      <rect x="12" y="50" rx="12" ry="12" width="48" height="22" fill="#C084FC" />
      <rect x="12" y="80" rx="12" ry="12" width="48" height="22" fill="#E9D5FF" />
      
      {/* Smooth flowing organic blob */}
      <path
        d="M60 23 C72 19 88 28 94 48 C99 68 88 84 72 92 L62 96 C56 98 52 94 56 88 C60 82 70 74 76 60 C81 48 76 36 66 30 C58 26 56 28 60 23 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Southwest blobby arrow tip */}
      <circle cx="54" cy="94" r="7" fill="#C084FC" />
      <ellipse cx="48" cy="98" rx="5" ry="4" fill="#C084FC" transform="rotate(-40 48 98)" />
    </svg>
  )
}

// Variation 4: Tapered blob with vivid gradient and distinct SW arrow
function LogoOption4({ size = 120 }: { size?: number }) {
  const gradientId = `blobGradient4-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#E9D5FF" />
        </linearGradient>
      </defs>
      
      {/* Three pill/capsule items */}
      <rect x="12" y="20" rx="12" ry="12" width="48" height="22" fill="#A855F7" />
      <rect x="12" y="50" rx="12" ry="12" width="48" height="22" fill="#C084FC" />
      <rect x="12" y="80" rx="12" ry="12" width="48" height="22" fill="#E9D5FF" />
      
      {/* Tapered organic blob */}
      <path
        d="M62 22 C76 18 94 32 96 55 C98 75 84 88 66 94 C60 96 54 94 54 88 C54 82 64 78 74 68 C84 56 84 42 74 32 C66 24 58 26 58 28 C54 30 54 24 62 22 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Clear southwest-pointing arrowhead */}
      <path
        d="M54 88 C50 88 44 92 42 98 C44 96 48 94 54 94 C52 92 52 90 54 88 Z"
        fill="#E9D5FF"
      />
      <ellipse cx="46" cy="96" rx="6" ry="5" fill="#E9D5FF" transform="rotate(-35 46 96)" />
    </svg>
  )
}

// Variation 5: Bubbly blob with soft pastel gradient and friendly SW tip
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
        <linearGradient id={gradientId} x1="90%" y1="10%" x2="10%" y2="90%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="60%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#F3E8FF" />
        </linearGradient>
      </defs>
      
      {/* Three pill/capsule items */}
      <rect x="12" y="20" rx="12" ry="12" width="48" height="22" fill="#A855F7" />
      <rect x="12" y="50" rx="12" ry="12" width="48" height="22" fill="#C084FC" />
      <rect x="12" y="80" rx="12" ry="12" width="48" height="22" fill="#E9D5FF" />
      
      {/* Bubbly organic blob */}
      <path
        d="M58 24 C68 20 86 26 92 46 C97 66 86 82 68 92 C62 95 56 94 55 88 C54 82 62 76 72 66 C82 54 82 40 72 32 C64 26 56 28 56 30 C52 32 52 26 58 24 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Friendly bubbly SW arrowhead */}
      <circle cx="52" cy="92" r="6" fill="#F3E8FF" />
      <circle cx="44" cy="98" r="5" fill="#F3E8FF" />
      <circle cx="38" cy="102" r="3" fill="#F3E8FF" />
    </svg>
  )
}

// Variation 6: Bold blob with deep gradient and chunky SW arrow
function LogoOption6({ size = 120 }: { size?: number }) {
  const gradientId = `blobGradient6-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
      </defs>
      
      {/* Three pill/capsule items */}
      <rect x="12" y="20" rx="12" ry="12" width="48" height="22" fill="#A855F7" />
      <rect x="12" y="50" rx="12" ry="12" width="48" height="22" fill="#C084FC" />
      <rect x="12" y="80" rx="12" ry="12" width="48" height="22" fill="#E9D5FF" />
      
      {/* Bold thick organic blob */}
      <path
        d="M60 20 C78 16 98 34 98 56 C98 78 82 92 60 96 C52 97 48 92 52 86 C58 78 72 72 80 58 C86 46 80 32 68 28 C58 24 54 28 56 32 C50 34 50 24 60 20 Z"
        fill={`url(#${gradientId})`}
      />
      {/* Chunky southwest-pointing arrowhead */}
      <ellipse cx="50" cy="94" rx="9" ry="6" fill="#DDD6FE" transform="rotate(-30 50 94)" />
      <ellipse cx="42" cy="100" rx="7" ry="5" fill="#DDD6FE" transform="rotate(-40 42 100)" />
      <circle cx="36" cy="104" r="4" fill="#DDD6FE" />
    </svg>
  )
}

export default function LogoOptionsPage() {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

  const logos = [
    { id: 1, name: "Soft Gradient", description: "Organic blob with purple-to-lavender gradient, SW arrow", Component: LogoOption1 },
    { id: 2, name: "Bold Flow", description: "Thicker blob with three-stop gradient, clear SW tip", Component: LogoOption2 },
    { id: 3, name: "Smooth Stream", description: "Flowing blob with subtle gradient, rounded SW point", Component: LogoOption3 },
    { id: 4, name: "Vivid Taper", description: "Tapered blob with vivid violet gradient, distinct SW arrow", Component: LogoOption4 },
    { id: 5, name: "Bubbly Trail", description: "Soft pastel gradient with bubbly SW arrow trail", Component: LogoOption5 },
    { id: 6, name: "Deep Chunk", description: "Bold deep gradient with chunky cascading SW tip", Component: LogoOption6 },
  ]

  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Set Check Logo Options</h1>
        <p className="text-muted-foreground mb-8">
          Organic blob arrows with gradients, emerging from the top pill and pointing southwest toward the third item.
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
