import { researcherAgent } from './researcher.js';
import { tweetComposerAgent } from './tweetComposer.js';
import { codeReviewerAgent } from './codeReviewer.js';
import { summarizerAgent } from './summarizer.js';
import { competitorAnalystAgent } from './competitorAnalyst.js';
import type { AgentConfig } from '../runtime/types.js';

export {
  researcherAgent,
  tweetComposerAgent,
  codeReviewerAgent,
  summarizerAgent,
  competitorAnalystAgent,
};

// Map of all seed agents keyed by stable ID.
// Use this to look up an agent config by slug in the worker.
export const SEED_AGENTS: Readonly<Record<string, AgentConfig>> = {
  [researcherAgent.id]: researcherAgent,
  [tweetComposerAgent.id]: tweetComposerAgent,
  [codeReviewerAgent.id]: codeReviewerAgent,
  [summarizerAgent.id]: summarizerAgent,
  [competitorAnalystAgent.id]: competitorAnalystAgent,
};

export type SeedAgentId = keyof typeof SEED_AGENTS;
