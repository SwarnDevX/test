export interface HeatmapEntry { date: string; count: number; }
export interface LanguageStat  { language: string; count: number; percentage: number; }
export interface TagStat       { tag: string; count: number; }
export interface BadgeDto      { slug: string; name: string; description: string; icon: string; awardedAt: string; }
export interface RecentAcSubmission {
  id: number; problemSlug: string; problemTitle: string; problemNumber: number;
  language: string; runtimeMs: number | null; submittedAt: string;
}

export interface UserStatsDetail {
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  totalSolved: number;
  currentStreak: number;
  longestStreak: number;
  ranking: number | null;
  heatmap: HeatmapEntry[];
  languageBreakdown: LanguageStat[];
  topTags: TagStat[];
  recentAc: RecentAcSubmission[];
  badges: BadgeDto[];
}
