import { useQuery } from '@tanstack/react-query';
import client from '../api/client';
import { useEffect, useRef } from 'react';

export function useAnalytics(projectId: string | null) {
  return useQuery({
    queryKey: ['analytics', projectId],
    queryFn: async () => {
      const res = await client.get(`/analytics/${projectId}`);
      return res.data.analytics;
    },
    enabled: !!projectId,
    refetchInterval: 30000,
  });
}

export function useAISuggestions(projectId: string | null) {
  return useQuery({
    queryKey: ['suggestions', projectId],
    queryFn: async () => {
      const res = await client.get(`/analytics/${projectId}/suggestions`);
      return res.data.suggestions;
    },
    enabled: !!projectId,
    staleTime: 30 * 60 * 1000,
  });
}

export function useTrackEvent() {
  return async (projectId: string, eventType: string, payload?: object) => {
    try {
      await client.post('/analytics/event', { projectId, eventType, payload });
    } catch {
      // silently fail analytics tracking
    }
  };
}

