"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { SolutionCommentDto } from "@/types/editorial";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface CommentNodeProps {
  comment: SolutionCommentDto;
  solutionId: number;
  depth?: number;
}

function CommentNode({ comment, solutionId, depth = 0 }: CommentNodeProps) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: (text: string) =>
      api.post(`/solutions/${solutionId}/comments`, { contentMarkdown: text, parentId: comment.id }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solution-comments", solutionId] });
      setReplyText("");
      setShowReply(false);
    },
  });

  return (
    <div className={`${depth > 0 ? "ml-5 border-l border-zinc-800 pl-3" : ""}`}>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-zinc-300">@{comment.authorUsername}</span>
          <span className="text-xs text-zinc-600">{timeAgo(comment.createdAt)}</span>
        </div>
        <div className="prose prose-invert prose-xs max-w-none text-zinc-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.contentMarkdown}</ReactMarkdown>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <ThumbsUp className="h-3 w-3" />{comment.voteScore}
          </span>
          {depth === 0 && (
            <button onClick={() => setShowReply(!showReply)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Reply
            </button>
          )}
        </div>
        {showReply && (
          <div className="mt-2 flex gap-2">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={2}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 resize-none focus:outline-none focus:border-emerald-600"
              placeholder="Write a reply…"
            />
            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500"
              disabled={!replyText.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate(replyText)}>
              Post
            </Button>
          </div>
        )}
      </div>
      {comment.replies.map(r => (
        <CommentNode key={r.id} comment={r} solutionId={solutionId} depth={depth + 1} />
      ))}
    </div>
  );
}

interface Props { solutionId: number }

export function SolutionComments({ solutionId }: Props) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data = [], isLoading } = useQuery<SolutionCommentDto[]>({
    queryKey: ["solution-comments", solutionId],
    queryFn: () => api.get(`/solutions/${solutionId}/comments`).then(r => r.data),
    staleTime: 60_000,
  });

  const addMutation = useMutation({
    mutationFn: (text: string) =>
      api.post(`/solutions/${solutionId}/comments`, { contentMarkdown: text }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solution-comments", solutionId] });
      setNewComment("");
    },
  });

  return (
    <div className="mt-4 border-t border-zinc-800 pt-3">
      <p className="text-xs font-semibold text-zinc-400 mb-2">Comments</p>
      {isLoading
        ? <Skeleton className="h-8 w-full" />
        : data.map(c => <CommentNode key={c.id} comment={c} solutionId={solutionId} />)}

      <div className="mt-2 flex gap-2">
        <textarea
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={2}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 resize-none focus:outline-none focus:border-emerald-600"
          placeholder="Add a comment…"
        />
        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 self-end"
          disabled={!newComment.trim() || addMutation.isPending}
          onClick={() => addMutation.mutate(newComment)}>
          Post
        </Button>
      </div>
    </div>
  );
}
