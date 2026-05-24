import { NextResponse } from 'next/server'
import prisma from '../../../../src/db/client'

export async function GET() {
  try {
    const traces = await prisma.agentTrace.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        steps: { orderBy: { createdAt: 'asc' } },
      },
    })
    return NextResponse.json({ traces })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
