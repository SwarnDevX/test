import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../../src/db/client'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const trace = await prisma.agentTrace.findUnique({
      where: { id: params.id },
      include: { steps: { orderBy: { createdAt: 'asc' } } },
    })
    if (!trace) return NextResponse.json({ error: 'Trace not found' }, { status: 404 })
    return NextResponse.json(trace)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
