export interface ProblemListItem {
  id: number;
  number: number;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  acceptanceRate: number;
  tags: string[];
  status: "SOLVED" | "ATTEMPTED" | "TODO";
}

export interface ProblemDetail {
  id: number;
  number: number;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  bodyMarkdown: string;
  constraintsMarkdown: string | null;
  followUpMarkdown: string | null;
  acceptanceRate: number;
  submissionCount: number;
  likeCount: number;
  dislikeCount: number;
  timeLimitMs: number;
  memoryLimitMb: number;
  isPremium: boolean;
  examples: { input: string; output: string; explanation: string | null }[];
  tags: string[];
  sampleTestCases: { id: number; input: string; expectedOutput: string }[];
  starterCode: Record<string, string>;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface RunResult {
  verdict: "ACCEPTED" | "WRONG_ANSWER" | "COMPILE_ERROR" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED" | "INTERNAL_ERROR";
  results: {
    caseIndex: number;
    input: string;
    expectedOutput: string | null;
    actualOutput: string;
    stderr: string;
    runtimeMs: number;
    verdict: string;
  }[];
  compileError: string | null;
}
