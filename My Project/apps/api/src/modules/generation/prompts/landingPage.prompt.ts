export function buildLandingPagePrompt(idea: string): { system: string; user: string } {
  return {
    system: `You are an expert SaaS landing page copywriter and UI designer.
Generate a complete landing page structure as JSON.
IMPORTANT: Return ONLY valid JSON matching the exact schema — no markdown, no explanation.`,
    user: `Create a high-converting SaaS landing page for this startup idea:

"${idea}"

Return JSON with this EXACT structure:
{
  "headline": "Main hero headline (max 10 words, punchy)",
  "subheadline": "Supporting headline (max 20 words)",
  "heroDescription": "2-3 sentence hero description",
  "features": [
    { "title": "Feature name", "description": "Feature description", "icon": "emoji icon" }
  ],
  "cta": {
    "primary": "Primary CTA button text",
    "secondary": "Secondary CTA button text"
  },
  "testimonials": [
    { "name": "Person name", "role": "Title, Company", "quote": "Testimonial quote" }
  ],
  "pricing": [
    { "plan": "Plan name", "price": "$X/mo", "features": ["feature 1", "feature 2"] }
  ],
  "faq": [
    { "question": "FAQ question?", "answer": "FAQ answer" }
  ]
}

Include 3-5 features, 2-3 testimonials, 3 pricing tiers, and 4-5 FAQs.`,
  };
}

