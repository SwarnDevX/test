import { NextRequest, NextResponse } from 'next/server'
import { obsTracker } from '../../../src/observability/tracker'
import prisma from '../../../src/db/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const range = (searchParams.get('range') ?? '24h') as '24h' | '7d' | '30d'

    const [metrics, recentEvents, traces] = await Promise.all([
      obsTracker.getMetrics(range),
      obsTracker.getRecentEvents(30),
      prisma.agentTrace.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          traceType: true,
          status: true,
          totalTokens: true,
          totalCost: true,
          latencyMs: true,
          createdAt: true,
          input: true,
        },
      }),
    ])

    // Build hourly activity chart (last 24 data points)
    const now = Date.now()
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hourStart = new Date(now - (23 - i) * 3600000)
      const hourEnd = new Date(hourStart.getTime() + 3600000)
      return recentEvents.filter(
        (e) => new Date(e.createdAt) >= hourStart && new Date(e.createdAt) < hourEnd,
      ).length
    })

    return NextResponse.json({
      metrics,
      charts: { hourly: hourlyData },
      recentEvents: recentEvents.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        agent: e.agent,
        tokens: e.tokens,
        latencyMs: e.latencyMs,
        cost: e.cost,
        createdAt: e.createdAt,
      })),
      recentTraces: traces.map((t) => ({
        ...t,
        inputPreview: (() => { try { return JSON.parse(t.input)?.message?.slice(0, 80) ?? '' } catch { return '' } })(),
      })),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
