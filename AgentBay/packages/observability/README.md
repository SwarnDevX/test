# @agentbay/observability

Structured logging (pino), distributed tracing (OpenTelemetry), error tracking (Sentry), and log shipping (Axiom) — initialized once and shared across all AgentBay services.

## Phase 2+ exports

- `createLogger(service)` — pino logger with JSON output, secret redaction
- `initTracer(service)` — OpenTelemetry SDK with OTLP exporter
- `initSentry(dsn, release)` — Sentry error tracking
- `withSpan(name, fn)` — wraps a function in an OTel span

## Usage

```ts
import { createLogger } from '@agentbay/observability';
const logger = createLogger('api');
logger.info({ requestId }, 'Request received');
```
