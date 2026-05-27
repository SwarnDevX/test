import * as React from "react";

import { cn } from "../lib/utils.js";
import { Button } from "./button.js";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-8 text-center", className)}>
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[14px] border border-[oklch(var(--border)/0.5)] bg-[oklch(var(--bg-surface-2))]">
          <span className="text-[oklch(var(--fg-muted))]">{icon}</span>
        </div>
      )}
      <h3 className="text-base font-semibold text-[oklch(var(--fg))] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[oklch(var(--fg-muted))] max-w-sm leading-relaxed mb-6">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2">
          {action && (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button size="sm" variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Illustrated empty states with SVG
export function WorkflowsEmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <EmptyState
      icon={
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect x="2" y="8" width="12" height="8" rx="3" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
          <rect x="18" y="16" width="12" height="8" rx="3" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
          <path d="M14 12h4M14 20h4" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
          <circle cx="16" cy="16" r="1.5" fill="currentColor" fillOpacity="0.6" />
        </svg>
      }
      title="No workflows yet"
      description="Create your first workflow to start automating. Use a template or start from scratch."
      action={{ label: "Create Workflow", onClick: onCreateClick }}
      secondaryAction={{ label: "Browse Templates", onClick: () => {} }}
    />
  );
}

export function ExecutionsEmptyState() {
  return (
    <EmptyState
      icon={
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="10" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" />
          <path d="M12 16l3 3 5-5" stroke="currentColor" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      }
      title="No executions yet"
      description="Run a workflow to see execution history, logs, and outputs here."
    />
  );
}
