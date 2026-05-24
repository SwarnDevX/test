export function buildSEOPrompt(idea: string): { system: string; user: string } {
  return {
    system: `You are an expert SEO strategist specializing in SaaS startups.
Return ONLY valid JSON — no markdown, no explanation.`,
    user: `Generate an SEO strategy for this startup:

"${idea}"

Return JSON with this EXACT structure:
{
  "primaryKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "longTailKeywords": ["long tail 1", "long tail 2", "long tail 3", "long tail 4", "long tail 5"],
  "metaTitle": "SEO-optimized page title (50-60 chars)",
  "metaDescription": "SEO meta description (150-160 chars)",
  "contentTopics": ["Blog topic 1", "Blog topic 2", "Blog topic 3", "Blog topic 4", "Blog topic 5"],
  "competitorKeywords": ["competitor term 1", "competitor term 2", "competitor term 3"]
}`,
  };
}

