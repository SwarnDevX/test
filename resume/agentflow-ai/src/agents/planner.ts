import { BaseAgent } from './base'
import { AgentPlanSchema, type AgentPlan, type AgentInput } from '../types'
import { toolRegistry } from '../tools/registry'

const SYSTEM_PROMPT = `You are a strategic planning agent for AgentFlow AI. Your job is to analyze user requests and decompose them into clear, executable steps.

You must output a JSON plan with this exact structure:
{
  "goal": "Clear statement of what needs to be achieved",
  "reasoning": "Your analysis of the request and approach",
  "steps": [
    {
      "id": "step_1",
      "type": "retrieve|execute|analyze|generate|validate|transform",
      "description": "Specific action for this step",
      "tool": "tool_name or null",
      "params": {},
      "dependencies": [],
      "estimatedTokens": 200
    }
  ],
  "expectedOutcome": "What success looks like",
  "riskFactors": ["potential issues"]
}

Rules:
- Always start with knowledge retrieval if the question might be answered from documents
- Use tools strategically — only when needed
- Keep steps concrete and actionable
- dependencies is an array of step IDs that must complete before this step
- Output ONLY valid JSON, no markdown`

export class PlannerAgent extends BaseAgent {
  protected role = 'planner'
  protected model = 'gpt-4o'
  protected systemPrompt = SYSTEM_PROMPT

  async plan(input: AgentInput): Promise<{ plan: AgentPlan; tokens: number }> {
    const toolSchemas = toolRegistry.getSchemas()

    const userContent = JSON.stringify({
      message: input.message,
      context: input.context ?? null,
      conversationHistory: input.history?.slice(-4) ?? [],
      availableTools: toolSchemas.map((t) => ({ name: t.name, description: t.description })),
    })

    const { content, tokens } = await this.callLLM(
      [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: userContent },
      ],
      { json: true, maxTokens: 1000, temperature: 0.2 },
    )

    const plan = this.parseJSON(content, AgentPlanSchema)
    return { plan, tokens: tokens.prompt + tokens.completion }
  }
}
