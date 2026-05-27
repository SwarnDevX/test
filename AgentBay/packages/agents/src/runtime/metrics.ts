import type { AnthropicModelId, RunMetrics, ToolCallRecord } from './types.js';

// ── Token pricing (USD per 1M tokens) ────────────────────────────────────────
// Keep in sync with Anthropic pricing page.

const PRICING_PER_M: Record<AnthropicModelId, { input: number; output: number }> = {
  'claude-opus-4-7': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 0.25, output: 1.25 },
};

export function calculateCost(
  model: AnthropicModelId,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = PRICING_PER_M[model];
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

// ── Mutable accumulator (per-run) ─────────────────────────────────────────────

export class MetricsAccumulator {
  private _inputTokens = 0;
  private _outputTokens = 0;
  private _steps = 0;
  private _toolCallLog: ToolCallRecord[] = [];
  private readonly _model: AnthropicModelId;
  private readonly _startMs: number;

  constructor(model: AnthropicModelId) {
    this._model = model;
    this._startMs = Date.now();
  }

  addUsage(inputTokens: number, outputTokens: number): void {
    this._inputTokens += inputTokens;
    this._outputTokens += outputTokens;
    this._steps++;
  }

  addToolCall(record: ToolCallRecord): void {
    this._toolCallLog.push(record);
  }

  finalise(): RunMetrics {
    return {
      totalInputTokens: this._inputTokens,
      totalOutputTokens: this._outputTokens,
      totalCostUsd: calculateCost(this._model, this._inputTokens, this._outputTokens),
      totalSteps: this._steps,
      totalDurationMs: Date.now() - this._startMs,
      toolCallLog: [...this._toolCallLog],
    };
  }
}
