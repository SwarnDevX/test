'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MessageSquare, GitBranch, Database, BarChart3, Bug,
  Zap, ChevronLeft, ChevronRight, Settings,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/chat', label: 'AI Chat', icon: MessageSquare, color: 'text-violet-400' },
  { href: '/workflows', label: 'Workflows', icon: GitBranch, color: 'text-cyan-400' },
  { href: '/knowledge', label: 'Knowledge Base', icon: Database, color: 'text-emerald-400' },
  { href: '/observability', label: 'Observability', icon: BarChart3, color: 'text-amber-400' },
  { href: '/debug', label: 'Debug Panel', icon: Bug, color: 'text-rose-400' },
  { href: '/settings', label: 'Settings', icon: Settings, color: 'text-slate-400' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'fixed left-0 top-0 h-screen z-40 flex flex-col transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[64px]' : 'w-[220px]',
      )}
    >
      <div className="flex flex-col h-full m-2 mr-0 rounded-2xl overflow-hidden glass-strong">
        {/* Logo */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-5 border-b border-white/[0.06]',
          collapsed && 'justify-center px-0',
        )}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <div className="font-bold text-sm leading-tight">
                AgentFlow<span className="text-gradient"> AI</span>
              </div>
              <div className="text-[10px] text-white/30">Workflow Engine</div>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150',
                    collapsed && 'justify-center px-0',
                    isActive ? 'text-white' : 'text-white/40 hover:text-white/80',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-violet-500/10 border border-violet-500/20 rounded-xl"
                      transition={{ type: 'spring', bounce: 0.1, duration: 0.4 }}
                    />
                  )}
                  <item.icon
                    className={cn(
                      'w-4 h-4 relative z-10 shrink-0',
                      isActive ? item.color : 'inherit',
                    )}
                  />
                  {!collapsed && (
                    <span className="relative z-10 truncate">{item.label}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className={cn('ml-auto w-1 h-4 rounded-full relative z-10', {
                      'bg-violet-400': item.color.includes('violet'),
                      'bg-cyan-400': item.color.includes('cyan'),
                      'bg-emerald-400': item.color.includes('emerald'),
                      'bg-amber-400': item.color.includes('amber'),
                      'bg-rose-400': item.color.includes('rose'),
                    })} />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Status */}
        {!collapsed && (
          <div className="px-3 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="pulse-dot w-1.5 h-1.5" />
              <span className="text-[10px] text-emerald-400 font-medium">System Online</span>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div className={cn('px-2 py-3', !collapsed && 'border-t border-white/[0.06]')}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all text-xs',
            )}
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
