import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../../../../src/db/client'
import { chunkText, splitByParagraph, extractTextFromCSV } from '../../../../src/rag/chunker'
import { embedBatch } from '../../../../src/rag/embedder'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const name = file.name
    const type = name.split('.').pop()?.toLowerCase() ?? 'txt'
    const size = file.size
    const docId = uuidv4()

    const doc = await prisma.kbDocument.create({
      data: { id: docId, name, type, size, status: 'processing' },
    })

    // Process asynchronously
    processDocument(docId, file, type).catch(async (err) => {
      await prisma.kbDocument.update({
        where: { id: docId },
        data: { status: 'error' },
      })
      console.error('[RAG Upload] Error:', err)
    })

    return NextResponse.json({ docId, name, type, size, status: 'processing' })
  } catch (err) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

async function processDocument(docId: string, file: File, type: string) {
  const buffer = Buffer.from(await file.arrayBuffer())
  let text = ''

  if (type === 'pdf') {
    try {
      const pdfParse = (await import('pdf-parse')).default
      const result = await pdfParse(buffer)
      text = result.text
    } catch {
      text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ')
    }
  } else if (type === 'csv') {
    text = extractTextFromCSV(buffer.toString('utf-8'))
  } else {
    text = buffer.toString('utf-8')
  }

  if (!text.trim()) {
    await prisma.kbDocument.update({ where: { id: docId }, data: { status: 'error' } })
    return
  }

  const rawChunks = type === 'pdf' ? splitByParagraph(text) : chunkText(text)
  const chunks = rawChunks.filter((c) => c.trim().length > 20).slice(0, 200)

  const embeddings = await embedBatch(chunks)

  const chunkRecords = chunks.map((content, i) => ({
    id: uuidv4(),
    docId,
    content,
    embedding: embeddings[i] ? JSON.stringify(embeddings[i]) : null,
    chunkIndex: i,
  }))

  await prisma.kbChunk.createMany({ data: chunkRecords })
  await prisma.kbDocument.update({
    where: { id: docId },
    data: { status: 'embedded', chunkCount: chunks.length },
  })
}
