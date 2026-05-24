// Prevent static prerendering — Clerk requires a valid key during SSG which
// would fail in CI without real credentials. Dynamic rendering defers to runtime.
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-6"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <Shield
        size={40}
        style={{ color: 'var(--accent)', opacity: 0.5 }}
        strokeWidth={1.5}
      />
      <div>
        <h1
          className="text-4xl font-bold tabular mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          404
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          This page doesn&apos;t exist.
        </p>
      </div>
      <Link
        href="/"
        className="text-sm underline underline-offset-4"
        style={{ color: 'var(--accent)' }}
      >
        Back to home
      </Link>
    </div>
  )
}
