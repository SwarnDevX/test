// FlowForge Motion System
// spring-y but never bouncy — cubic-bezier(0.32, 0.72, 0, 1)

export const ease = {
  spring: [0.32, 0.72, 0, 1] as const,
  springFast: [0.32, 0.72, 0, 1] as const,
  out: [0.0, 0.0, 0.2, 1.0] as const,
  in: [0.4, 0.0, 1.0, 1.0] as const,
  inOut: [0.4, 0.0, 0.2, 1.0] as const,
} as const;

export const duration = {
  instant: 0,
  fast: 0.15,
  base: 0.20,
  slow: 0.35,
  slower: 0.50,
} as const;

export const transitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: duration.fast, ease: ease.out },
  },
  slideUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 4 },
    transition: { duration: duration.base, ease: ease.spring },
  },
  slideDown: {
    initial: { opacity: 0, y: -8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -4 },
    transition: { duration: duration.base, ease: ease.spring },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: duration.fast, ease: ease.spring },
  },
  drawer: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
    transition: { duration: duration.base, ease: ease.spring },
  },
  nodeHover: {
    transition: { duration: duration.fast, ease: ease.spring },
  },
} as const;

export const reducedMotion = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.01 },
  },
  none: {
    initial: {},
    animate: {},
    exit: {},
    transition: { duration: 0 },
  },
};
