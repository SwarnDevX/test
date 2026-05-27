// Frontend DTOs — mirror the shapes returned by the Hono API services.
// bigint fields are strings (serialized by the API).

export type TaskStatus =
  | 'open'
  | 'assigned'
  | 'submitted'
  | 'reviewing'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type AssignmentStatus = 'active' | 'submitted' | 'completed' | 'disputed' | 'refunded';

export interface Task {
  id: string;
  posterId: string;
  title: string;
  description: string;
  budgetUsdc: string;
  status: TaskStatus;
  tags: string[];
  deadline: string | null;
  onchainTaskId: string | null;
  onchainTaskHash: string | null;
  resultHash: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Bid {
  id: string;
  taskId: string;
  agentId: string;
  priceUsdc: string;
  etaHours: number;
  coverNote: string | null;
  sampleOutput: string | null;
  status: BidStatus;
  createdAt: string;
}

export interface Assignment {
  id: string;
  taskId: string;
  bidId: string;
  agentId: string;
  status: AssignmentStatus;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
}

export interface Agent {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  capabilities: string[];
  reputationScore: number;
  reviewCount: number;
  isActive: boolean;
  onchainId: string | null;
  metadataUri: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  agentId: string;
  taskId: string;
  reviewerId: string;
  rating: number;
  reviewText: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  walletAddress: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface TaskDetail {
  task: Task;
  bids: Bid[];
  assignment: Assignment | null;
  messages: Array<{
    id: string;
    role: 'user' | 'agent' | 'system';
    content: string;
    createdAt: string;
  }>;
}

export interface AgentDetail {
  agent: Agent;
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export interface ApiResponse<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}

export interface PlatformStats {
  totalTasks: number;
  tasksCompleted: number;
  usdcProcessed: string;
  activeAgents: number;
  successRate: number;
}

export interface AdminTask {
  id: string;
  title: string;
  status: string;
  posterId: string;
  budgetUsdc: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  walletAddress: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface AdminAgent {
  id: string;
  name: string;
  isActive: boolean;
  ownerId: string;
  reputationScore: number;
  createdAt: string;
}

export interface AdminDispute {
  id: string;
  title: string;
  posterId: string;
  budgetUsdc: string;
  onchainTaskId: string | null;
  createdAt: string;
}

// USDC has 6 decimals. This converts the raw bigint string to a display string.
export function formatUsdc(raw: string): string {
  const n = BigInt(raw);
  const whole = n / 1_000_000n;
  const frac = n % 1_000_000n;
  if (frac === 0n) return `${whole.toString()}`;
  return `${whole.toString()}.${frac.toString().padStart(6, '0').replace(/0+$/, '')}`;
}

export function parseUsdc(display: string): string {
  const [whole = '0', frac = ''] = display.split('.');
  const padded = frac.padEnd(6, '0').slice(0, 6);
  return (BigInt(whole) * 1_000_000n + BigInt(padded)).toString();
}
