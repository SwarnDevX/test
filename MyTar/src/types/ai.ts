// AI Job Types

export interface BackgroundGenerationJob {
  userId: string;
  projectId: string;
  assetId: string;
  prompt: string;
  width: number;
  height: number;
  style?: string;
}

export interface ExportJob {
  userId: string;
  projectId: string;
  assetId: string;
  canvasState: object;
  width: number;
  height: number;
  format: 'png' | 'jpg';
}

export interface EmailJob {
  to: string;
  subject: string;
  type: 'password-reset' | 'welcome' | 'receipt';
  data: Record<string, string>;
}

export type AiJobPayload = BackgroundGenerationJob | ExportJob | EmailJob;

export interface AiJobResult {
  jobId: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  resultUrl?: string;
  error?: string;
}

export interface CopyGenerationRequest {
  productName: string;
  description: string;
  targetAudience: string;
  tone: string;
  format: string;
  variants?: number;
}

export interface CopyVariant {
  headline: string;
  subheadline: string;
  cta: string;
  body?: string;
}

export interface LayoutSuggestion {
  layers: Array<{
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
  }>;
}

