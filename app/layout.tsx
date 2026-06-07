import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _rubik = Rubik({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: 'Set Check - Free Collaborative Setlist Builder',
    template: '%s | Set Check',
  },
  description: 'Build setlists together with your band or worship team. Vote on songs, share ideas, and link to any music streaming service. 100% free, no account required.',
  keywords: ['setlist', 'setlist builder', 'collaborative playlist', 'band setlist', 'worship setlist', 'song voting', 'music collaboration', 'free setlist app'],
  authors: [{ name: 'Category 5' }],
  creator: 'Category 5',
  publisher: 'Category 5',
  generator: 'v0.app',
  metadataBase: new URL('https://setcheck.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Set Check',
    title: 'Set Check - Free Collaborative Setlist Builder',
    description: 'Build setlists together with your band or worship team. Vote on songs, share ideas, and link to any music streaming service. 100% free, no account required.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Set Check - Free Collaborative Setlist Builder',
    description: 'Build setlists together with your band or worship team. Vote on songs, share ideas, and link to any music streaming service.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="setcheck-theme"
        >
          {children}
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
