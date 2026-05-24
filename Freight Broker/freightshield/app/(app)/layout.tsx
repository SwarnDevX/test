import { AppSidebar } from '@/components/feature/app-sidebar'
import { AppTopBar } from '@/components/feature/app-topbar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left rail */}
      <AppSidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <AppTopBar />

        {/* Scrollable content */}
        <main
          className="flex-1 overflow-auto p-8"
          style={{ maxWidth: '1440px', width: '100%', margin: '0 auto' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
