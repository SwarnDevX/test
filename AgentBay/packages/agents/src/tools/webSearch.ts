import { tool } from 'ai';
import { z } from 'zod';

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  answer?: string;
  results: TavilyResult[];
}

// Tavily search — requires TAVILY_API_KEY env var.
// Returns a structured search result with an AI-synthesised answer + sources.
export const webSearchTool = tool({
  description:
    'Search the web for current information. Returns an AI-synthesised answer and up to 5 source URLs with excerpts. Use this when you need facts, news, or information that may have changed after your training cutoff.',
  parameters: z.object({
    query: z.string().min(1).max(400).describe('The search query'),
    maxResults: z
      .number()
      .int()
      .min(1)
      .max(10)
      .optional()
      .default(5)
      .describe('Maximum number of results to return'),
  }),
  execute: async ({ query, maxResults = 5 }): Promise<string> => {
    const apiKey = process.env['TAVILY_API_KEY'];
    if (!apiKey) {
      return 'Web search is not available: TAVILY_API_KEY is not configured.';
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        max_results: maxResults,
        include_answer: true,
        include_raw_content: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return `Web search failed: HTTP ${response.status.toString()}`;
    }

    const data = (await response.json()) as TavilyResponse;

    const lines: string[] = [];
    if (data.answer) {
      lines.push(`**Summary:** ${data.answer}`, '');
    }
    lines.push('**Sources:**');
    for (const result of data.results) {
      lines.push(`- [${result.title}](${result.url})`);
      if (result.content) {
        lines.push(`  ${result.content.slice(0, 200).trim()}...`);
      }
    }

    return lines.join('\n');
  },
});
