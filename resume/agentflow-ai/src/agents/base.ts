import type { ZodSchema } from 'zod'
import { obsTracker } from '../observability/tracker'

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export abstract class BaseAgent {
  protected abstract role: string
  protected abstract model: string
  protected abstract systemPrompt: string

  protected async callLLM(
    messages: LLMMessage[],
    options: { json?: boolean; maxTokens?: number; temperature?: number } = {},
  ): Promise<{ content: string; tokens: { prompt: number; completion: number } }> {
    const { json = false, maxTokens = 1500, temperature = 0.3 } = options
    const start = Date.now()

    if (!process.env.OPENAI_API_KEY) {
      return this.demoResponse(messages, json)
    }

    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.chat.completions.create({
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    })

    const content = response.choices[0]?.message?.content ?? ''
    const tokens = {
      prompt: response.usage?.prompt_tokens ?? 0,
      completion: response.usage?.completion_tokens ?? 0,
    }

    await obsTracker.record({
      eventType: 'agent_step',
      agent: this.role,
      model: this.model,
      tokens: tokens.prompt + tokens.completion,
      latencyMs: Date.now() - start,
      cost: obsTracker.estimateCost(this.model, tokens.prompt, tokens.completion),
    })

    return { content, tokens }
  }

  protected parseJSON<T>(content: string, schema: ZodSchema<T>): T {
    const cleaned = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    const raw = JSON.parse(cleaned)
    return schema.parse(raw)
  }

  protected safeParseJSON<T>(content: string, schema: ZodSchema<T>): T | null {
    try {
      return this.parseJSON(content, schema)
    } catch {
      return null
    }
  }

  // Realistic demo responses for each agent role (no API key needed)
  private async demoResponse(
    messages: LLMMessage[],
    json: boolean,
  ): Promise<{ content: string; tokens: { prompt: number; completion: number } }> {
    await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))

    const userMsg = messages.find((m) => m.role === 'user')?.content ?? ''

    if (!json) {
      return {
        content: `[Demo] This is a simulated ${this.role} response. Add OPENAI_API_KEY for real AI.`,
        tokens: { prompt: 120, completion: 45 },
      }
    }

    // Role-specific demo JSON
    if (this.role === 'planner') {
      return {
        content: JSON.stringify({
          goal: `Process and respond to: ${userMsg.slice(0, 60)}...`,
          reasoning: 'This request requires knowledge retrieval and generation.',
          steps: [
            { id: 'step_1', type: 'retrieve', description: 'Search knowledge base for relevant context', tool: 'search_knowledge_base', params: { query: userMsg.slice(0, 80) }, dependencies: [], estimatedTokens: 100 },
            { id: 'step_2', type: 'generate', description: 'Generate comprehensive response using context', tool: 'generate_text', params: { prompt: 'Answer based on retrieved context' }, dependencies: ['step_1'], estimatedTokens: 300 },
          ],
          expectedOutcome: 'A helpful, accurate response based on available knowledge',
          riskFactors: ['Limited knowledge base coverage'],
        }),
        tokens: { prompt: 180, completion: 220 },
      }
    }

    if (this.role === 'executor') {
      return {
        content: JSON.stringify({
          stepId: 'step_1',
          success: true,
          result: 'Retrieved relevant context from knowledge base.',
          toolUsed: 'search_knowledge_base',
          toolParams: {},
          reasoning: 'Searched knowledge base for relevant information.',
          tokensUsed: 120,
          error: null,
        }),
        tokens: { prompt: 150, completion: 100 },
      }
    }

    if (this.role === 'validator') {
      return {
        content: JSON.stringify({
          isValid: true,
          confidence: 0.82,
          qualityScore: 0.88,
          issues: [],
          refinements: [],
          finalResponse: `I've analyzed your request and found relevant information. This is a demo response — add your OPENAI_API_KEY to get real AI-powered answers tailored to your knowledge base.`,
          summary: 'Request processed successfully in demo mode.',
          tokensUsed: 90,
        }),
        tokens: { prompt: 200, completion: 150 },
      }
    }

    return {
      content: '{"result": "Demo mode response"}',
      tokens: { prompt: 50, completion: 20 },
    }
  }
}
