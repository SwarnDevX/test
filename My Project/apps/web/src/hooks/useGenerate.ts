import { useMutation } from '@tanstack/react-query';
import client from '../api/client';
import { useProjectStore, GenerationOutput } from '../store/projectStore';
import toast from 'react-hot-toast';

export function useGenerate() {
  const { setGenerating, setResult } = useProjectStore();

  return useMutation({
    mutationFn: async (payload: { idea: string; projectName?: string }) => {
      setGenerating(true);
      const res = await client.post('/generate', payload);
      return res.data as { projectId: string; output: GenerationOutput; meta: { tokensUsed: number; fromCache: boolean } };
    },
    onSuccess: (data, variables) => {
      setResult(data.projectId, variables.idea, data.output);
      toast.success(
        data.meta.fromCache
          ? '⚡ Results loaded from cache!'
          : `✅ Generation complete! (${data.meta.tokensUsed.toLocaleString()} tokens used)`
      );
    },
    onError: (err: any) => {
      setGenerating(false);
      const msg = err?.response?.data?.error || 'Generation failed. Please try again.';
      toast.error(msg);
    },
  });
}

