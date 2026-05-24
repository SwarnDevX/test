import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../src/db/client'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.kbDocument.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const doc = await prisma.kbDocument.findUnique({
      where: { id: params.id },
      include: { chunks: { take: 20, orderBy: { chunkIndex: 'asc' } } },
    })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ document: doc, chunks: doc.chunks })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
