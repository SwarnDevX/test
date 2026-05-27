"use client";

import Link from "next/link";
import { Rocket, ExternalLink, Globe, MessageSquare, Webhook, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatRelative, cn } from "@/lib/utils";

const TYPE_ICONS = {
  CHATBOT: MessageSquare,
  API_ENDPOINT: Webhook,
  FORM: Globe,
  VOICE_BOT: Globe,
} as const;

export default function DeploymentsPage() {
  const { data, isLoading } = trpc.deployment.list.useQuery();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Deployments</h1>
          <p className="text-sm text-fg-muted mt-0.5">Live chatbots, API endpoints, and embeddable forms</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-bg-surface-1 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.map((dep) => {
            const Icon = TYPE_ICONS[dep.type as keyof typeof TYPE_ICONS] ?? Rocket;
            return (
              <div
                key={dep.id}
                className="p-5 rounded-xl border border-border/60 bg-bg-surface-1"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-fg-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{dep.name}</div>
                    <div className="text-xs text-fg-muted capitalize">{dep.type.replace(/_/g, " ")}</div>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0 mt-1", dep.status === "active" ? "bg-success" : "bg-fg-muted/30")} />
                </div>
                {dep.publicUrl && (
                  <a
                    href={dep.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {dep.publicUrl}
                  </a>
                )}
                <div className="text-xs text-fg-muted mt-2">Updated {formatRelative(dep.updatedAt)}</div>
              </div>
            );
          })}
          {!data?.length && (
            <div className="col-span-2 py-16 text-center rounded-xl border border-dashed border-border/60">
              <Rocket className="w-10 h-10 text-fg-muted/30 mx-auto mb-3" />
              <p className="text-sm text-fg-muted">No deployments yet</p>
              <p className="text-xs text-fg-muted mt-1">Deploy a workflow as a chatbot or API endpoint from the editor</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
