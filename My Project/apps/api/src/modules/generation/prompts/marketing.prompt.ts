export function buildMarketingCopyPrompt(idea: string): { system: string; user: string } {
  return {
    system: `You are a world-class startup marketer and copywriter (think David Ogilvy meets YC).
Return ONLY valid JSON — no markdown, no explanation.`,
    user: `Write compelling marketing copy for this startup:

"${idea}"

Return JSON with this EXACT structure:
{
  "tagline": "3-7 word memorable tagline",
  "valueProposition": "One sentence value proposition",
  "emailSubject": "Cold outreach email subject line",
  "emailBody": "Short cold email body (5-8 sentences)",
  "twitterBio": "Twitter/X bio (max 160 chars)",
  "adCopy": [
    { "platform": "Google", "headline": "Ad headline", "body": "Ad body" },
    { "platform": "LinkedIn", "headline": "Ad headline", "body": "Ad body" },
    { "platform": "Facebook", "headline": "Ad headline", "body": "Ad body" }
  ],
  "productHuntTagline": "Product Hunt tagline (max 60 chars)"
}`,
  };
}

