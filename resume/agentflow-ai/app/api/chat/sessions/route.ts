import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../../src/db/client'

export async function GET() {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { _count: { select: { messages: true } } },
    })
    return NextResponse.json({ sessions })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { title?: string }
    const session = await prisma.chatSession.create({
      data: { id: uuidv4(), title: body.title ?? 'New Chat' },
    })
    return NextResponse.json(session)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
