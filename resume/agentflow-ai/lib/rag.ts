// lib/rag.ts - RAG (Retrieval-Augmented Generation) logic

import { getDb } from '@/lib/db';
import { cosineSimilarity } from '@/lib/openai';

export async function searchKnowledgeBase(
  query: string,
  topK = 5
): Promise<Array<{ content: string; document_name: string; score: number; chunk_index: number }>> {
  const db = getDb();
  const chunks = db.getEmbeddedChunks();

  if (chunks.length === 0) return keywordSearch(query, topK);

  let queryEmbedding: number[] | null = null;
  try {
    const { createEmbedding } = await import('./openai');
    queryEmbedding = await createEmbedding(query);
  } catch { /* no API key */ }

  if (queryEmbedding) {
    const scored = chunks.map(c => ({
      content: c.content, document_name: c.document_name,
      chunk_index: c.chunk_index,
      score: c.embedding ? cosineSimilarity(queryEmbedding!, c.embedding) : 0,
    }));
    return scored.sort((a, b) => b.score - a.score).slice(0, topK).filter(c => c.score > 0.25);
  }

  return keywordSearch(query, topK);
}

function keywordSearch(
  query: string,
  topK: number
): Array<{ content: string; document_name: string; score: number; chunk_index: number }> {
  const db = getDb();
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const chunks = db.getAllChunksWithDoc().slice(0, 200);

  return chunks
    .map(c => {
      const lower = c.content.toLowerCase();
      const score = words.reduce((acc, w) => acc + (lower.includes(w) ? 1 : 0), 0) / Math.max(words.length, 1);
      return { content: c.content, document_name: c.document_name, chunk_index: c.chunk_index, score };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function chunkText(text: string, chunkSize = 400, overlap = 50): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ').trim();
    if (chunk.length > 50) chunks.push(chunk);
  }
  return chunks;
}

