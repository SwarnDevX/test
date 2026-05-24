'use client'

import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-xl font-medium text-sm',
    'border outline-none',
    'transition-all duration-200 ease-out',
    'focus-visible:ring-2 focus-visible:ring-offset-0',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    'select-none',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: 'text-[#07090d]',
        secondary: '',
        ghost: 'border-transparent',
        danger: '',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

const variantInlineStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
    borderColor: 'transparent',
    color: '#07090d',
    boxShadow: '0 0 20px -4px var(--accent-glow)',
  },
  secondary: {
    backgroundColor: 'var(--surface-2)',
    borderColor: 'var(--border-default)',
    color: 'var(--text-primary)',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: 'var(--text-secondary)',
  },
  danger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    color: 'var(--critical)',
  },
}

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  children: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        style={variantInlineStyles[variant ?? 'primary']}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
