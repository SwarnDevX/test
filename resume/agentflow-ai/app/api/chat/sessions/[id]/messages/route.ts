import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../../../src/db/client'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: params.id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ messages })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
