import prisma from '../db/client'
import { embedText, cosineSimilarity } from './embedder'
import type { RetrievalResult, RAGQueryInput, Chunk } from '../types'

export async function retrieveChunks(input: RAGQueryInput): Promise<RetrievalResult[]> {
  const { query, topK = 5, minScore = 0.15 } = input

  const dbChunks = await prisma.kbChunk.findMany({
    include: { doc: { select: { name: true, status: true } } },
  })

  if (dbChunks.length === 0) return []

  const queryEmbedding = await embedText(query)

  const scored: RetrievalResult[] = []

  for (const dbChunk of dbChunks) {
    if (dbChunk.doc.status !== 'embedded') continue

    let score = 0

    if (queryEmbedding && dbChunk.embedding) {
      try {
        const chunkEmbedding = JSON.parse(dbChunk.embedding) as number[]
        score = cosineSimilarity(queryEmbedding, chunkEmbedding)
      } catch {
        score = keywordScore(query, dbChunk.content)
      }
    } else {
      score = keywordScore(query, dbChunk.content)
    }

    if (score >= minScore) {
      const chunk: Chunk = {
        id: dbChunk.id,
        docId: dbChunk.docId,
        content: dbChunk.content,
        embedding: dbChunk.embedding ? JSON.parse(dbChunk.embedding) : undefined,
        chunkIndex: dbChunk.chunkIndex,
        metadata: dbChunk.metadata ? JSON.parse(dbChunk.metadata) : undefined,
      }
      scored.push({ chunk, score, docName: dbChunk.doc.name })
    }
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, topK)
}

function keywordScore(query: string, content: string): number {
  const queryWords = new Set(
    query.toLowerCase().split(/\W+/).filter((w) => w.length > 2),
  )
  const contentWords = content.toLowerCase().split(/\W+/)
  let matches = 0
  for (const word of contentWords) {
    if (queryWords.has(word)) matches++
  }
  return Math.min(matches / Math.max(queryWords.size, 1), 1) * 0.8
}

export function formatRetrievedContext(results: RetrievalResult[]): string {
  if (results.length === 0) return ''
  return results
    .map(
      (r, i) =>
        `[Source ${i + 1}: ${r.docName ?? 'Unknown'} (relevance: ${Math.round(r.score * 100)}%)]\n${r.chunk.content}`,
    )
    .join('\n\n---\n\n')
}
