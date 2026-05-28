export interface ContestDto {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  startTime: string;
  endTime: string;
  status: "UPCOMING" | "RUNNING" | "ENDED";
  participantCount: number;
  registered: boolean;
}

export interface ContestProblemDto {
  problemId: number;
  alias: string;
  orderIndex: number;
  points: number;
  title: string;
  slug: string;
  difficulty: string;
  solved: boolean;
  wrongAttempts: number;
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  solved: number;
  penaltySecs: number;
  ratingChange: number | null;
}

export interface ContestRatingHistoryDto {
  contestId: number;
  contestTitle: string;
  contestSlug: string;
  oldRating: number;
  newRating: number;
  delta: number;
  rank: number;
  participantCount: number;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
