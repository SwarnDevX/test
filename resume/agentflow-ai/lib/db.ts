// lib/db.ts  – Pure-JS file-based store (no native modules needed)
// Uses JSON files in ./data/ for persistence. Works on any platform without compilation.

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const UPLOADS_DIR_EXPORT = path.join(DATA_DIR, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR_EXPORT)) fs.mkdirSync(UPLOADS_DIR_EXPORT, { recursive: true });

// ─── File store helpers ──────────────────────────────────────────────────────
function readJson<T>(file: string, defaults: T): T {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) return defaults;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return defaults; }
}

function writeJson(file: string, data: unknown) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Type definitions ─────────────────────────────────────────────────────────
export interface ChatSession { id: string; title: string; created_at: number; updated_at: number; }
export interface ChatMessage { id: string; session_id: string; role: 'user' | 'assistant' | 'system'; content: string; tools_used?: string[]; steps?: unknown[]; confidence?: number; tokens_used?: number; latency_ms?: number; created_at: number; }
export interface Workflow { id: string; name: string; description: string; nodes: unknown[]; edges: unknown[]; status: string; run_count: number; last_run_at?: number; created_at: number; updated_at: number; }
export interface WorkflowRun { id: string; workflow_id: string; status: string; log: unknown[]; started_at: number; finished_at?: number; tokens_used: number; cost_usd: number; }
export interface KBDocument { id: string; name: string; original_name: string; file_type: string; file_size: number; status: 'processing' | 'embedded' | 'error'; chunk_count: number; embedded_count: number; file_path: string; error_msg?: string; created_at: number; updated_at: number; }
export interface KBChunk { id: string; document_id: string; chunk_index: number; content: string; embedding?: number[]; token_count: number; created_at: number; }
export interface Trace { id: string; session_id?: string; workflow_run_id?: string; steps: unknown[]; total_tokens: number; total_latency_ms: number; confidence?: number; status: string; created_at: number; }
export interface ObsEvent { id: string; event_type: string; agent_chain?: string[]; task?: string; tokens_used: number; latency_ms: number; cost_usd: number; status: string; metadata?: unknown; created_at: number; }

// ─── DB class ─────────────────────────────────────────────────────────────────
class JsonDB {
  private get<T>(file: string, def: T[]): T[] { return readJson<T[]>(file, def); }
  private set(file: string, data: unknown[]) { writeJson(file, data); }

  // ── Chat Sessions ──
  getSessions(): ChatSession[] { return this.get<ChatSession>('sessions.json', []); }
  createSession(title: string): ChatSession {
    const s: ChatSession = { id: uuidv4(), title, created_at: now(), updated_at: now() };
    this.set('sessions.json', [s, ...this.getSessions()]);
    return s;
  }
  updateSession(id: string, update: Partial<ChatSession>) {
    this.set('sessions.json', this.getSessions().map(s => s.id === id ? { ...s, ...update, updated_at: now() } : s));
  }
  deleteSession(id: string) {
    this.set('sessions.json', this.getSessions().filter(s => s.id !== id));
    this.set('messages.json', this.getMessages().filter(m => m.session_id !== id));
  }
  getSessionsWithCount(): Array<ChatSession & { message_count: number }> {
    const msgs = this.getMessages();
    return this.getSessions().map(s => ({ ...s, message_count: msgs.filter(m => m.session_id === s.id).length }));
  }

  // ── Chat Messages ──
  getMessages(): ChatMessage[] { return this.get<ChatMessage>('messages.json', []); }
  getSessionMessages(session_id: string): ChatMessage[] { return this.getMessages().filter(m => m.session_id === session_id).sort((a, b) => a.created_at - b.created_at); }
  addMessage(msg: Omit<ChatMessage, 'created_at'>): ChatMessage {
    const m: ChatMessage = { ...msg, created_at: now() };
    this.set('messages.json', [...this.getMessages(), m]);
    return m;
  }

  // ── Workflows ──
  getWorkflows(): Workflow[] { return this.get<Workflow>('workflows.json', getDefaultWorkflows()); }
  getWorkflow(id: string): Workflow | undefined { return this.getWorkflows().find(w => w.id === id); }
  createWorkflow(data: Partial<Workflow>): Workflow {
    const w: Workflow = { id: uuidv4(), name: data.name || 'New Workflow', description: data.description || '', nodes: data.nodes || [], edges: data.edges || [], status: 'draft', run_count: 0, created_at: now(), updated_at: now() };
    this.set('workflows.json', [w, ...this.getWorkflows()]);
    return w;
  }
  updateWorkflow(id: string, data: Partial<Workflow>) {
    this.set('workflows.json', this.getWorkflows().map(w => w.id === id ? { ...w, ...data, updated_at: now() } : w));
  }
  deleteWorkflow(id: string) { this.set('workflows.json', this.getWorkflows().filter(w => w.id !== id)); }
  incrementRunCount(id: string) {
    this.updateWorkflow(id, { run_count: (this.getWorkflow(id)?.run_count || 0) + 1, last_run_at: now(), status: 'active' });
  }

