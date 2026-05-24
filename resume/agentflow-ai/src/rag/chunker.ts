export interface ChunkConfig {
  chunkSize: number
  overlap: number
  minLength: number
}

const DEFAULT_CONFIG: ChunkConfig = {
  chunkSize: 400,
  overlap: 50,
  minLength: 20,
}

export function chunkText(text: string, config: Partial<ChunkConfig> = {}): string[] {
  const { chunkSize, overlap, minLength } = { ...DEFAULT_CONFIG, ...config }
  const words = text.split(/\s+/).filter(Boolean)

  if (words.length === 0) return []
  if (words.length <= chunkSize) return [words.join(' ')]

  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length)
    const chunk = words.slice(start, end).join(' ')
    if (chunk.length >= minLength) {
      chunks.push(chunk)
    }
    if (end === words.length) break
    start = end - overlap
  }

  return chunks
}

export function splitByParagraph(text: string, maxWords = 300): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const chunks: string[] = []

  for (const para of paragraphs) {
    const words = para.split(/\s+/)
    if (words.length > maxWords) {
      chunks.push(...chunkText(para, { chunkSize: maxWords }))
    } else {
      chunks.push(para)
    }
  }

  return chunks
}

export function extractTextFromCSV(csv: string): string {
  const lines = csv.split('\n')
  if (lines.length === 0) return ''
  const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''))
  const rows = lines.slice(1)
  return rows
    .filter((r) => r.trim())
    .map((row) => {
      const cols = row.split(',').map((c) => c.trim().replace(/"/g, ''))
      return headers.map((h, i) => `${h}: ${cols[i] ?? ''}`).join(', ')
    })
    .join('\n')
}
