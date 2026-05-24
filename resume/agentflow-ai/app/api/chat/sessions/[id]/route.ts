import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../../src/db/client'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.chatSession.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await prisma.chatSession.findUnique({
      where: { id: params.id },
      include: { _count: { select: { messages: true } } },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(session)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
