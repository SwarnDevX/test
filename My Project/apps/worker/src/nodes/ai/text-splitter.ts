import { nodeRegistry } from "@flowforge/nodes-sdk";

nodeRegistry.register({
  type: "ai.textSplitter",
  category: "AI",
  label: "Text Splitter",
  description: "Split long text into overlapping chunks for embedding",
  icon: "Scissors",
  color: "oklch(65% 0.18 240)",
  inputs: [{ name: "text", label: "Text", type: "STRING" }],
  outputs: [
    { name: "chunks", label: "Chunks", type: "JSON" },
    { name: "count", label: "Chunk count", type: "NUMBER" },
  ],
  parameters: [
    { name: "chunkSize", label: "Chunk size (chars)", type: "number", default: 1000 },
    { name: "chunkOverlap", label: "Overlap (chars)", type: "number", default: 200 },
    { name: "separators", label: "Separators (JSON array)", type: "string", default: '["\\n\\n","\\n","."," "]' },
  ],
  executor: async (ctx) => {
    const text = String(ctx.inputs.text ?? ctx.inputs.input ?? "");
    const chunkSize = Number(ctx.params.chunkSize ?? 1000);
    const chunkOverlap = Number(ctx.params.chunkOverlap ?? 200);

    let separators = ["\n\n", "\n", ". ", " "];
    try {
      separators = JSON.parse(String(ctx.params.separators ?? "")) as string[];
    } catch { /* keep defaults */ }

    const chunks = splitText(text, chunkSize, chunkOverlap, separators);

    return {
      chunks: chunks.map((content, index) => ({ index, content, length: content.length })),
      count: chunks.length,
    };
  },
});

function splitText(text: string, chunkSize: number, overlap: number, separators: string[]): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      // Try to find a clean break point using separators
      for (const sep of separators) {
        const breakIdx = text.lastIndexOf(sep, end);
        if (breakIdx > start + chunkSize * 0.5) {
          end = breakIdx + sep.length;
          break;
        }
      }
    }

    const chunk = text.slice(start, Math.min(end, text.length)).trim();
    if (chunk) chunks.push(chunk);
    start = Math.max(start + 1, end - overlap);
  }

  return chunks;
}
