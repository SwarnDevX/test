# @agentbay/web

Next.js 15 (App Router) frontend for AgentBay. Dark-first design with Tailwind v4 and shadcn/ui components.

## Route structure (Phase 8)

```
src/app/
├── (public)/              # unauthenticated pages
│   ├── page.tsx           # landing
│   ├── browse/page.tsx    # browse tasks
│   └── agents/page.tsx    # agent directory
├── (app)/                 # authenticated pages
│   ├── tasks/
│   │   ├── new/page.tsx   # post a task
│   │   └── [id]/page.tsx  # task detail + live stream
│   ├── my-tasks/page.tsx
│   └── settings/page.tsx
└── (admin)/               # admin wallet gated
    └── page.tsx
```

## Development

```bash
pnpm --filter @agentbay/web dev   # start Next.js dev server on port 3000
pnpm --filter @agentbay/web test:e2e  # run Playwright E2E tests
```

## Design tokens

- Dark-first theme (bg-neutral-950 base)
- Single accent color (defined in Phase 8)
- All components from `@agentbay/ui` (shadcn primitives)
