// Targets: ai@4.3.x, @ai-sdk/anthropic@1.2.x, @modelcontextprotocol/sdk@1.12.x
import { streamText, type ToolSet, type CoreMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { tool } from 'ai';
import { z } from 'zod';
import { MetricsAccumulator } from './metrics.js';
import type {
  AgentConfig,
  AgentInput,
  AgentResult,
  AgentStreamEvent,
  McpServerConfig,
  ToolCallRecord,
} from './types.js';

export class AgentRuntime {
  private readonly config: AgentConfig;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  // ── Public: streaming execution ─────────────────────────────────────────────

  async *stream(input: AgentInput): AsyncGenerator<AgentStreamEvent> {
    const tools = await this.buildToolSet();
    const acc = new MetricsAccumulator(this.config.model);
    const systemPrompt = this.buildSystemPrompt(input.context);

    const result = streamText({
      model: anthropic(this.config.model),
      system: systemPrompt,
      messages: input.messages,
      tools,
      maxSteps: this.config.maxSteps ?? 20,
      temperature: this.config.temperature,
    });

    let stepIndex = 0;
    const pendingToolCalls = new Map<string, { name: string; args: unknown; startMs: number }>();

    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'text-delta':
          yield { type: 'text-delta', delta: part.textDelta };
          break;

        case 'tool-call':
          pendingToolCalls.set(part.toolCallId, {
            name: part.toolName,
            args: part.args,
            startMs: Date.now(),
          });
          yield {
            type: 'tool-call',
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            args: part.args,
          };
          break;

        case 'tool-result': {
          const pending = pendingToolCalls.get(part.toolCallId);
          const durationMs = pending ? Date.now() - pending.startMs : 0;
          pendingToolCalls.delete(part.toolCallId);

          const record: ToolCallRecord = {
            toolName: part.toolName,
            args: pending?.args ?? {},
            result: part.result,
            durationMs,
            stepIndex,
          };
          acc.addToolCall(record);

          yield {
            type: 'tool-result',
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            result: part.result,
            durationMs,
          };
          break;
        }

        case 'step-finish': {
          const usage = part.usage;
          acc.addUsage(usage.promptTokens, usage.completionTokens);
          yield {
            type: 'step-finish',
            stepIndex,
            inputTokens: usage.promptTokens,
            outputTokens: usage.completionTokens,
          };
          stepIndex++;
          break;
        }

        case 'finish': {
          const metrics = acc.finalise();
          yield {
            type: 'finish',
            output: part.text ?? '',
            finishReason: part.finishReason,
            metrics,
          };
          break;
        }

        default:
          // Ignore: 'error', 'reasoning', etc.
          break;
      }
    }
  }

  // ── Public: non-streaming (collects full stream) ────────────────────────────

  async execute(input: AgentInput): Promise<AgentResult> {
    let finalOutput = '';
    let finalFinishReason = 'unknown';
    let finalMetrics = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCostUsd: 0,
      totalSteps: 0,
      totalDurationMs: 0,
      toolCallLog: [] as ToolCallRecord[],
    };

    for await (const event of this.stream(input)) {
      if (event.type === 'text-delta') {
        finalOutput += event.delta;
      } else if (event.type === 'finish') {
        finalOutput = event.output;
        finalFinishReason = event.finishReason;
        finalMetrics = event.metrics;
      }
    }

    return {
      taskId: input.taskId,
      output: finalOutput,
      toolCallLog: finalMetrics.toolCallLog,
      metrics: finalMetrics,
      finishReason: finalFinishReason,
    };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private buildSystemPrompt(context?: string): string {
    let prompt = this.config.systemPrompt;
    if (context) {
      prompt += `\n\n---\n**Task context:**\n${context}`;
    }
    return prompt;
  }

  private async buildToolSet(): Promise<ToolSet> {
    const builtins = this.config.tools;
    if (!this.config.mcpServers || this.config.mcpServers.length === 0) {
      return builtins;
    }

    const mcpTools = await this.connectMcpServers(this.config.mcpServers);
    return { ...builtins, ...mcpTools };
  }

  // Connects to all configured MCP servers and converts their tools to AI SDK format.
  // A failed MCP connection is logged but does not abort the run.
  private async connectMcpServers(servers: McpServerConfig[]): Promise<ToolSet> {
    const results = await Promise.allSettled(
      servers.map((server) => this.connectMcpServer(server)),
    );

    const merged: ToolSet = {};
    for (const result of results) {
      if (result.status === 'fulfilled') {
        Object.assign(merged, result.value);
      } else {
        process.stderr.write(`MCP connect failed: ${String(result.reason)}\n`);
      }
    }
    return merged;
  }

  private async connectMcpServer(config: McpServerConfig): Promise<ToolSet> {
    const client = new Client({ name: 'agentbay-runtime', version: '1.0.0' });
    const transport = new SSEClientTransport(new URL(config.url));
    await client.connect(transport);

    const { tools: mcpTools } = await client.listTools();
    const toolSet: ToolSet = {};

    for (const mcpTool of mcpTools) {
      const toolName = `${config.name}_${mcpTool.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
      const description = mcpTool.description ?? `${config.name}: ${mcpTool.name}`;

      toolSet[toolName] = tool({
        description,
        // MCP provides JSON Schema; AI SDK needs Zod. Use z.record to accept any args —
        // the MCP server validates the actual schema on its side.
        parameters: z.record(z.unknown()),
        execute: async (args): Promise<unknown> => {
          const result = await client.callTool({
            name: mcpTool.name,
            arguments: args as Record<string, unknown>,
          });
          // Flatten content array to a string if text-only
          if (Array.isArray(result.content)) {
            return result.content
              .map((c) => (typeof c === 'object' && c !== null && 'text' in c ? String((c as { text: unknown }).text) : JSON.stringify(c)))
              .join('\n');
          }
          return result.content;
        },
      });
    }

    return toolSet;
  }
}
