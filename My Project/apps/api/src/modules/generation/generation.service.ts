import openai, { MODEL } from '../../config/openai';
import { buildCacheKey, getCache, setCache } from '../../cache/cacheManager';
import { buildLandingPagePrompt } from './prompts/landingPage.prompt';
import { buildMarketingCopyPrompt } from './prompts/marketing.prompt';
import { buildSEOPrompt } from './prompts/seo.prompt';
import { buildGrowthPrompt } from './prompts/growth.prompt';
import {
  GenerationOutput,
  GenerationOutputSchema,
  LandingPageSchema,
  MarketingCopySchema,
  SEOKeywordsSchema,
  GrowthStrategiesSchema,
} from './generation.types';

async function callAI<T>(
  prompt: { system: string; user: string },
  schema: { parse: (data: unknown) => T }
): Promise<{ data: T; tokensUsed: number }> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const raw = response.choices[0].message.content || '{}';
  const parsed = JSON.parse(raw);
  const data = schema.parse(parsed);
  const tokensUsed = response.usage?.total_tokens || 0;
  return { data, tokensUsed };
}

export async function generateAll(idea: string): Promise<{
  output: GenerationOutput;
  totalTokens: number;
  fromCache: boolean;
}> {
  const cacheKey = buildCacheKey('generation', idea);
  const cached = await getCache<{ output: GenerationOutput; totalTokens: number }>(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  const [landingPageResult, marketingResult, seoResult, growthResult] = await Promise.all([
    callAI(buildLandingPagePrompt(idea), LandingPageSchema),
    callAI(buildMarketingCopyPrompt(idea), MarketingCopySchema),
    callAI(buildSEOPrompt(idea), SEOKeywordsSchema),
    callAI(buildGrowthPrompt(idea), GrowthStrategiesSchema),
  ]);

  const output = GenerationOutputSchema.parse({
    landingPage: landingPageResult.data,
    marketingCopy: marketingResult.data,
    seoKeywords: seoResult.data,
    growthStrategies: growthResult.data,
  });

  const totalTokens =
    landingPageResult.tokensUsed +
    marketingResult.tokensUsed +
    seoResult.tokensUsed +
    growthResult.tokensUsed;

  await setCache(cacheKey, { output, totalTokens });

  return { output, totalTokens, fromCache: false };
}

