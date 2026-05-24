import type { Metadata, Viewport } from 'next'
import { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentFlow AI – Autonomous Business Workflow Engine',
  description: 'Production-grade multi-agent AI system with RAG, workflow automation, and full observability',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#070714] text-white overflow-x-hidden antialiased">
        {/* Ambient background */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c2a] via-[#07060f] to-[#030208]" />
          {/* Violet glow top-left */}
          <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-violet-700/10 rounded-full blur-[140px]" />
          {/* Cyan glow bottom-right */}
          <div className="absolute -bottom-32 -right-16 w-[600px] h-[600px] bg-cyan-500/6 rounded-full blur-[120px]" />
          {/* Emerald glow mid */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-900/5 rounded-full blur-[100px]" />
          {/* Grid */}
          <div className="absolute inset-0 grid-bg opacity-70" />
        </div>
        <div className="relative z-0 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}
