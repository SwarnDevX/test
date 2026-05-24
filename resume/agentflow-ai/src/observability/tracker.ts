import prisma from '../db/client'
import type { ObsEventData, DashboardMetrics } from '../types'

export const obsTracker = {
  async record(event: ObsEventData): Promise<void> {
    try {
      await prisma.obsEvent.create({
        data: {
          eventType: event.eventType,
          agent: event.agent,
          model: event.model,
          tokens: event.tokens,
          latencyMs: event.latencyMs,
          cost: event.cost,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        },
      })
    } catch {
      // Non-fatal — don't crash on observability failure
    }
  },

  async getMetrics(range: '24h' | '7d' | '30d' = '24h'): Promise<DashboardMetrics> {
    const now = new Date()
    const msMap = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }
    const since = new Date(now.getTime() - msMap[range])
    const todaySince = new Date(now.getTime() - 86400000)

    try {
      const [all, today, errors] = await Promise.all([
        prisma.obsEvent.findMany({ where: { createdAt: { gte: since } } }),
        prisma.obsEvent.findMany({ where: { createdAt: { gte: todaySince } } }),
        prisma.obsEvent.count({
          where: { createdAt: { gte: since }, eventType: 'error' },
        }),
      ])

      const totalRequests = all.filter((e) => e.eventType === 'agent_step').length
      const totalTokens = all.reduce((s, e) => s + (e.tokens ?? 0), 0)
      const totalCost = all.reduce((s, e) => s + (e.cost ?? 0), 0)
      const latencies = all.filter((e) => e.latencyMs).map((e) => e.latencyMs!)
      const avgLatencyMs =
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : 0

      return {
        totalRequests,
        totalTokens,
        totalCost: Math.round(totalCost * 10000) / 10000,
        avgLatencyMs,
        errorRate: totalRequests > 0 ? errors / totalRequests : 0,
        requestsToday: today.filter((e) => e.eventType === 'agent_step').length,
        tokensToday: today.reduce((s, e) => s + (e.tokens ?? 0), 0),
        costToday:
          Math.round(today.reduce((s, e) => s + (e.cost ?? 0), 0) * 10000) / 10000,
      }
    } catch {
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        avgLatencyMs: 0,
        errorRate: 0,
        requestsToday: 0,
        tokensToday: 0,
        costToday: 0,
      }
    }
  },

  async getRecentEvents(limit = 50) {
    try {
      return await prisma.obsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
    } catch {
      return []
    }
  },

  estimateCost(model: string, promptTokens: number, completionTokens: number): number {
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4o': { prompt: 0.000005, completion: 0.000015 },
      'gpt-4o-mini': { prompt: 0.00000015, completion: 0.0000006 },
      'gpt-3.5-turbo': { prompt: 0.0000005, completion: 0.0000015 },
      'text-embedding-3-small': { prompt: 0.00000002, completion: 0 },
    }
    const p = pricing[model] ?? { prompt: 0.000005, completion: 0.000015 }
    return promptTokens * p.prompt + completionTokens * p.completion
  },
}
