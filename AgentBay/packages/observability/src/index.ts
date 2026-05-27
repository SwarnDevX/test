// @agentbay/observability — structured logging, Sentry error tracking, OTEL tracing.
// Call initSentry() and initTracing() before any other app imports for best coverage.
import pino, { type Logger } from 'pino';
import * as Sentry from '@sentry/node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Axiom } from '@axiomhq/js';

// ── Logger ────────────────────────────────────────────────────────────────────

interface LoggerOptions {
  redact?: string[];
  level?: string;
}

interface AxiomSink {
  write(chunk: string): void;
}

function buildAxiomSink(service: string): AxiomSink | null {
  const token = process.env['AXIOM_TOKEN'];
  const dataset = process.env['AXIOM_DATASET'] ?? 'agentbay';
  if (!token) return null;

  const client = new Axiom({ token });
  const buffer: Array<Record<string, unknown>> = [];

  const timer = setInterval(() => {
    if (buffer.length === 0) return;
    const batch = buffer.splice(0);
    client.ingest(dataset, batch).catch(() => undefined);
  }, 5_000);
  timer.unref();

  return {
    write(chunk: string) {
      try {
        const entry = JSON.parse(chunk) as Record<string, unknown>;
        buffer.push({ ...entry, service, _time: new Date().toISOString() });
      } catch {
        // malformed JSON from pino — skip
      }
    },
  };
}

export function createLogger(service: string, opts?: LoggerOptions): Logger {
  const isProd = process.env['NODE_ENV'] === 'production';
  const level = opts?.level ?? process.env['LOG_LEVEL'] ?? (isProd ? 'info' : 'debug');
  const redact = opts?.redact ?? [
    'req.headers.authorization',
    'req.headers.cookie',
    'password',
    'secret',
    'token',
  ];

  if (!isProd) {
    return pino({
      name: service,
      level,
      redact,
      transport: { target: 'pino-pretty', options: { colorize: true, singleLine: false } },
    });
  }

  const axiomSink = buildAxiomSink(service);
  if (axiomSink) {
    const streams = pino.multistream([{ stream: process.stdout }, { stream: axiomSink }]);
    return pino({ name: service, level, redact }, streams);
  }

  return pino({ name: service, level, redact });
}

// ── Sentry ────────────────────────────────────────────────────────────────────

export interface SentryOptions {
  service: string;
  dsn?: string;
  release?: string;
  environment?: string;
}

export function initSentry(options: SentryOptions): void {
  const dsn = options.dsn ?? process.env['SENTRY_DSN'];
  if (!dsn) return;

  Sentry.init({
    dsn,
    release:
      options.release ??
      process.env['RAILWAY_GIT_COMMIT_SHA'] ??
      process.env['GIT_SHA'] ??
      'unknown',
    environment: options.environment ?? process.env['NODE_ENV'] ?? 'development',
    // Low sample rate in production — traces are expensive; errors are always captured
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.05 : 1.0,
    // Disable Sentry console breadcrumbs to prevent log loops
    integrations: (integrations) => integrations.filter((i) => i.name !== 'Console'),
  });
}

export { Sentry };

// ── OpenTelemetry ─────────────────────────────────────────────────────────────

let _otelSdk: NodeSDK | null = null;

export function initTracing(service: string): void {
  const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
  if (!endpoint) return;

  _otelSdk = new NodeSDK({
    serviceName: service,
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable file system instrumentation — too noisy
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  _otelSdk.start();

  process.on('SIGTERM', () => {
    _otelSdk?.shutdown().catch(() => undefined);
  });
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export type { Logger };
