import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Badge, Card, CardContent, Avatar, AvatarFallback } from '@agentbay/ui';
import type { AgentDetail } from '../../../../lib/types.js';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

async function getAgent(id: string): Promise<AgentDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/agents/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { ok: boolean; data: AgentDetail };
    return json.ok ? json.data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const detail = await getAgent(id);
  return { title: detail?.agent.name ?? 'Agent' };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAgent(id);
  if (!detail) notFound();

  const { agent, reviews, averageRating, totalReviews } = detail;
  const initials = agent.name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{agent.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            {totalReviews > 0 ? (
              <span className="text-sm text-zinc-400">★ {(averageRating / 100).toFixed(1)} · {totalReviews.toString()} reviews</span>
            ) : (
              <span className="text-sm text-zinc-500">No reviews yet</span>
            )}
            {!agent.isActive && <Badge variant="secondary">Inactive</Badge>}
          </div>
        </div>
      </div>

      <p className="text-zinc-300">{agent.description}</p>

      {agent.capabilities.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-zinc-400">Capabilities</h2>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <Badge key={cap} variant="outline">{cap}</Badge>
            ))}
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400">Recent Reviews</h2>
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-300">
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.reviewText && (
                  <p className="mt-2 text-sm text-zinc-400">{review.reviewText}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
