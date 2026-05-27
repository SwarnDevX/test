import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
      colors: {
        bg: {
          base: "oklch(var(--bg-base) / <alpha-value>)",
          surface: {
            1: "oklch(var(--bg-surface-1) / <alpha-value>)",
            2: "oklch(var(--bg-surface-2) / <alpha-value>)",
            3: "oklch(var(--bg-surface-3) / <alpha-value>)",
            4: "oklch(var(--bg-surface-4) / <alpha-value>)",
            5: "oklch(var(--bg-surface-5) / <alpha-value>)",
            6: "oklch(var(--bg-surface-6) / <alpha-value>)",
          },
        },
        border: "oklch(var(--border) / <alpha-value>)",
        fg: {
          DEFAULT: "oklch(var(--fg) / <alpha-value>)",
          muted: "oklch(var(--fg-muted) / <alpha-value>)",
          subtle: "oklch(var(--fg-subtle) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          hover: "oklch(var(--accent-hover) / <alpha-value>)",
          muted: "oklch(var(--accent-muted) / <alpha-value>)",
        },
        success: "oklch(var(--success) / <alpha-value>)",
        warning: "oklch(var(--warning) / <alpha-value>)",
        danger: "oklch(var(--danger) / <alpha-value>)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "10px",
        xl: "14px",
      },
      boxShadow: {
        sm: "0 1px 2px oklch(0 0 0 / 0.12), inset 0 1px 0 oklch(1 0 0 / 0.04)",
        DEFAULT: "0 2px 8px oklch(0 0 0 / 0.16), 0 1px 2px oklch(0 0 0 / 0.08), inset 0 1px 0 oklch(1 0 0 / 0.04)",
        md: "0 4px 16px oklch(0 0 0 / 0.20), 0 2px 4px oklch(0 0 0 / 0.10), inset 0 1px 0 oklch(1 0 0 / 0.05)",
        lg: "0 8px 32px oklch(0 0 0 / 0.24), 0 4px 8px oklch(0 0 0 / 0.12), inset 0 1px 0 oklch(1 0 0 / 0.06)",
        glow: "0 0 24px oklch(var(--accent) / 0.25)",
        "glow-success": "0 0 24px oklch(var(--success) / 0.25)",
        "glow-danger": "0 0 24px oklch(var(--danger) / 0.25)",
      },
      animation: {
        "slide-up": "slide-up 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
        "slide-down": "slide-down 0.2s cubic-bezier(0.32, 0.72, 0, 1)",
        "fade-in": "fade-in 0.15s ease",
        "scale-in": "scale-in 0.15s cubic-bezier(0.32, 0.72, 0, 1)",
        "pulse-port": "pulse-port 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "flow-particle": "flow-particle 2s linear infinite",
        shimmer: "shimmer 1.5s linear infinite",
      },
      keyframes: {
        "slide-up": {
          from: { transform: "translateY(8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "pulse-port": {
          "0%, 100%": { boxShadow: "0 0 0 0 oklch(var(--accent) / 0.4)" },
          "50%": { boxShadow: "0 0 0 6px oklch(var(--accent) / 0)" },
        },
        "flow-particle": {
          from: { strokeDashoffset: "100%" },
          to: { strokeDashoffset: "0%" },
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" },
        },
      },
      backgroundImage: {
        "canvas-dots": "radial-gradient(circle, oklch(var(--fg) / 0.08) 1px, transparent 1px)",
        "noise": "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
        shimmer: "linear-gradient(90deg, transparent 0%, oklch(var(--bg-surface-2)) 50%, transparent 100%)",
      },
    },
  },
  plugins: [animate],
};

export default config;
