'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  error?: string
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ prefix, suffix, error, label, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <div
              className="absolute left-3 flex items-center pointer-events-none"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {prefix}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full rounded-xl px-3 py-2.5 text-sm',
              'border outline-none',
              'placeholder:text-[var(--text-tertiary)]',
              'focus-visible:ring-2 focus-visible:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-colors duration-150',
              prefix && 'pl-9',
              suffix && 'pr-9',
              className
            )}
            style={{
              backgroundColor: 'var(--surface-2)',
              color: 'var(--text-primary)',
              borderColor: error ? 'var(--danger)' : 'var(--border-default)',
              // @ts-expect-error CSS custom property
              '--tw-ring-color': 'var(--accent)',
              '--tw-ring-offset-color': 'var(--bg-base)',
            }}
            {...props}
          />
          {suffix && (
            <div
              className="absolute right-3 flex items-center pointer-events-none"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {suffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
