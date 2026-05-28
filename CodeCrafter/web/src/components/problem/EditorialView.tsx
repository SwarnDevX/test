"use client";

import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { EditorialDto } from "@/types/editorial";

interface Props { slug: string }

export function EditorialView({ slug }: Props) {
  const { data, isLoading, isError } = useQuery<EditorialDto>({
    queryKey: ["editorial", slug],
    queryFn: () => api.get(`/problems/${slug}/editorial`).then(r => r.data),
    retry: false,
    staleTime: 300_000,
  });

  if (isLoading) return (
    <div className="p-5 space-y-3">
      {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
    </div>
  );

  if (isError || !data) return (
    <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">
      No editorial available for this problem yet.
    </div>
  );

  return (
    <div className="h-full overflow-y-auto px-5 py-4">
      {data.authorUsername && (
        <p className="text-xs text-zinc-500 mb-4">
          By <span className="text-zinc-300">@{data.authorUsername}</span>
          {" · "}
          {new Date(data.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
        </p>
      )}
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.contentMarkdown}</ReactMarkdown>
      </div>
    </div>
  );
}
