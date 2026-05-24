export type Mode = "dm" | "cold_email"

export interface GenerateRequest {
  companyName: string
  companyUrl: string
  recipientName?: string
  background: string
  mode: Mode
}

export interface ResearchNote {
  note: string
  url: string
}

export interface PainPoint {
  summary: string
  evidenceUrl: string
}

export type Draft =
  | { mode: "dm"; body: string }
  | { mode: "cold_email"; subject: string; body: string }

export interface GenerateResponse {
  research: ResearchNote[]
  painPoint: PainPoint
  tone: string
  whyFit: string
  draft: Draft
  alternateOpening: string
}

export interface GenerateError {
  error: "parse" | "no_api_key" | "network"
  raw?: string
  message?: string
}

export type GenerateResult = GenerateResponse | GenerateError

export interface HistoryEntry {
  id: string
  timestamp: number
  request: GenerateRequest
  response: GenerateResponse
}
