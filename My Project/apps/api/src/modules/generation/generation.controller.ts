import { Request, Response, NextFunction } from 'express';
import { generateAll } from './generation.service';
import db from '../../config/db';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const GenerateInputSchema = z.object({
  idea: z.string().min(10, 'Idea must be at least 10 characters').max(500),
  projectName: z.string().optional(),
});

export async function handleGenerate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = GenerateInputSchema.parse(req.body);
    const userId = (req as any).user?.id;

    // Create project record
    const projectId = uuidv4();
    await db('projects').insert({
      id: projectId,
      user_id: userId || null,
      idea_text: input.idea,
      project_name: input.projectName || `Project ${new Date().toLocaleDateString()}`,
      status: 'generating',
      created_at: new Date(),
    });

    const { output, totalTokens, fromCache } = await generateAll(input.idea);

    // Save generation result
    await db('generations').insert({
      id: uuidv4(),
      project_id: projectId,
      output: JSON.stringify(output),
      tokens_used: totalTokens,
      from_cache: fromCache,
      created_at: new Date(),
    });

    // Update project status
    await db('projects').where({ id: projectId }).update({ status: 'completed' });

    res.json({
      success: true,
      projectId,
      output,
      meta: { tokensUsed: totalTokens, fromCache },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleGetGeneration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { projectId } = req.params;
    const generation = await db('generations')
      .join('projects', 'generations.project_id', 'projects.id')
      .where('generations.project_id', projectId)
      .select('generations.*', 'projects.idea_text', 'projects.project_name')
      .first();

    if (!generation) {
      res.status(404).json({ error: 'Generation not found' });
      return;
    }

    res.json({
      success: true,
      projectId,
      projectName: generation.project_name,
      idea: generation.idea_text,
      output: JSON.parse(generation.output),
      meta: { tokensUsed: generation.tokens_used, fromCache: generation.from_cache },
    });
  } catch (err) {
    next(err);
  }
}

