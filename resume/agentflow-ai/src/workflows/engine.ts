import { v4 as uuidv4 } from 'uuid'
import prisma from '../db/client'
import { toolRegistry } from '../tools/registry'
import '../tools/builtin'
import type { WorkflowDefinition, WorkflowRunState, WorkflowStatus, StreamEvent } from '../types'

export type WorkflowStreamCallback = (event: StreamEvent) => void

export class WorkflowEngine {
  async run(
    definition: WorkflowDefinition,
    workflowId: string,
    inputData: Record<string, unknown> = {},
    onEvent?: WorkflowStreamCallback,
  ): Promise<WorkflowRunState> {
    const runId = uuidv4()
    const startedAt = new Date()

    const emit = (event: StreamEvent) => {
      onEvent?.(event)
      this.emitSocket(runId, event)
    }

    const run = await prisma.workflowRun.create({
      data: {
        id: runId,
        workflowId,
        status: 'running',
        input: JSON.stringify(inputData),
      },
    })

    const state: WorkflowRunState = {
      runId,
      workflowId,
      status: 'running',
      currentStep: null,
      completedSteps: [],
      stepOutputs: { ...inputData },
      startedAt,
    }

    try {
      for (const step of definition.steps) {
        state.currentStep = step.id

        emit({
          type: 'workflow:step',
          data: { runId, stepId: step.id, stepName: step.name, stepType: step.type, status: 'running' },
          timestamp: new Date().toISOString(),
        })

        const stepRecord = await prisma.workflowRunStep.create({
          data: {
            runId,
            stepId: step.id,
            stepName: step.name,
            status: 'running',
            input: JSON.stringify(state.stepOutputs),
            startedAt: new Date(),
          },
        })

        try {
          const stepOutput = await this.executeStep(step, state)
          state.stepOutputs[step.id] = stepOutput
          state.completedSteps.push(step.id)

          await prisma.workflowRunStep.update({
            where: { id: stepRecord.id },
            data: { status: 'completed', output: JSON.stringify(stepOutput), completedAt: new Date() },
          })

          emit({
            type: 'workflow:step',
            data: { runId, stepId: step.id, stepName: step.name, status: 'completed', output: stepOutput },
            timestamp: new Date().toISOString(),
          })
        } catch (stepError) {
          const errMsg = stepError instanceof Error ? stepError.message : String(stepError)
          const strategy = step.onError ?? 'fail'

          await prisma.workflowRunStep.update({
            where: { id: stepRecord.id },
            data: { status: 'failed', error: errMsg, completedAt: new Date() },
          })

          emit({
            type: 'workflow:step',
            data: { runId, stepId: step.id, stepName: step.name, status: 'failed', error: errMsg },
            timestamp: new Date().toISOString(),
          })

          if (strategy === 'fail') {
            state.status = 'failed'
            state.error = errMsg
            break
          }
          // skip: continue to next step
          state.stepOutputs[step.id] = { skipped: true, error: errMsg }
          state.completedSteps.push(step.id)
        }
      }

      if (state.status === 'running') {
        state.status = 'completed'
      }
    } catch (err) {
      state.status = 'failed'
      state.error = err instanceof Error ? err.message : String(err)
    }

    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: state.status,
        output: JSON.stringify(state.stepOutputs),
        updatedAt: new Date(),
      },
    })

    emit({
      type: 'workflow:complete',
      data: { runId, status: state.status, completedSteps: state.completedSteps, error: state.error },
      timestamp: new Date().toISOString(),
    })

    return state
  }

  private async executeStep(
    step: WorkflowDefinition['steps'][number],
    state: WorkflowRunState,
  ): Promise<unknown> {
    const cfg = step.config as Record<string, unknown>
    const ctx = state.stepOutputs

    switch (step.type) {
      case 'llm_call': {
        if (!process.env.OPENAI_API_KEY) {
          return { text: `[Demo] LLM response for step: ${step.name}`, tokensUsed: 50 }
        }
        const { default: OpenAI } = await import('openai')
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        const prompt = this.interpolate(String(cfg.prompt ?? step.name), ctx)
        const resp = await openai.chat.completions.create({
          model: String(cfg.model ?? 'gpt-4o-mini'),
          messages: [
            { role: 'system', content: String(cfg.systemPrompt ?? 'You are a helpful assistant.') },
            { role: 'user', content: prompt },
          ],
          max_tokens: Number(cfg.maxTokens ?? 500),
        })
        return { text: resp.choices[0]?.message?.content ?? '', tokensUsed: resp.usage?.total_tokens ?? 0 }
      }

      case 'api_call': {
        const url = this.interpolate(String(cfg.url ?? ''), ctx)
        const method = String(cfg.method ?? 'GET').toUpperCase()
        const headers = (cfg.headers as Record<string, string>) ?? {}
        const body = cfg.body ? this.interpolate(JSON.stringify(cfg.body), ctx) : undefined

        const resp = await fetch(url, { method, headers, body })
        const data = await resp.json().catch(() => resp.text())
        return { status: resp.status, data }
      }

      case 'rag_search': {
        const { retrieveChunks, formatRetrievedContext } = await import('../rag/retriever')
        const query = this.interpolate(String(cfg.query ?? ''), ctx)
        const results = await retrieveChunks({ query, topK: Number(cfg.topK ?? 5) })
        return { context: formatRetrievedContext(results), resultCount: results.length }
      }

      case 'db_query': {
        const toolResult = await toolRegistry.execute('query_database', {
          entity: cfg.entity ?? 'sessions',
          limit: cfg.limit ?? 10,
        })
        return toolResult.data
      }

      case 'condition': {
        const condition = String(cfg.condition ?? 'true')
        const interpolated = this.interpolate(condition, ctx)
        // Safe boolean evaluation
        const result = interpolated === 'true' || interpolated === '1'
        return { condition: result, branch: result ? 'true' : 'false' }
      }

      case 'transform': {
        const input = cfg.input ? this.interpolate(String(cfg.input), ctx) : JSON.stringify(ctx)
        const transformFn = String(cfg.transform ?? 'identity')
        return { transformed: input, operation: transformFn }
      }

      case 'agent_task': {
        const { orchestrator } = await import('../agents/orchestrator')
        const message = this.interpolate(String(cfg.message ?? step.name), ctx)
        const output = await orchestrator.run({ message })
        return { response: output.validation.finalResponse, confidence: output.validation.confidence }
      }

      default:
        return { skipped: true, reason: `Unknown step type: ${step.type}` }
    }
  }

  private interpolate(template: string, ctx: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = ctx[key]
      return val !== undefined ? String(typeof val === 'object' ? JSON.stringify(val) : val) : `{{${key}}}`
    })
  }

  private emitSocket(runId: string, event: StreamEvent) {
    try {
      const io = (global as Record<string, unknown>).socketServer as import('socket.io').Server | undefined
      if (io) {
        io.to(`workflow:${runId}`).emit('workflow:event', event)
      }
    } catch {}
  }
}

export const workflowEngine = new WorkflowEngine()
