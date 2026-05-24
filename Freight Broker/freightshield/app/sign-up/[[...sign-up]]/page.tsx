import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <SignUp
        appearance={{
          variables: {
            colorBackground: 'rgba(10, 13, 20, 0.95)',
            colorText: 'var(--text-primary)',
            colorTextSecondary: 'var(--text-secondary)',
            colorPrimary: 'var(--accent)',
            colorInputBackground: 'rgba(255,255,255,0.05)',
            colorInputText: 'var(--text-primary)',
            borderRadius: '12px',
          },
          elements: {
            card: 'shadow-none bg-transparent',
            rootBox: 'w-full max-w-sm',
          },
        }}
      />
    </div>
  )
}
