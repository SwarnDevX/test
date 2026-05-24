import { BaseAgent } from './base'
import { StepResultSchema, type PlanStep, type StepResult } from '../types'
import { toolRegistry } from '../tools/registry'

const SYSTEM_PROMPT = `You are an execution agent for AgentFlow AI. You receive a single step from an execution plan and carry it out using available tools.

For each step, you must:
1. Analyze what the step requires
2. Call the appropriate tool if specified
3. Interpret the result
4. Return a structured JSON result

Output format (JSON only, no markdown):
{
  "stepId": "step_id",
  "success": true,
  "result": "Clear description of what was accomplished and key findings",
  "toolUsed": "tool_name or null",
  "toolParams": {},
  "toolOutput": "raw output summary",
  "reasoning": "Why you took this approach",
  "tokensUsed": 150,
  "error": null
}

Be precise. If a tool fails, set success to false and explain in error.`

export class ExecutorAgent extends BaseAgent {
  protected role = 'executor'
  protected model = 'gpt-4o'
  protected systemPrompt = SYSTEM_PROMPT

  async executeStep(
    step: PlanStep,
    previousResults: StepResult[],
    context: string,
  ): Promise<{ result: StepResult; tokens: number }> {
    // Execute tool directly if specified (more reliable than LLM deciding)
    if (step.tool && toolRegistry.has(step.tool)) {
      const toolResult = await toolRegistry.execute(step.tool, step.params as Record<string, unknown>)

      const result: StepResult = {
        stepId: step.id,
        success: toolResult.success,
        result: toolResult.success
          ? this.summarizeToolOutput(step.tool, toolResult.data)
          : `Tool failed: ${toolResult.error}`,
        toolUsed: step.tool,
        toolParams: step.params as Record<string, unknown>,
        toolOutput: toolResult.data,
        reasoning: `Executed ${step.tool} for: ${step.description}`,
        tokensUsed: 0,
        error: toolResult.error ?? null,
      }

      return { result, tokens: 0 }
    }

    // Use LLM for non-tool steps
    const previousContext = previousResults
      .slice(-3)
      .map((r) => `Step ${r.stepId}: ${r.result}`)
      .join('\n')

    const userContent = JSON.stringify({
      step,
      previousResults: previousContext,
      retrievedContext: context,
    })

    const { content, tokens } = await this.callLLM(
      [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userContent },
      ],
      { json: true, maxTokens: 800, temperature: 0.3 },
    )

    const parsed = this.safeParseJSON(content, StepResultSchema)

    const result: StepResult = parsed ?? {
      stepId: step.id,
      success: true,
      result: content.slice(0, 500),
      toolUsed: null,
      toolParams: {},
      reasoning: 'LLM-based execution',
      tokensUsed: tokens.prompt + tokens.completion,
      error: null,
    }

    return { result, tokens: tokens.prompt + tokens.completion }
  }

  private summarizeToolOutput(toolName: string, data: unknown): string {
    if (!data) return 'Tool returned no data'
    const d = data as Record<string, unknown>

    switch (toolName) {
      case 'search_knowledge_base':
        return d.context ? `Found ${(d.results as unknown[])?.length ?? 0} relevant passages from knowledge base.` : 'No relevant documents found.'
      case 'calculate':
        return `Calculation result: ${d.result}`
      case 'query_database':
        return `Retrieved ${d.count ?? 0} ${d.entity ?? 'records'} from database.`
      case 'generate_text':
        return typeof d.text === 'string' ? d.text.slice(0, 300) : 'Text generated.'
      case 'analyze_data':
        return `Analyzed ${d.recordCount ?? 0} records (${d.analysisType ?? 'summary'}).`
      default:
        return typeof data === 'string' ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    }
  }
}
