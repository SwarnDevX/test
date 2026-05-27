import { prisma } from "@flowforge/db";

interface KnowledgeIngestionJob {
  documentId: string;
  knowledgeBaseId: string;
  workspaceId: string;
  sourceType: "file" | "url" | "text";
  sourceUrl?: string;
  text?: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
}

export async function handleKnowledgeIngestion(data: KnowledgeIngestionJob): Promise<void> {
  const { documentId, sourceType, sourceUrl, text, embeddingModel, chunkSize, chunkOverlap } = data;

  await prisma.document.update({ where: { id: documentId }, data: { status: "processing" } });

  try {
    let content = "";

    // Load content
    switch (sourceType) {
      case "url": {
        if (!sourceUrl) throw new Error("URL required");
        const res = await fetch(sourceUrl, {
          headers: { "User-Agent": "FlowForge/1.0 knowledge-ingestion-bot" },
        });
        const html = await res.text();
        content = stripHtml(html);
        break;
      }
      case "text":
        content = text ?? "";
        break;
      case "file":
        // File content should already be extracted and passed as text
        content = text ?? "";
        break;
    }

    if (!content.trim()) {
      throw new Error("No content extracted");
    }

    // Chunk the text
    const chunks = splitText(content, chunkSize, chunkOverlap);

    // Embed each chunk
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("OPENAI_API_KEY not configured for embeddings");

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) continue;
      const embedding = await embedText(chunk, embeddingModel, apiKey);
      const embeddingStr = `[${embedding.join(",")}]`;

      await prisma.$executeRaw`
        INSERT INTO chunks (id, document_id, content, chunk_index, token_count, embedding, created_at)
        VALUES (${crypto.randomUUID()}, ${documentId}, ${chunk}, ${i}, ${Math.ceil(chunk.length / 4)}, ${embeddingStr}::vector, NOW())
      `;
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "ready", sizeBytes: content.length },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await prisma.document.update({ where: { id: documentId }, data: { status: "failed", error: msg } });
    throw err;
  }
}

function splitText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    // Try to break at sentence boundary
    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf(".", end);
      if (sentenceEnd > start + chunkSize * 0.5) {
        end = sentenceEnd + 1;
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}

async function embedText(text: string, model: string, apiKey: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, input: text }),
  });

  if (!res.ok) throw new Error(`Embedding API error: ${res.statusText}`);
  const json = await res.json() as { data: Array<{ embedding: number[] }> };
  return json.data[0]?.embedding ?? [];
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
