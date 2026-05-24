import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../../src/db/client'

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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const wf = await prisma.workflow.findUnique({
      where: { id: params.id },
      include: {
        runs: { orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { runs: true } },
      },
    })
    if (!wf) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const def = safeParseDefinition(wf.definition)
    return NextResponse.json({
      id: wf.id,
      name: wf.name,
      description: wf.description ?? '',
      status: (def.status as string) ?? 'draft',
      run_count: wf._count.runs,
      nodes: (def.nodes as unknown[]) ?? [],
      edges: (def.edges as unknown[]) ?? [],
      runs: wf.runs,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>

    // Load current definition to merge
    const current = await prisma.workflow.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const currentDef = safeParseDefinition(current.definition)

    const nodes = (body.nodes as unknown[] | undefined) ?? (currentDef.nodes as unknown[]) ?? []
    const edges = (body.edges as unknown[] | undefined) ?? (currentDef.edges as unknown[]) ?? []
    const steps = nodes.length > 0 ? convertNodesToSteps(nodes) : (currentDef.steps as unknown[]) ?? []
    const name = (body.name as string | undefined) ?? current.name
    const description = (body.description as string | undefined) ?? current.description ?? ''
    const status = (body.status as string | undefined) ?? (currentDef.status as string) ?? 'active'

    const wf = await prisma.workflow.update({
      where: { id: params.id },
      data: {
        name,
        description,
        definition: JSON.stringify({
          ...currentDef,
          name,
          description,
          steps,
          nodes,
          edges,
          status,
        }),
      },
    })
    return NextResponse.json({ success: true, id: wf.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.workflow.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
