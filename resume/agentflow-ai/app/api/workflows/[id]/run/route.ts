import { NextRequest } from 'next/server'
import prisma from '../../../../../src/db/client'
import { workflowEngine } from '../../../../../src/workflows/engine'
import type { WorkflowDefinition, StreamEvent } from '../../../../../src/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const workflow = await prisma.workflow.findUnique({ where: { id: params.id } })
  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Workflow not found' }), { status: 404 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>

  let fullDef: Record<string, unknown>
  try {
    fullDef = JSON.parse(workflow.definition)
  } catch {
    fullDef = {}
  }

  // Extract only the fields the engine expects
  const definition: WorkflowDefinition = {
    name: (fullDef.name as string) ?? workflow.name,
    description: fullDef.description as string | undefined,
    steps: (fullDef.steps as WorkflowDefinition['steps']) ?? [],
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {}
      }

      // Translate engine events to the frontend-expected format
      const translatedSend = (event: StreamEvent) => {
        const d = event.data as Record<string, unknown>

        if (event.type === 'workflow:step') {
          if (d.status === 'running') {
            send({
              type: 'node_start',
              data: { nodeId: d.stepId, label: d.stepName },
              timestamp: event.timestamp,
            })
          } else if (d.status === 'completed') {
            send({
              type: 'node_done',
              data: {
                nodeId: d.stepId,
                label: d.stepName,
                result: typeof d.output === 'object' ? JSON.stringify(d.output) : String(d.output ?? ''),
                latency: 0,
                tokens: 0,
              },
              timestamp: event.timestamp,
            })
          } else if (d.status === 'failed') {
            send({
              type: 'node_done',
              data: {
                nodeId: d.stepId,
                label: d.stepName,
                result: String(d.error ?? 'Step failed'),
                latency: 0,
                tokens: 0,
              },
              timestamp: event.timestamp,
            })
          }
        } else if (event.type === 'workflow:complete') {
          if (d.status === 'completed') {
            send({ type: 'completed', data: d, timestamp: event.timestamp })
          } else {
            send({
              type: 'error',
              data: { error: (d.error as string) ?? 'Workflow failed' },
              timestamp: event.timestamp,
            })
          }
        } else {
          send(event)
        }
      }

      try {
        await workflowEngine.run(definition, params.id, body, translatedSend)
      } catch (err) {
        send({
          type: 'error',
          data: { error: err instanceof Error ? err.message : String(err) },
          timestamp: new Date().toISOString(),
        })
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
    },
  })
}
