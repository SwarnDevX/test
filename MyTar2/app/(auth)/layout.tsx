import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#07071a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40, textDecoration: 'none' }}>
        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={20} color="white" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, color: '#f0f0ff', letterSpacing: '-0.02em' }}>
          AdCreative<span style={{ color: '#8b5cf6' }}>AI</span>
        </span>
      </Link>

      <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        {children}
      </div>
    </div>
  );
}
