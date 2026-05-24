import { v4 as uuidv4 } from 'uuid'
import { PlannerAgent } from './planner'
import { ExecutorAgent } from './executor'
import { ValidatorAgent } from './validator'
import prisma from '../db/client'
import { memoryStore } from '../memory/store'
import { obsTracker } from '../observability/tracker'
import '../tools/builtin'  // register all built-in tools
import type { AgentInput, AgentOutput, StepResult, StreamEvent } from '../types'

export type StreamCallback = (event: StreamEvent) => void

export class AgentOrchestrator {
  private planner = new PlannerAgent()
  private executor = new ExecutorAgent()
  private validator = new ValidatorAgent()

  async run(
    input: AgentInput,
    onEvent?: StreamCallback,
  ): Promise<AgentOutput> {
    const traceId = input.traceId ?? uuidv4()
    const startTime = Date.now()
    let totalTokens = 0

    const emit = (event: StreamEvent) => {
      onEvent?.(event)
      this.emitSocket(input.sessionId, event)
    }

    // Create trace record
    const trace = await this.createTrace(traceId, input)

    try {
      emit({ type: 'agent:start', data: { traceId, message: input.message }, timestamp: new Date().toISOString() })

      // ── Phase 1: Planning ────────────────────────────────────────────────
      const { plan, tokens: planTokens } = await this.planner.plan(input)
      totalTokens += planTokens

      await this.saveTraceStep(traceId, {
        agent: 'planner',
        stepType: 'plan',
        input: JSON.stringify({ message: input.message }),
        output: JSON.stringify(plan),
        tokensUsed: planTokens,
        latencyMs: Date.now() - startTime,
      })

      emit({ type: 'agent:plan', data: plan, timestamp: new Date().toISOString() })
      await memoryStore.setAgentState(traceId, { phase: 'executing', plan })

      // ── Phase 2: Execution ───────────────────────────────────────────────
      const results: StepResult[] = []

      for (const step of plan.steps) {
        // Check dependencies
        const depsCompleted = step.dependencies.every((depId) =>
          results.find((r) => r.stepId === depId && r.success),
        )
        if (!depsCompleted) {
          results.push({
            stepId: step.id,
            success: false,
            result: 'Skipped: dependencies not met',
            toolUsed: null,
            toolParams: {},
            reasoning: 'Dependency check failed',
            tokensUsed: 0,
            error: 'Dependencies failed',
          })
          continue
        }

        emit({
          type: 'agent:step',
          data: { stepId: step.id, description: step.description, tool: step.tool },
          timestamp: new Date().toISOString(),
        })

        // Gather context from successful RAG results
        const ragContext = results
          .filter((r) => r.toolUsed === 'search_knowledge_base' && r.toolOutput)
          .map((r) => {
            const out = r.toolOutput as { context?: string } | undefined
            return out?.context ?? ''
          })
          .join('\n\n')

        const stepStart = Date.now()
        const { result, tokens: stepTokens } = await this.executor.executeStep(
          step,
          results,
          ragContext,
        )
        totalTokens += stepTokens

        results.push(result)

        if (result.toolUsed) {
          emit({
            type: 'agent:tool',
            data: { tool: result.toolUsed, success: result.success, result: result.result.slice(0, 200) },
            timestamp: new Date().toISOString(),
          })
          await obsTracker.record({ eventType: 'tool_call', agent: 'executor', metadata: { tool: result.toolUsed } })
        }

        await this.saveTraceStep(traceId, {
          agent: 'executor',
          stepType: 'execute',
          input: JSON.stringify({ step }),
          output: JSON.stringify(result),
          tokensUsed: stepTokens,
          latencyMs: Date.now() - stepStart,
          error: result.error ?? undefined,
        })
      }

      // ── Phase 3: Validation ──────────────────────────────────────────────
      emit({ type: 'agent:validate', data: { phase: 'validating' }, timestamp: new Date().toISOString() })

      const { validation, tokens: valTokens } = await this.validator.validate(
        input.message,
        plan,
        results,
      )
      totalTokens += valTokens

      await this.saveTraceStep(traceId, {
        agent: 'validator',
        stepType: 'validate',
        input: JSON.stringify({ resultsCount: results.length }),
        output: JSON.stringify(validation),
        tokensUsed: valTokens,
        latencyMs: Date.now() - startTime,
      })

      const latencyMs = Date.now() - startTime
      const totalCost = obsTracker.estimateCost('gpt-4o', totalTokens * 0.7, totalTokens * 0.3)

      // Update trace
      await prisma.agentTrace.update({
        where: { id: traceId },
        data: {
          status: 'completed',
          output: JSON.stringify({ plan, results, validation }),
          totalTokens,
          totalCost,
          latencyMs,
        },
      })

      // Save to conversation memory
      if (input.sessionId) {
        await memoryStore.appendConversation(input.sessionId, { role: 'user', content: input.message })
        await memoryStore.appendConversation(input.sessionId, {
          role: 'assistant',
          content: validation.finalResponse,
        })
      }

      emit({
        type: 'agent:complete',
        data: {
          traceId,
          confidence: validation.confidence,
          totalTokens,
          latencyMs,
          finalResponse: validation.finalResponse,
        },
        timestamp: new Date().toISOString(),
      })

      return { plan, results, validation, totalTokens, totalCost, latencyMs, traceId }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)

      await prisma.agentTrace.update({
        where: { id: traceId },
        data: { status: 'failed', output: JSON.stringify({ error: errMsg }) },
      }).catch(() => {})

      await obsTracker.record({ eventType: 'error', agent: 'orchestrator', metadata: { error: errMsg } })

      emit({ type: 'error', data: { error: errMsg, traceId }, timestamp: new Date().toISOString() })

      throw error
    }
  }

  private async createTrace(traceId: string, input: AgentInput) {
    return prisma.agentTrace.create({
      data: {
        id: traceId,
        sessionId: input.sessionId,
        traceType: 'chat',
        status: 'running',
        input: JSON.stringify({ message: input.message }),
      },
    }).catch(() => null)
  }

  private async saveTraceStep(
    traceId: string,
    step: {
      agent: string
      stepType: string
      input: string
      output?: string
      tokensUsed: number
      latencyMs: number
      error?: string
    },
  ) {
    return prisma.agentTraceStep.create({
      data: { traceId, ...step },
    }).catch(() => null)
  }

  private emitSocket(sessionId: string | undefined, event: StreamEvent) {
    try {
      const io = (global as Record<string, unknown>).socketServer as import('socket.io').Server | undefined
      if (io && sessionId) {
        io.to(`session:${sessionId}`).emit('agent:event', event)
      }
    } catch {
      // Non-fatal
    }
  }
}

export const orchestrator = new AgentOrchestrator()
