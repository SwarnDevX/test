export type SubmissionStatus =
  | "QUEUED" | "RUNNING"
  | "ACCEPTED" | "WRONG_ANSWER" | "COMPILE_ERROR"
  | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED" | "OUTPUT_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

export interface SubmissionDto {
  id: number;
  problemSlug: string;
  problemTitle: string;
  problemNumber: number;
  language: string;
  status: SubmissionStatus;
  verdict: SubmissionStatus | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  testcasesPassed: number | null;
  totalTestcases: number | null;
  createdAt: string;
}

export interface SubmissionDetailDto extends SubmissionDto {
  sourceCode: string;
  failingTestcaseIndex: number | null;
  compileError: string | null;
  stdout: string | null;
  stderr: string | null;
}
