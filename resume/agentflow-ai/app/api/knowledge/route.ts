import { NextResponse } from 'next/server'
import prisma from '../../../src/db/client'

export async function GET() {
  try {
    const documents = await prisma.kbDocument.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { chunks: true } } },
    })
    return NextResponse.json({ documents })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
