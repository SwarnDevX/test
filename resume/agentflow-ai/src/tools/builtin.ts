import { toolRegistry } from './registry'
import { retrieveChunks, formatRetrievedContext } from '../rag/retriever'

toolRegistry.register({
  name: 'search_knowledge_base',
  description: 'Search the internal knowledge base using semantic similarity. Use for domain-specific questions, uploaded documents, or company data.',
  parameters: {
    query: { type: 'string', description: 'The search query', required: true },
    top_k: { type: 'number', description: 'Number of results to return (1-10)', required: false },
  },
  async execute(params) {
    const { query, top_k = 5 } = params as { query: string; top_k?: number }
    const results = await retrieveChunks({ query, topK: top_k })
    if (results.length === 0) {
      return { success: true, data: { results: [], context: 'No relevant documents found.' } }
    }
    const context = formatRetrievedContext(results)
    return {
      success: true,
      data: {
        results: results.map((r) => ({ docName: r.docName, score: r.score, excerpt: r.chunk.content.slice(0, 200) })),
        context,
      },
    }
  },
})

toolRegistry.register({
  name: 'calculate',
  description: 'Evaluate a mathematical expression safely. Supports +, -, *, /, **, % and common functions.',
  parameters: {
    expression: { type: 'string', description: 'The mathematical expression to evaluate', required: true },
  },
  async execute(params) {
    const { expression } = params as { expression: string }
    const safe = expression.replace(/[^0-9+\-*/().% ]/g, '')
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${safe})`)()
      return { success: true, data: { expression, result } }
    } catch (err) {
      return { success: false, data: null, error: `Could not evaluate: ${expression}` }
    }
  },
})

toolRegistry.register({
  name: 'web_search',
  description: 'Search the web for current information, news, or general knowledge not in the knowledge base.',
  parameters: {
    query: { type: 'string', description: 'The search query', required: true },
    max_results: { type: 'number', description: 'Max number of results (1-5)', required: false },
  },
  async execute(params) {
    const { query } = params as { query: string }
    // Demo-mode stub — replace with SerpAPI/Tavily in production
    return {
      success: true,
      data: {
        query,
        results: [
          { title: `Search results for: ${query}`, url: 'https://example.com', snippet: `This is a demo result for "${query}". Connect SerpAPI or Tavily for real web search.` },
        ],
        note: 'Web search is in demo mode. Add SERPAPI_KEY or TAVILY_KEY for real results.',
      },
    }
  },
})

toolRegistry.register({
  name: 'query_database',
  description: 'Query the application database for structured data about sessions, workflows, knowledge documents, or observability metrics.',
  parameters: {
    entity: { type: 'string', description: 'Entity to query', enum: ['sessions', 'workflows', 'documents', 'metrics'], required: true },
    filter: { type: 'string', description: 'Optional JSON filter object', required: false },
    limit: { type: 'number', description: 'Number of results', required: false },
  },
  async execute(params) {
    const { entity, limit = 10 } = params as { entity: string; filter?: string; limit?: number }
    const { default: prisma } = await import('../db/client')
    try {
      let data: unknown
      switch (entity) {
        case 'sessions':
          data = await prisma.chatSession.findMany({ take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, createdAt: true } })
          break
        case 'workflows':
          data = await prisma.workflow.findMany({ take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, description: true, createdAt: true } })
          break
        case 'documents':
          data = await prisma.kbDocument.findMany({ take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, type: true, status: true, chunkCount: true } })
          break
        case 'metrics':
          data = await prisma.obsEvent.findMany({ take: limit, orderBy: { createdAt: 'desc' } })
          break
        default:
          return { success: false, data: null, error: `Unknown entity: ${entity}` }
      }
      return { success: true, data: { entity, records: data, count: Array.isArray(data) ? data.length : 0 } }
    } catch (err) {
      return { success: false, data: null, error: err instanceof Error ? err.message : 'DB error' }
    }
  },
})

toolRegistry.register({
  name: 'generate_text',
  description: 'Generate a focused piece of text using an LLM sub-call. Use for drafting, summarization, or transformation tasks within a larger workflow.',
  parameters: {
    prompt: { type: 'string', description: 'The generation prompt', required: true },
    max_tokens: { type: 'number', description: 'Max tokens to generate (50-1000)', required: false },
    tone: { type: 'string', description: 'Writing tone', enum: ['formal', 'casual', 'technical', 'concise'], required: false },
  },
  async execute(params) {
    const { prompt, max_tokens = 300, tone = 'concise' } = params as { prompt: string; max_tokens?: number; tone?: string }
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: true,
        data: {
          text: `[Demo] Generated ${tone} text for: "${prompt.slice(0, 80)}..."`,
          tokensUsed: max_tokens,
        },
      }
    }
    const { default: OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You generate ${tone} text. Be direct and focused.` },
        { role: 'user', content: prompt },
      ],
      max_tokens,
      temperature: 0.6,
    })
    const text = resp.choices[0]?.message?.content ?? ''
    return {
      success: true,
      data: { text, tokensUsed: resp.usage?.total_tokens ?? 0 },
    }
  },
})

toolRegistry.register({
  name: 'analyze_data',
  description: 'Analyze structured data (JSON/CSV) and return statistical insights, patterns, or summaries.',
  parameters: {
    data: { type: 'string', description: 'JSON-encoded data to analyze', required: true },
    analysis_type: { type: 'string', description: 'Type of analysis', enum: ['summary', 'statistics', 'trends', 'anomalies'], required: false },
  },
  async execute(params) {
    const { data: rawData, analysis_type = 'summary' } = params as { data: string; analysis_type?: string }
    try {
      const parsed = JSON.parse(rawData)
      const items = Array.isArray(parsed) ? parsed : [parsed]
      const keys = items.length > 0 ? Object.keys(items[0]) : []

      const result: Record<string, unknown> = {
        recordCount: items.length,
        fields: keys,
        analysisType: analysis_type,
      }

      if (analysis_type === 'statistics' && items.length > 0) {
        const numericFields: Record<string, number[]> = {}
        for (const key of keys) {
          const vals = items.map((i) => Number(i[key])).filter((n) => !isNaN(n))
          if (vals.length > 0) {
            numericFields[key] = vals
          }
        }
        result.statistics = Object.fromEntries(
          Object.entries(numericFields).map(([k, vals]) => [
            k,
            {
              min: Math.min(...vals),
              max: Math.max(...vals),
              avg: vals.reduce((a, b) => a + b, 0) / vals.length,
              count: vals.length,
            },
          ]),
        )
      }

      return { success: true, data: result }
    } catch {
      return { success: false, data: null, error: 'Could not parse data for analysis' }
    }
  },
})
