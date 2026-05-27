// The JudgeRuntime uses generateObject to produce a structured, rubric-based
// evaluation of an agent's output. It is called by acceptWork() to assist the
// poster before they decide to accept or dispute.
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { JudgeInput, JudgeResult } from './types.js';

// Use Sonnet for judging — reliable structured output, lower cost than Opus.
const JUDGE_MODEL = 'claude-sonnet-4-6';

const judgementSchema = z.object({
  criteriaScores: z.array(
    z.object({
      name: z.string(),
      score: z.number().min(0).max(100),
      feedback: z.string(),
    }),
  ),
  summary: z.string(),
});

export class JudgeRuntime {
  async evaluate(input: JudgeInput): Promise<JudgeResult> {
    const criteriaBlock = input.rubric.criteria
      .map((c, i) => `${(i + 1).toString()}. **${c.name}** (weight ${(c.weight * 100).toFixed(0)}%): ${c.description}`)
      .join('\n');

    const systemPrompt = `You are an objective evaluator assessing AI agent outputs for a task marketplace.

Evaluate the agent's output against each rubric criterion. For each criterion, assign a score from 0 to 100 (100 = perfectly satisfies the criterion) and provide specific, actionable feedback.

Be rigorous and honest. Do not inflate scores. If the output is incomplete, factually wrong, or doesn't address the criterion, score accordingly.`;

    const userPrompt = `**Task description:**
${input.taskDescription}

**Agent output:**
${input.agentOutput}

**Rubric (evaluate each criterion independently):**
${criteriaBlock}

Return your evaluation with a score (0–100) and specific feedback for each criterion, then a brief overall summary.`;

    const { object } = await generateObject({
      model: anthropic(JUDGE_MODEL),
      system: systemPrompt,
      prompt: userPrompt,
      schema: judgementSchema,
    });

    // Validate that all criteria are covered
    const scoredNames = new Set(object.criteriaScores.map((s) => s.name));
    const allNames = new Set(input.rubric.criteria.map((c) => c.name));
    for (const name of allNames) {
      if (!scoredNames.has(name)) {
        object.criteriaScores.push({ name, score: 0, feedback: 'Not evaluated by judge.' });
      }
    }

    // Compute weighted overall score
    const weightedScore = input.rubric.criteria.reduce((acc, criterion) => {
      const scored = object.criteriaScores.find((s) => s.name === criterion.name);
      return acc + (scored?.score ?? 0) * criterion.weight;
    }, 0);

    const passed = weightedScore >= input.rubric.minPassingScore;

    return {
      passed,
      score: Math.round(weightedScore),
      summary: object.summary,
      criteriaScores: object.criteriaScores,
    };
  }
}

// ── Default rubric (used when the task poster doesn't specify one) ─────────────

export const DEFAULT_RUBRIC = {
  criteria: [
    {
      name: 'Task completion',
      description: 'Did the agent fully complete the requested task? Are all deliverables present?',
      weight: 0.4,
    },
    {
      name: 'Accuracy',
      description: 'Is the content factually accurate and free from hallucinations?',
      weight: 0.3,
    },
    {
      name: 'Quality',
      description: 'Is the output well-structured, clear, and professional?',
      weight: 0.2,
    },
    {
      name: 'Conciseness',
      description: 'Is the output appropriately sized — not padded, not truncated?',
      weight: 0.1,
    },
  ],
  minPassingScore: 70,
} as const satisfies import('./types.js').JudgeRubric;
