import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import prisma from '../../../../src/db/client'
import { orchestrator } from '../../../../src/agents/orchestrator'
import { memoryStore } from '../../../../src/memory/store'
import type { StreamEvent } from '../../../../src/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 })
  }

  const { message, sessionId: rawSessionId } = parsed.data

  let sessionId = rawSessionId
  if (!sessionId) {
    const session = await prisma.chatSession.create({
      data: { id: uuidv4(), title: message.slice(0, 60) },
    })
    sessionId = session.id
  } else {
    await prisma.chatSession.upsert({
      where: { id: sessionId },
      update: { updatedAt: new Date() },
      create: { id: sessionId, title: message.slice(0, 60) },
    })
  }

  await prisma.chatMessage.create({
    data: { id: uuidv4(), sessionId, role: 'user', content: message },
  })

  const history = await memoryStore.getConversation(sessionId)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {}
      }

      try {
        const output = await orchestrator.run({ message, sessionId, history }, send)

        await prisma.chatMessage.create({
          data: {
            id: uuidv4(),
            sessionId,
            role: 'assistant',
            content: output.validation.finalResponse,
            metadata: JSON.stringify({
              traceId: output.traceId,
              confidence: output.validation.confidence,
              totalTokens: output.totalTokens,
              totalCost: output.totalCost,
              latencyMs: output.latencyMs,
              plan: { goal: output.plan.goal, stepCount: output.plan.steps.length },
            }),
          },
        })

        send({
          type: 'agent:complete',
          data: {
            sessionId,
            traceId: output.traceId,
            response: output.validation.finalResponse,
            confidence: output.validation.confidence,
            qualityScore: output.validation.qualityScore,
            totalTokens: output.totalTokens,
            totalCost: output.totalCost,
            latencyMs: output.latencyMs,
            plan: output.plan,
            results: output.results.map((r) => ({
              stepId: r.stepId,
              success: r.success,
              toolUsed: r.toolUsed,
              result: r.result.slice(0, 200),
            })),
          },
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Agent execution failed'
        send({ type: 'error', data: { error: errMsg }, timestamp: new Date().toISOString() })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Session-Id': sessionId,
    },
  })
}
