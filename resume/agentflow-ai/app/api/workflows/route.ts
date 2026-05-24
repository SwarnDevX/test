import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../src/db/client'

function safeParseDefinition(raw: string): Record<string, unknown> {
  try { return JSON.parse(raw) } catch { return {} }
}

function convertNodesToSteps(nodes: unknown[]): unknown[] {
  return (nodes as Array<{ id: string; data: { label: string; type: string; config?: Record<string, unknown> } }>)
    .map((n) => ({
      id: n.id,
      name: n.data.label,
      type: n.data.type === 'llm' ? 'llm_call' : n.data.type === 'api' ? 'api_call' : n.data.type === 'database' ? 'db_query' : 'transform',
      config: n.data.config ?? {},
      onError: 'skip' as const,
    }))
}

export async function GET() {
  try {
    const workflows = await prisma.workflow.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { runs: true } } },
    })
    return NextResponse.json({
      workflows: workflows.map((wf) => {
        const def = safeParseDefinition(wf.definition)
        return {
          id: wf.id,
          name: wf.name,
          description: wf.description ?? '',
          status: (def.status as string) ?? 'draft',
          run_count: wf._count.runs,
          nodes: (def.nodes as unknown[]) ?? [],
          edges: (def.edges as unknown[]) ?? [],
        }
      }),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as {
      name?: string
      description?: string
      steps?: unknown[]
      nodes?: unknown[]
      edges?: unknown[]
    }

    const nodes = body.nodes ?? []
    const edges = body.edges ?? []
    const steps = body.steps ?? convertNodesToSteps(nodes)

    const wf = await prisma.workflow.create({
      data: {
        id: uuidv4(),
        name: body.name ?? 'Untitled Workflow',
        description: body.description,
        definition: JSON.stringify({
          name: body.name,
          description: body.description,
          steps,
          nodes,
          edges,
          status: 'draft',
        }),
      },
    })

    return NextResponse.json({
      id: wf.id,
      name: wf.name,
      description: wf.description ?? '',
      status: 'draft',
      run_count: 0,
      nodes,
      edges,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
