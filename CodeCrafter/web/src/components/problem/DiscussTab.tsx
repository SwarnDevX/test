"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { DiscussionDto, DiscussionReplyDto } from "@/types/editorial";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ReplyNode({ reply, discussionId, depth = 0 }: { reply: DiscussionReplyDto; discussionId: number; depth?: number }) {
  const [showReply, setShowReply] = useState(false);
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/discuss/${discussionId}/replies`, { contentMarkdown: content, parentId: reply.id }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discuss-replies", discussionId] });
      setText(""); setShowReply(false);
    },
  });

  return (
    <div className={depth > 0 ? "ml-5 border-l border-zinc-800 pl-3" : ""}>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          {reply.isAnswer && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />}
          <span className="text-xs font-medium text-zinc-300">@{reply.authorUsername}</span>
          <span className="text-xs text-zinc-600">{timeAgo(reply.createdAt)}</span>
        </div>
        <div className="prose prose-invert prose-xs max-w-none text-zinc-300">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.contentMarkdown}</ReactMarkdown>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <ThumbsUp className="h-3 w-3" />{reply.voteScore}
          </span>
          {depth === 0 && (
            <button onClick={() => setShowReply(!showReply)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Reply</button>
          )}
        </div>
        {showReply && (
          <div className="mt-2 flex gap-2">
            <textarea value={text} onChange={e => setText(e.target.value)} rows={2}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 resize-none focus:outline-none focus:border-emerald-600"
              placeholder="Write a reply…" />
            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 self-end"
              disabled={!text.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate(text)}>Post</Button>
          </div>
        )}
      </div>
      {reply.replies.map(r => <ReplyNode key={r.id} reply={r} discussionId={discussionId} depth={depth + 1} />)}
    </div>
  );
}

function DiscussionCard({ discussion, slug }: { discussion: DiscussionDto; slug: string }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const queryClient = useQueryClient();

  const { data: repliesData } = useQuery<{ content: DiscussionReplyDto[] }>({
    queryKey: ["discuss-replies", discussion.id],
    queryFn: () => api.get(`/discuss/${discussion.id}/replies`).then(r => r.data),
    enabled: expanded,
    staleTime: 60_000,
  });

  const addReplyMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/discuss/${discussion.id}/replies`, { contentMarkdown: content }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discuss-replies", discussion.id] });
      queryClient.invalidateQueries({ queryKey: ["problem-discuss", slug] });
      setReplyText("");
    },
  });

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900/50">
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {discussion.isAnswered && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                <span className="text-sm font-medium text-zinc-100 hover:text-emerald-400 transition-colors">
                  {discussion.title}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                <span>@{discussion.authorUsername}</span>
                <span>{timeAgo(discussion.createdAt)}</span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" />{discussion.voteScore}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />{discussion.replyCount}
                </span>
              </div>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" /> : <ChevronDown className="h-4 w-4 text-zinc-500 flex-shrink-0 mt-0.5" />}
          </div>
        </button>
      </div>

      {expanded && (
        <div className="px-4 py-3 border-t border-zinc-800 space-y-3">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{discussion.contentMarkdown}</ReactMarkdown>
          </div>

          {repliesData?.content.map(r => (
            <ReplyNode key={r.id} reply={r} discussionId={discussion.id} />
          ))}

          <div className="flex gap-2 pt-2">
            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2}
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-200 resize-none focus:outline-none focus:border-emerald-600"
              placeholder="Write a reply…" />
            <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 self-end"
              disabled={!replyText.trim() || addReplyMutation.isPending}
              onClick={() => addReplyMutation.mutate(replyText)}>Reply</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateDiscussionForm({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/problems/${slug}/discuss`, { title, contentMarkdown: content }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problem-discuss", slug] });
      onClose();
    },
  });

  return (
    <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-200">Start a Discussion</h3>
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-600" />
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={5}
        placeholder="What's your question or thought? (Markdown supported)"
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 resize-none focus:outline-none focus:border-emerald-600" />
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">Cancel</Button>
        <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-500"
          disabled={!title.trim() || !content.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}>Post</Button>
      </div>
    </div>
  );
}

interface Props { slug: string }

export function DiscussTab({ slug }: Props) {
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<{ content: DiscussionDto[]; totalElements: number }>({
    queryKey: ["problem-discuss", slug],
    queryFn: () => api.get(`/problems/${slug}/discuss`).then(r => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="h-full overflow-y-auto px-5 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">{data?.totalElements ?? 0} discussion{data?.totalElements !== 1 ? "s" : ""}</p>
        <Button size="sm" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-500"
          onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" />New Post
        </Button>
      </div>

      {showForm && <CreateDiscussionForm slug={slug} onClose={() => setShowForm(false)} />}

      {isLoading
        ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
        : data?.content.map(d => <DiscussionCard key={d.id} discussion={d} slug={slug} />)}

      {!isLoading && !data?.content.length && !showForm && (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-zinc-500">
          <p className="text-sm">No discussions yet.</p>
          <button onClick={() => setShowForm(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            Start the conversation →
          </button>
        </div>
      )}
    </div>
  );
}
