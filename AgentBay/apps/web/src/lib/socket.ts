'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { tasks as tasksApi } from './api.js';

const REALTIME_URL = process.env['NEXT_PUBLIC_REALTIME_URL'] ?? 'http://localhost:3002';

export type StreamEvent =
  | { type: 'text-delta'; text: string }
  | { type: 'step-finish'; stepIndex: number; inputTokens: number; outputTokens: number }
  | { type: 'finish'; output: string; finishReason: string }
  | { type: 'task-complete'; taskId: string; resultHash: string }
  | { type: 'task-error'; taskId: string; message: string };

export interface UseTaskStreamOptions {
  taskId: string;
  enabled?: boolean;
  onComplete?: (resultHash: string) => void;
  onError?: (message: string) => void;
}

export function useTaskStream({ taskId, enabled = true, onComplete, onError }: UseTaskStreamOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [outputText, setOutputText] = useState('');

  const addEvent = useCallback((event: StreamEvent) => {
    setEvents((prev) => [...prev, event]);
    if (event.type === 'text-delta') {
      setOutputText((prev) => prev + event.text);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !taskId) return;

    let cancelled = false;

    async function connect() {
      try {
        const { token } = await tasksApi.realtimeToken(taskId);
        if (cancelled) return;

        const socket = io(REALTIME_URL, {
          auth: { token },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          setConnected(true);
          socket.emit('subscribe', taskId);
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('task:stream', (event: StreamEvent) => addEvent(event));
        socket.on('task:step-finish', (event: StreamEvent) => addEvent(event));

        socket.on('task:complete', (event: StreamEvent & { type: 'task-complete' }) => {
          addEvent(event);
          onComplete?.(event.resultHash);
        });

        socket.on('task:error', (event: StreamEvent & { type: 'task-error' }) => {
          addEvent(event);
          onError?.(event.message);
        });
      } catch {
        // Realtime token fetch failed — realtime unavailable (non-fatal)
      }
    }

    void connect();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [taskId, enabled, addEvent, onComplete, onError]);

  return { connected, events, outputText };
}
