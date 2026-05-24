import { Request, Response, NextFunction } from 'express';
import db from '../../config/db';
import { v4 as uuidv4 } from 'uuid';
import openai, { MODEL } from '../../config/openai';
import { buildCacheKey, getCache, setCache } from '../../cache/cacheManager';

export async function trackEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId, eventType, payload } = req.body;

    await db('analytics_events').insert({
      id: uuidv4(),
      project_id: projectId,
      event_type: eventType,
      payload: JSON.stringify(payload || {}),
      created_at: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;

    const events = await db('analytics_events')
      .where({ project_id: projectId })
      .orderBy('created_at', 'desc')
      .limit(100);

    const summary = {
      totalEvents: events.length,
      eventBreakdown: events.reduce(
        (acc: Record<string, number>, e: any) => {
          acc[e.event_type] = (acc[e.event_type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      recentEvents: events.slice(0, 10),
    };

    res.json({ success: true, analytics: summary });
  } catch (err) {
    next(err);
  }
}

export async function getAISuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;

    const cacheKey = buildCacheKey('suggestions', projectId);
    const cached = await getCache<{ suggestions: unknown }>(cacheKey);
    if (cached) {
      res.json({ success: true, ...cached, fromCache: true });
      return;
    }

    const [project, events, generation] = await Promise.all([
      db('projects').where({ id: projectId }).first(),
      db('analytics_events').where({ project_id: projectId }).orderBy('created_at', 'desc').limit(50),
      db('generations').where({ project_id: projectId }).first(),
    ]);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const eventSummary = events.reduce(
      (acc: Record<string, number>, e: any) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const aiResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a growth analytics expert. Analyze user behavior data and provide actionable improvement suggestions. Return ONLY valid JSON.`,
        },
        {
          role: 'user',
          content: `Analyze this startup's performance data and suggest improvements:

Startup Idea: ${project.idea_text}

Analytics Summary (event counts):
${JSON.stringify(eventSummary, null, 2)}

Total events tracked: ${events.length}

Return JSON:
{
  "overallScore": 85,
  "insights": [
    { "type": "warning|success|info", "title": "Insight title", "description": "Insight detail" }
  ],
  "improvements": [
    { "priority": "high|medium|low", "area": "CTA|SEO|Copy|Pricing", "suggestion": "Specific improvement", "impact": "Expected impact" }
  ],
  "abTestIdeas": ["A/B test idea 1", "A/B test idea 2", "A/B test idea 3"]
}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const suggestions = JSON.parse(aiResponse.choices[0].message.content || '{}');
    await setCache(cacheKey, { suggestions }, 60 * 30); // 30 min TTL for suggestions

    res.json({ success: true, suggestions, fromCache: false });
  } catch (err) {
    next(err);
  }
}

