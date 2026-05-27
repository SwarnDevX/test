import { tool } from 'ai';
import { z } from 'zod';

const MAX_CONTENT_LENGTH = 20_000; // characters — prevent context explosion

// Strips HTML tags and normalises whitespace to extract readable text.
function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Fetches the text content of a URL. Works for HTML pages, plain-text files,
// and Markdown. Does NOT execute JavaScript (no browser). Best for static pages,
// GitHub raw files, documentation, and news articles.
export const fetchUrlTool = tool({
  description:
    'Fetch the text content of a URL. Returns the readable text of the page (HTML is stripped). Use this to read documentation, articles, GitHub files, or any web resource you found via search. Max ~20,000 characters returned.',
  parameters: z.object({
    url: z.string().url().describe('The URL to fetch'),
  }),
  execute: async ({ url }): Promise<string> => {
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          'User-Agent': 'AgentBay/1.0 (research agent; +https://agentbay.xyz)',
          Accept: 'text/html,text/plain,text/markdown,application/json',
        },
        signal: AbortSignal.timeout(15_000),
        redirect: 'follow',
      });
    } catch (err) {
      return `Failed to fetch ${url}: ${err instanceof Error ? err.message : 'Network error'}`;
    }

    if (!response.ok) {
      return `HTTP ${response.status.toString()} fetching ${url}`;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const raw = await response.text();

    let text: string;
    if (contentType.includes('html')) {
      text = extractText(raw);
    } else {
      text = raw.replace(/\s{3,}/g, '\n\n').trim();
    }

    if (text.length > MAX_CONTENT_LENGTH) {
      text = text.slice(0, MAX_CONTENT_LENGTH) + `\n\n[Content truncated — ${text.length.toString()} chars total]`;
    }

    return `URL: ${url}\n\n${text}`;
  },
});
