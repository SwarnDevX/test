import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'FreightShield — Carrier Compliance OS',
    template: '%s | FreightShield',
  },
  description:
    'Stop chameleon carriers in 30 seconds, not 30 minutes. Carrier vetting, continuous compliance monitoring, and fraud detection for U.S. freight brokerages.',
  keywords: ['freight broker', 'carrier vetting', 'FMCSA', 'compliance', 'carrier411 alternative'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable}`}
      >
        <body style={{ fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
