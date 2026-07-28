import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Matches the live static site's stack ('Inter', system-ui, sans-serif), but
// self-hosted by next/font instead of pulled from Google's CDN at runtime.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://getbrandgeo.com'),
  // PREVIEW BUILD — keep this until the migration actually replaces
  // getbrandgeo.com. A public copy of the homepage on a *.netlify.app domain is
  // crawlable, and duplicate homepage copy competing with the real site is the
  // last thing a business built on content ranking needs. Delete this block on
  // the cutover deploy, not before.
  robots: { index: false, follow: false, nocache: true },
  title: 'BrandGEO — AI Visibility Intelligence for Web2 & Web3',
  description:
    'See how visible your brand is across ChatGPT, Gemini, Claude, Perplexity, Google AI Mode, and decentralized AI engines. BrandGEO monitors, scores, and tracks your AI presence.',
  openGraph: {
    type: 'website',
    siteName: 'BrandGEO',
    title: 'BrandGEO — AI Visibility Intelligence for Web2 & Web3',
    description:
      'Check your domain instantly. See what top AI models and decentralized knowledge engines display when customers ask.',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
