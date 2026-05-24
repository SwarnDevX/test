import { useState, useEffect, useRef, useCallback } from "react";
import { api, connectWebSocket } from "../api/client";

export function useWebSocket(onUpdate?: (data: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    wsRef.current = connectWebSocket((data) => {
      onUpdate?.(data);
    });
    return () => { wsRef.current?.close(); };
  }, []);

  return wsRef;
}

export function useIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (params?: Record<string, string>) => {
    setLoading(true);
    try {
      const { data } = await api.get("/issues", { params });
      setIssues(data.issues);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to load issues", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return { issues, total, loading, reload: load };
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    api.get("/metrics").then((r) => setMetrics(r.data)).catch(() => {});
  }, []);

  return metrics;
}

