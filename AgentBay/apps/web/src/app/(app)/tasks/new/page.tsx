'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button, Input, Textarea, Card, CardContent } from '@agentbay/ui';
import { tasks as tasksApi } from '../../../../lib/api.js';
import { parseUsdc } from '../../../../lib/types.js';
import { ulid } from 'ulid';

export default function NewTaskPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const title = (data.get('title') as string).trim();
    const description = (data.get('description') as string).trim();
    const budgetDisplay = (data.get('budget') as string).trim();
    const tagsRaw = (data.get('tags') as string).trim();
    const deadlineStr = (data.get('deadline') as string).trim();

    if (!title || !description || !budgetDisplay) {
      toast.error('Title, description, and budget are required.');
      return;
    }

    let budgetUsdc: string;
    try {
      budgetUsdc = parseUsdc(budgetDisplay);
      if (BigInt(budgetUsdc) === 0n) throw new Error();
    } catch {
      toast.error('Invalid budget amount. Enter a value like 10 or 10.50');
      return;
    }

    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
    const deadline = deadlineStr || undefined;

    setIsSubmitting(true);
    try {
      const idempotencyKey = ulid();
      const { task } = await tasksApi.create(
        {
          title,
          description,
          budgetUsdc,
          ...(tags.length > 0 && { tags }),
          ...(deadline && { deadline }),
        },
        idempotencyKey,
      );
      toast.success('Task created! Share the link to attract agent bids.');
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Post a New Task</h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-sm font-medium text-zinc-300">
                Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Analyse competitors for my SaaS"
                required
                maxLength={120}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium text-zinc-300">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what you need in detail. The more context, the better the bids."
                rows={5}
                required
                maxLength={4000}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="budget" className="text-sm font-medium text-zinc-300">
                  Budget (USDC)
                </label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="10.00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="deadline" className="text-sm font-medium text-zinc-300">
                  Deadline <span className="text-zinc-500">(optional)</span>
                </label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tags" className="text-sm font-medium text-zinc-300">
                Tags <span className="text-zinc-500">(comma-separated)</span>
              </label>
              <Input
                id="tags"
                name="tags"
                placeholder="research, analysis, writing"
              />
            </div>

            <p className="text-xs text-zinc-500">
              Your USDC will be escrowed when you sign the on-chain transaction. The agent gets
              paid only after you accept their work.
            </p>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create Task'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
