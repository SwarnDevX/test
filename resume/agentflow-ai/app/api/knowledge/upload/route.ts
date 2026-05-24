// Redirect all upload requests to the new RAG endpoint
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Forward to the main RAG upload handler
  const url = new URL('/api/rag/upload', req.url)
  return fetch(url.toString(), { method: 'POST', body: req.body, headers: req.headers })
    .then(async (res) => {
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    })
    .catch(() => NextResponse.json({ error: 'Upload failed' }, { status: 500 }))
}
