import { BaseAgent } from './base'
import { ValidationResultSchema, type ValidationResult, type AgentPlan, type StepResult } from '../types'

const SYSTEM_PROMPT = `You are a validation agent for AgentFlow AI. You review execution results and produce a polished final response.

Given the original user message, the execution plan, and all step results, you must:
1. Assess quality and accuracy
2. Identify any gaps or issues
3. Compose a clear, helpful final response for the user
4. Score confidence and quality

Output format (JSON only, no markdown):
{
  "isValid": true,
  "confidence": 0.87,
  "qualityScore": 0.92,
  "issues": [],
  "refinements": ["optional suggestions for improvement"],
  "finalResponse": "The polished response to present to the user. Use markdown for formatting.",
  "summary": "One-sentence summary of what was accomplished",
  "tokensUsed": 200
}

Scoring guide:
- confidence: 0-1, how certain you are the response is correct
- qualityScore: 0-1, how complete and well-structured the response is
- finalResponse: Should be comprehensive and formatted nicely with markdown

Never expose internal tool names or step IDs in finalResponse.`

export class ValidatorAgent extends BaseAgent {
  protected role = 'validator'
  protected model = 'gpt-4o'
  protected systemPrompt = SYSTEM_PROMPT

  async validate(
    originalMessage: string,
    plan: AgentPlan,
    results: StepResult[],
  ): Promise<{ validation: ValidationResult; tokens: number }> {
    const successfulResults = results.filter((r) => r.success)
    const context = successfulResults.map((r) => `${r.reasoning}:\n${r.result}`).join('\n\n')

    const userContent = JSON.stringify({
      originalMessage,
      planGoal: plan.goal,
      executionResults: successfulResults.map((r) => ({
        step: r.stepId,
        result: r.result.slice(0, 400),
        toolUsed: r.toolUsed,
      })),
      failedSteps: results.filter((r) => !r.success).map((r) => r.stepId),
      context: context.slice(0, 2000),
    })

    const { content, tokens } = await this.callLLM(
      [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userContent },
      ],
      { json: true, maxTokens: 1200, temperature: 0.2 },
    )

    const parsed = this.safeParseJSON(content, ValidationResultSchema)

    const validation: ValidationResult = parsed ?? {
      isValid: true,
      confidence: 0.75,
      qualityScore: 0.75,
      issues: [],
      refinements: [],
      finalResponse: context || 'I processed your request but could not generate a detailed response.',
      summary: 'Request processed.',
      tokensUsed: tokens.prompt + tokens.completion,
    }

    return { validation, tokens: tokens.prompt + tokens.completion }
  }
}
