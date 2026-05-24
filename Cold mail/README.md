# Reachout

AI-powered cold outreach. Enter a company and your background — Claude does real web research and drafts a targeted DM or email grounded in actual findings.

## Setup

```
1. pnpm install
2. cp .env.local.example .env.local
3. Add your ANTHROPIC_API_KEY (get one at console.anthropic.com)
4. pnpm dev
5. Open http://localhost:3000
```

## How it works

1. You fill in a company name, URL, your background, and pick DM or Cold email.
2. The backend calls Claude with the `web_search_20250305` tool (up to 8 searches).
3. Claude researches the company, identifies one evidence-backed technical pain point, and drafts a targeted message.
4. The frontend shows research notes, the pain point with a source link, why you fit, and the draft — all editable and copyable.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-nova)
- Anthropic API — `claude-sonnet-4-6` with built-in web search
- No database, no auth — localStorage for history

## Stretch goals (v2)

- Recipient email lookup via Hunter / Apollo API
- Send-via-Gmail integration with OAuth
- Multiple drafts per generation (3 variants)
- Save / share generations via signed URL
- Bulk mode: paste 10 companies, get 10 drafts
- Streaming: progressively reveal cards as Claude searches
