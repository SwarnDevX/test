import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { retrieveChunks, formatRetrievedContext } from '../../../../src/rag/retriever'

const BodySchema = z.object({
  query: z.string().min(1),
  topK: z.number().min(1).max(20).default(5),
  minScore: z.number().min(0).max(1).default(0.1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { query, topK, minScore } = parsed.data
  const results = await retrieveChunks({ query, topK, minScore })
  const context = formatRetrievedContext(results)

  return NextResponse.json({
    query,
    results: results.map((r) => ({
      docId: r.chunk.docId,
      docName: r.docName,
      score: r.score,
      content: r.chunk.content,
      chunkIndex: r.chunk.chunkIndex,
    })),
    context,
    count: results.length,
  })
}
