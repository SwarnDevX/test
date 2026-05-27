# @agentbay/ui

Shared shadcn/ui component library and Tailwind v4 theme tokens for AgentBay's web app.

Dark-first design with a neutral palette and a single accent color. All components are built with `class-variance-authority` (CVA) for type-safe variant props.

## Phase 8 exports

- shadcn/ui primitives (Button, Card, Dialog, Input, Badge, Skeleton, etc.)
- `cn(...classes)` utility (`clsx` + `tailwind-merge`)
- Theme tokens (CSS custom properties for the dark-first palette)

## Usage

```ts
import { Button, cn } from '@agentbay/ui';
```
