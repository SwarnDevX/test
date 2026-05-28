"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { SolutionComments } from "./SolutionComments";
import type { SolutionDto } from "@/types/editorial";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface PageData { content: SolutionDto[]; totalElements: number; last: boolean }

interface Props { slug: string }

function SolutionCard({ solution, slug }: { solution: SolutionDto; slug: string }) {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const queryClient = useQueryClient();

  const voteMutation = useMutation({
    mutationFn: (value: number) =>
      api.post(`/solutions/${solution.id}/vote?value=${value}`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["solutions", slug] }),
  });

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900/50">
        <div className="flex items-start gap-3">
          {/* Votes */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <button onClick={() => voteMutation.mutate(1)}
              className={`p-1 rounded hover:bg-zinc-800 transition-colors ${solution.myVote === 1 ? "text-emerald-400" : "text-zinc-500"}`}>
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs font-semibold text-zinc-300">{solution.voteScore}</span>
            <button onClick={() => voteMutation.mutate(-1)}
              className={`p-1 rounded hover:bg-zinc-800 transition-colors ${solution.myVote === -1 ? "text-red-400" : "text-zinc-500"}`}>
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <button onClick={() => setExpanded(!expanded)}
              className="w-full text-left">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-zinc-100 hover:text-emerald-400 transition-colors">
                  {solution.title}
                </span>
                {expanded ? <ChevronUp className="h-4 w-4 text-zinc-500 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-zinc-500 flex-shrink-0" />}
              </div>
            </button>
            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
              <span>@{solution.authorUsername}</span>
              {solution.language && <span className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 capitalize">{solution.language}</span>}
              <span>{timeAgo(solution.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-zinc-800">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{solution.contentMarkdown}</ReactMarkdown>
          </div>
          <button onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors mt-3">
            <MessageSquare className="h-3.5 w-3.5" />
            {solution.commentCount} comment{solution.commentCount !== 1 ? "s" : ""}
          </button>
          {showComments && <SolutionComments solutionId={solution.id} />}
        </div>
      )}
    </div>
  );
}

function CreateSolutionForm({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.post(`/problems/${slug}/solutions`, {
      title, contentMarkdown: content, language: language || null,
    }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solutions", slug] });
      onClose();
    },
  });

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-200">Post a Solution</h3>
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Solution title"
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-600"
      />
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={8}
        placeholder="Describe your approach (Markdown supported)…"
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 resize-none focus:outline-none focus:border-emerald-600 font-mono"
      />
      <div className="flex items-center gap-2">
        <select value={language} onChange={e => setLanguage(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none">
          <option value="">Any language</option>
          {["java","python","cpp","c","javascript","go","rust"].map(l => (
            <option key={l} value={l} className="capitalize">{l}</option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">Cancel</Button>
          <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-500"
            disabled={!title.trim() || !content.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}>
            Publish
          </Button>
        </div>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-400">{(mutation.error as Error).message}</p>
      )}
    </div>
  );
}

export function SolutionList({ slug }: Props) {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<PageData>({
    queryKey: ["solutions", slug],
    queryFn: () => api.get(`/problems/${slug}/solutions`).then(r => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{data?.totalElements ?? 0} solution{data?.totalElements !== 1 ? "s" : ""}</p>
        <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-500"
          onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" />New Solution
        </Button>
      </div>

      {showForm && <CreateSolutionForm slug={slug} onClose={() => setShowForm(false)} />}

      {isLoading
        ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
        : data?.content.map(s => <SolutionCard key={s.id} solution={s} slug={slug} />)}

      {!isLoading && !data?.content.length && !showForm && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-zinc-500">
          <p className="text-sm">No solutions yet.</p>
          <button onClick={() => setShowForm(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Be the first to post →
          </button>
        </div>
      )}
    </div>
  );
}
