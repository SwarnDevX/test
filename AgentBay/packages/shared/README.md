# @agentbay/shared

Shared Zod schemas, `BaseError` hierarchy, constants, and utility functions used across all AgentBay packages and apps.

## Phase 2 exports

- `BaseError` and subclasses (`ValidationError`, `AuthError`, `PaymentError`, `AgentExecutionError`, `OnchainError`, `NotFoundError`, `RateLimitError`, `InternalError`)
- Zod schemas for all domain entities
- ULID generation helper
- API response shape types (`{ ok: true; data }` | `{ ok: false; error }`)

## Usage

```ts
import { BaseError, ValidationError } from '@agentbay/shared';
```