  // ── Workflow Runs ──
  createRun(workflow_id: string): WorkflowRun {
    const r: WorkflowRun = { id: uuidv4(), workflow_id, status: 'running', log: [], started_at: now(), tokens_used: 0, cost_usd: 0 };
    this.set('runs.json', [r, ...this.get<WorkflowRun>('runs.json', [])]);
    return r;
  }
  updateRun(id: string, data: Partial<WorkflowRun>) {
    this.set('runs.json', this.get<WorkflowRun>('runs.json', []).map(r => r.id === id ? { ...r, ...data } : r));
  }

  // ── KB Documents ──
  getDocs(): KBDocument[] { return this.get<KBDocument>('kb_docs.json', []); }
  getDoc(id: string): KBDocument | undefined { return this.getDocs().find(d => d.id === id); }
  addDoc(doc: Omit<KBDocument, 'created_at' | 'updated_at'>): KBDocument {
    const d: KBDocument = { ...doc, created_at: now(), updated_at: now() };
    this.set('kb_docs.json', [d, ...this.getDocs()]);
    return d;
  }
  updateDoc(id: string, data: Partial<KBDocument>) {
    this.set('kb_docs.json', this.getDocs().map(d => d.id === id ? { ...d, ...data, updated_at: now() } : d));
  }
  deleteDoc(id: string) {
    this.set('kb_docs.json', this.getDocs().filter(d => d.id !== id));
    this.set('kb_chunks.json', this.getChunks().filter(c => c.document_id !== id));
  }

  // ── KB Chunks ──
  getChunks(): KBChunk[] { return this.get<KBChunk>('kb_chunks.json', []); }
  getDocChunks(document_id: string): KBChunk[] { return this.getChunks().filter(c => c.document_id === document_id).sort((a, b) => a.chunk_index - b.chunk_index); }
  addChunk(chunk: Omit<KBChunk, 'created_at'>): KBChunk {
    const c: KBChunk = { ...chunk, created_at: now() };
    const all = this.getChunks();
    all.push(c);
    this.set('kb_chunks.json', all);
    return c;
  }
  getEmbeddedChunks(): Array<KBChunk & { document_name: string }> {
    const docs = this.getDocs().filter(d => d.status === 'embedded');
    const chunks = this.getChunks();
    return chunks
      .filter(c => docs.find(d => d.id === c.document_id) && c.embedding)
      .map(c => ({ ...c, document_name: docs.find(d => d.id === c.document_id)!.original_name }));
  }
  getAllChunksWithDoc(): Array<KBChunk & { document_name: string }> {
    const docs = this.getDocs();
    return this.getChunks().map(c => ({ ...c, document_name: docs.find(d => d.id === c.document_id)?.original_name || '' }));
  }

  // ── Traces ──
  getTraces(): Trace[] { return this.get<Trace>('traces.json', []); }
  getTrace(id: string): Trace | undefined { return this.getTraces().find(t => t.id === id); }
  addTrace(trace: Trace) { this.set('traces.json', [trace, ...this.getTraces()].slice(0, 100)); }
  getTracesWithSession(): Array<Trace & { session_title?: string }> {
    const sessions = this.getSessions();
    return this.getTraces().map(t => ({ ...t, session_title: sessions.find(s => s.id === t.session_id)?.title }));
  }

  // ── Observability Events ──
  getEvents(): ObsEvent[] { return this.get<ObsEvent>('obs_events.json', []); }
  addEvent(event: Omit<ObsEvent, 'id' | 'created_at'>) {
    const e: ObsEvent = { ...event, id: uuidv4(), created_at: now() };
    const all = [e, ...this.getEvents()].slice(0, 500);
    this.set('obs_events.json', all);
    return e;
  }
  getEventsSince(since: number): ObsEvent[] { return this.getEvents().filter(e => e.created_at >= since); }
}

function now() { return Math.floor(Date.now() / 1000); }

function getDefaultWorkflows(): Workflow[] {
  return [{
    id: 'wf-demo-1', name: 'Revenue Analysis Pipeline', description: 'Automated Q4 revenue analysis with RAG',
    nodes: [
      { id: '1', type: 'custom', position: { x: 100, y: 150 }, data: { label: 'Planner LLM', type: 'llm', description: 'GPT-4 — decompose task', config: { model: 'gpt-4o', temperature: '0.2' } } },
      { id: '2', type: 'custom', position: { x: 400, y: 80 }, data: { label: 'Search API', type: 'api', description: 'POST /api/search', config: { endpoint: '/api/search', method: 'POST' } } },
      { id: '3', type: 'custom', position: { x: 400, y: 250 }, data: { label: 'Query Revenue', type: 'database', description: 'SELECT revenue data', config: { query: 'SELECT * FROM revenue WHERE quarter=?', db: 'postgres-main' } } },
      { id: '4', type: 'custom', position: { x: 700, y: 150 }, data: { label: 'Has Results?', type: 'condition', description: 'results.length > 0', config: { condition: 'results.length > 0' } } },
      { id: '5', type: 'custom', position: { x: 1000, y: 150 }, data: { label: 'Synthesizer LLM', type: 'llm', description: 'Combine & summarize', config: { model: 'gpt-4o', temperature: '0.4' } } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true },
      { id: 'e1-3', source: '1', target: '3', animated: true },
      { id: 'e2-4', source: '2', target: '4' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5', animated: true },
    ],
    status: 'active', run_count: 0, created_at: now(), updated_at: now(),
  }];
}

// Singleton
let _db: JsonDB | null = null;
export function getDb(): JsonDB {
  if (!_db) _db = new JsonDB();
  return _db;
}
