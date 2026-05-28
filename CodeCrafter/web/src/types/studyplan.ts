export interface StudyPlanSummary {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  difficulty: string;
  problemCount: number;
  estimatedDays: number | null;
  completedCount: number;
  progressPercent: number;
}

export interface StudyPlanProblem {
  problemId: number;
  problemNumber: number;
  problemTitle: string;
  problemSlug: string;
  difficulty: string;
  orderIndex: number;
  notes: string | null;
  completed: boolean;
}

export interface StudyPlanDetail extends StudyPlanSummary {
  problems: StudyPlanProblem[];
}

export interface DailyChallengeDto {
  id: number;
  challengeDate: string;
  bonusPoints: number;
  problemId: number;
  problemSlug: string;
  problemTitle: string;
  problemDifficulty: string;
  solvedToday: boolean;
}
