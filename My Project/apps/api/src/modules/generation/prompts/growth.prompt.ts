export function buildGrowthPrompt(idea: string): { system: string; user: string } {
  return {
    system: `You are a growth hacker and startup advisor (YC, Sequoia level expertise).
Return ONLY valid JSON — no markdown, no explanation.`,
    user: `Create a growth strategy for this startup:

"${idea}"

Return JSON with this EXACT structure:
{
  "channels": [
    {
      "name": "Channel name",
      "description": "Why this channel works for this startup",
      "priority": "high",
      "estimatedROI": "e.g. 3-5x in 90 days",
      "actionItems": ["Action 1", "Action 2", "Action 3"]
    }
  ],
  "northStarMetric": "The single most important metric to track",
  "week1Actions": ["Immediate action 1", "Immediate action 2", "Immediate action 3"],
  "month1Goals": ["Month 1 goal 1", "Month 1 goal 2", "Month 1 goal 3"],
  "kpis": ["KPI 1", "KPI 2", "KPI 3", "KPI 4", "KPI 5"],
  "retentionStrategies": ["Strategy 1", "Strategy 2", "Strategy 3"]
}

Include 4-5 channels with priority high/medium/low.`,
  };
}

