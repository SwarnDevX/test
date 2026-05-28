"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2,
  Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import type { DiscussionDto, DiscussionReplyDto } from "@/types/editorial";

const CATEGORIES = ["GENERAL", "INTERVIEW", "CAREER", "COMPENSATION"];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ReplyNode({ reply, discussionId }: { reply: DiscussionReplyDto; discussionId: number }) {
  const [showReply, setShowReply] = useState(false);
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/discuss/${discussionId}/replies`, { contentMarkdown: content, parentId: reply.id }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-discuss-replies", discussionId] });
      setText(""); setShowReply(false);
    },
  });

  return (
    <div>
      <div className="py-2">
        <div className="flex items-center gap-2 mb-1">
          {reply.isAnswer && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
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
          <button onClick={() => setShowReply(!showReply)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">Reply</button>
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
      {reply.replies.map(r => (
        <div key={r.id} className="ml-5 border-l border-zinc-800 pl-3">
          <ReplyNode reply={r} discussionId={discussionId} />
        </div>
      ))}
    </div>
  );
}

function DiscussionCard({ discussion }: { discussion: DiscussionDto }) {
  const [expanded, setExpanded] = useState(false);
  const [replyText, setReplyText] = useState("");
  const queryClient = useQueryClient();

  const { data: repliesData } = useQuery<{ content: DiscussionReplyDto[] }>({
    queryKey: ["global-discuss-replies", discussion.id],
    queryFn: () => api.get(`/discuss/${discussion.id}/replies`).then(r => r.data),
    enabled: expanded,
    staleTime: 60_000,
  });

  const addReplyMutation = useMutation({
    mutationFn: (content: string) =>
      api.post(`/discuss/${discussion.id}/replies`, { contentMarkdown: content }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-discuss-replies", discussion.id] });
      queryClient.invalidateQueries({ queryKey: ["global-discuss"] });
      setReplyText("");
    },
  });

  const voteMutation = useMutation({
    mutationFn: (value: number) =>
      api.post(`/discuss/${discussion.id}/vote?value=${value}`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["global-discuss"] }),
  });

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-5 py-4 bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
        <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {discussion.isAnswered && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
                <span className="text-sm font-medium text-zinc-100 hover:text-emerald-400 transition-colors">
                  {discussion.title}
                </span>
                <span className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 capitalize">
                  {discussion.category.toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                <span>@{discussion.authorUsername}</span>
                {discussion.problemTitle && discussion.problemSlug && (
                  <Link href={`/problems/${discussion.problemSlug}`}
                    className="text-emerald-500 hover:text-emerald-400 truncate max-w-xs"
                    onClick={e => e.stopPropagation()}>
                    {discussion.problemTitle}
                  </Link>
                )}
                <span>{timeAgo(discussion.createdAt)}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{discussion.voteScore}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{discussion.replyCount}</span>
              </div>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />}
          </div>
        </button>
      </div>

      {expanded && (
        <div className="px-5 py-4 border-t border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => voteMutation.mutate(1)}
              className={`p-1 rounded hover:bg-zinc-800 ${discussion.myVote === 1 ? "text-emerald-400" : "text-zinc-500"}`}>
              <ThumbsUp className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-zinc-300">{discussion.voteScore}</span>
            <button onClick={() => voteMutation.mutate(-1)}
              className={`p-1 rounded hover:bg-zinc-800 ${discussion.myVote === -1 ? "text-red-400" : "text-zinc-500"}`}>
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>

          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{discussion.contentMarkdown}</ReactMarkdown>
          </div>

          {repliesData?.content.map(r => <ReplyNode key={r.id} reply={r} discussionId={discussion.id} />)}

          <div className="flex gap-2 pt-2 border-t border-zinc-800">
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

function CreateForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/discuss", { title, contentMarkdown: content, category }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["global-discuss"] });
      onClose();
    },
  });

  return (
    <div className="border border-zinc-700 rounded-lg p-5 bg-zinc-900 space-y-3">
      <h3 className="text-sm font-semibold text-zinc-200">Start a Discussion</h3>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-600" />
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
        placeholder="Share your thoughts… (Markdown supported)"
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 resize-none focus:outline-none focus:border-emerald-600" />
      <div className="flex items-center gap-3">
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none">
          {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
        </select>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs h-7">Cancel</Button>
          <Button size="sm" className="text-xs h-7 bg-emerald-600 hover:bg-emerald-500"
            disabled={!title.trim() || !content.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}>Post</Button>
        </div>
      </div>
    </div>
  );
}

export default function DiscussPage() {
  const [category, setCategory] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery<{ content: DiscussionDto[]; totalElements: number }>({
    queryKey: ["global-discuss", category],
    queryFn: () => api.get(`/discuss${category ? `?category=${category}` : ""}`).then(r => r.data),
    staleTime: 60_000,
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Discussion</h1>
            <p className="text-sm text-zinc-500 mt-1">Ask questions, share insights, discuss careers</p>
          </div>
          <Button className="gap-1.5 bg-emerald-600 hover:bg-emerald-500"
            onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />New Post
          </Button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {["", ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                category === c
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}>
              {c === "" ? "All" : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {showForm && <div className="mb-5"><CreateForm onClose={() => setShowForm(false)} /></div>}

        <div className="space-y-3">
          {isLoading
            ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            : data?.content.map(d => <DiscussionCard key={d.id} discussion={d} />)}
        </div>

        {!isLoading && !data?.content.length && !showForm && (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500">
            <p className="text-sm">No discussions yet in this category.</p>
            <button onClick={() => setShowForm(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              Start the first one →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
