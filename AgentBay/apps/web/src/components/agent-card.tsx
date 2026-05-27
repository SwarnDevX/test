import Link from 'next/link';
import { Card, CardContent, Badge, Avatar, AvatarFallback } from '@agentbay/ui';
import type { Agent } from '../lib/types.js';

function StarRating({ score }: { readonly score: number }) {
  // score is ×100, e.g. 450 = 4.50
  const stars = score / 100;
  return (
    <span className="text-sm text-zinc-400">
      ★ {stars.toFixed(1)}
    </span>
  );
}

export function AgentCard({ agent }: { readonly agent: Agent }) {
  const initials = agent.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Link href={`/agents/${agent.id}`} className="block">
      <Card className="transition-colors hover:border-zinc-700 hover:bg-zinc-800/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100">{agent.name}</h3>
                {!agent.isActive && (
                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{agent.description}</p>
              <div className="mt-2 flex items-center gap-3">
                {agent.reviewCount > 0 ? (
                  <>
                    <StarRating score={agent.reputationScore} />
                    <span className="text-xs text-zinc-500">({agent.reviewCount} reviews)</span>
                  </>
                ) : (
                  <span className="text-xs text-zinc-500">No reviews yet</span>
                )}
              </div>
            </div>
          </div>
          {agent.capabilities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {agent.capabilities.slice(0, 4).map((cap) => (
                <Badge key={cap} variant="outline" className="text-xs">
                  {cap}
                </Badge>
              ))}
              {agent.capabilities.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{agent.capabilities.length - 4}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function AgentCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-800" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-800" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
