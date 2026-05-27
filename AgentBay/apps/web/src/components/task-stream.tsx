'use client';
import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@agentbay/ui';
import { useTaskStream } from '../lib/socket.js';

interface TaskStreamProps {
  readonly taskId: string;
  readonly enabled: boolean;
  readonly onComplete?: (resultHash: string) => void;
}

export function TaskStream({ taskId, enabled, onComplete }: TaskStreamProps) {
  const { connected, outputText, events } = useTaskStream({
    taskId,
    enabled,
    ...(onComplete !== undefined && { onComplete }),
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputText]);

  const stepCount = events.filter((e) => e.type === 'step-finish').length;
  const isComplete = events.some((e) => e.type === 'task-complete');
  const hasError = events.some((e) => e.type === 'task-error');

  if (!enabled && !outputText) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            isComplete
              ? 'bg-green-500'
              : hasError
                ? 'bg-red-500'
                : connected
                  ? 'animate-pulse bg-violet-500'
                  : 'bg-zinc-600'
          }`}
        />
        <span className="text-xs text-zinc-400">
          {isComplete
            ? 'Completed'
            : hasError
              ? 'Error'
              : connected
                ? `Working… ${stepCount > 0 ? `(${stepCount.toString()} steps)` : ''}`
                : 'Connecting…'}
        </span>
      </div>

      {outputText && (
        <Card>
          <CardContent className="p-4">
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-zinc-300">
              {outputText}
            </pre>
            <div ref={bottomRef} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
