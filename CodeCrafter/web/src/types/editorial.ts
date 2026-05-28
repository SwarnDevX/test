export interface EditorialDto {
  id: number;
  problemId: number;
  authorUsername: string | null;
  contentMarkdown: string;
  isPublished: boolean;
  updatedAt: string;
}

export interface SolutionDto {
  id: number;
  problemId: number;
  authorUsername: string;
  authorAvatar: string | null;
  title: string;
  contentMarkdown: string;
  language: string | null;
  voteScore: number;
  commentCount: number;
  myVote: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SolutionCommentDto {
  id: number;
  authorUsername: string;
  authorAvatar: string | null;
  contentMarkdown: string;
  voteScore: number;
  myVote: number | null;
  createdAt: string;
  replies: SolutionCommentDto[];
}

export interface DiscussionDto {
  id: number;
  problemId: number | null;
  problemTitle: string | null;
  problemSlug: string | null;
  authorUsername: string;
  authorAvatar: string | null;
  title: string;
  contentMarkdown: string;
  category: string;
  voteScore: number;
  replyCount: number;
  isAnswered: boolean;
  myVote: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface DiscussionReplyDto {
  id: number;
  authorUsername: string;
  authorAvatar: string | null;
  contentMarkdown: string;
  voteScore: number;
  isAnswer: boolean;
  myVote: number | null;
  createdAt: string;
  replies: DiscussionReplyDto[];
}
