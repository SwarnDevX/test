export { webSearchTool } from './webSearch.js';
export { fetchUrlTool } from './fetchUrl.js';
export { createX402FetchTool } from './x402Fetch.js';
export type { X402ToolConfig } from './x402Fetch.js';

import { webSearchTool } from './webSearch.js';
import { fetchUrlTool } from './fetchUrl.js';
import type { ToolSet } from 'ai';

// All built-in tools available for agent use
export const ALL_TOOLS = {
  webSearch: webSearchTool,
  fetchUrl: fetchUrlTool,
} as const satisfies ToolSet;

// Convenience subsets
export const SEARCH_TOOLS = { webSearch: webSearchTool } as const satisfies ToolSet;
export const FETCH_TOOLS = { fetchUrl: fetchUrlTool } as const satisfies ToolSet;
export const RESEARCH_TOOLS = {
  webSearch: webSearchTool,
  fetchUrl: fetchUrlTool,
} as const satisfies ToolSet;
