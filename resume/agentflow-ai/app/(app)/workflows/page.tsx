'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Globe,
  Database,
  GitBranch,
  X,
  Plus,
  Play,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CustomNodeData {
  label: string;
  type: 'llm' | 'api' | 'database' | 'condition';
  description: string;
  config?: Record<string, string>;
  status?: 'running' | 'done' | 'error';
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: string;
  run_count: number;
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
}

interface RunLog {
  nodeId: string;
  label: string;
  type: string;
  result: string;
  latency: number;
  tokens: number;
  timestamp: string;
}

const nodeIcons = {
  llm: Brain,
  api: Globe,
  database: Database,
  condition: GitBranch,
};

const nodeColors = {
  llm:       { bg: 'bg-violet-500/15', border: 'border-violet-500/30',  icon: 'text-violet-400',  glow: 'shadow-violet-500/20' },
  api:       { bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30',    icon: 'text-cyan-400',    glow: 'shadow-cyan-500/20'   },
  database:  { bg: 'bg-emerald-500/15',border: 'border-emerald-500/30', icon: 'text-emerald-400', glow: 'shadow-emerald-500/20'},
  condition: { bg: 'bg-amber-500/15',  border: 'border-amber-500/30',   icon: 'text-amber-400',   glow: 'shadow-amber-500/20'  },
};

function WorkflowNode({ data, selected }: NodeProps<CustomNodeData>) {
  const Icon = nodeIcons[data.type];
  const colors = nodeColors[data.type];
  const isRunning = data.status === 'running';
  const isDone    = data.status === 'done';
  const isError   = data.status === 'error';

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'relative bg-white/[0.05] backdrop-blur-xl border rounded-2xl p-4 min-w-[200px] transition-all duration-200',
        selected   ? `${colors.border} shadow-lg ${colors.glow}` : 'border-white/[0.08]',
        isRunning  && 'border-violet-500/60 shadow-lg shadow-violet-500/30 ring-1 ring-violet-500/30',
        isDone     && 'border-emerald-500/40 shadow-emerald-500/10',
        isError    && 'border-red-500/40',
      )}
    >
      <Handle type="target" position={Position.Left}  className="!-left-1.5" />
      <Handle type="source" position={Position.Right} className="!-right-1.5" />

      <div className="flex items-center gap-3">
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center relative', colors.bg)}>
          {isRunning ? (
            <Loader2 className={cn('w-4 h-4 animate-spin', colors.icon)} />
          ) : isDone ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Icon className={cn('w-4 h-4', colors.icon)} />
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-white">{data.label}</div>
          <div className="text-xs text-slate-500 capitalize">{data.type}</div>
        </div>
      </div>

      {isRunning && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-violet-500/40"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

const nodeTemplates: { type: CustomNodeData['type']; label: string }[] = [
  { type: 'llm',       label: 'LLM Node' },
  { type: 'api',       label: 'API Call' },
  { type: 'database',  label: 'DB Query' },
  { type: 'condition', label: 'Condition' },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runLogs, setRunLogs] = useState<RunLog[]>([]);
  const [runStatus, setRunStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [workflowName, setWorkflowName] = useState('');

  const nodeTypes = useMemo(() => ({ custom: WorkflowNode }), []);

  const loadWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      const wfList: Workflow[] = data.workflows ?? [];
      setWorkflows(wfList);
      if (wfList.length > 0 && !activeWorkflow) {
        selectWorkflow(wfList[0]);
      }
    } catch (e) {
      console.error('Failed to load workflows', e);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  const selectWorkflow = (wf: Workflow) => {
    setActiveWorkflow(wf);
    setWorkflowName(wf.name);
    setNodes((wf.nodes ?? []).map(n => ({ ...n, data: { ...n.data, status: undefined } })));
    setEdges(wf.edges ?? []);
    setRunLogs([]);
    setRunStatus('idle');
    setShowRunPanel(false);
    setSelectedNode(null);
  };

  const onConnect = useCallback(
    (c: Connection) => setEdges(eds => addEdge({ ...c, animated: true }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => setSelectedNode(node as Node<CustomNodeData>),
    [],
  );

  const addNode = (template: (typeof nodeTemplates)[0]) => {
    const id = `node-${Date.now()}`;
    setNodes(nds => [...nds, {
      id,
      type: 'custom',
      position: { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 },
      data: { label: template.label, type: template.type, description: 'Configure this node', config: {} },
    }]);
  };

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      const payload = { name: workflowName, nodes, edges, status: 'active' };
      if (activeWorkflow) {
        await fetch(`/api/workflows/${activeWorkflow.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        setActiveWorkflow(w => w ? { ...w, name: workflowName, nodes, edges, status: 'active' } : w);
      } else {
        const res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, status: 'draft' }),
        });
        const data: Workflow = await res.json();
        setActiveWorkflow(data);
        await loadWorkflows();
      }
      await loadWorkflows();
    } finally {
      setSaving(false);
    }
  };

  const runWorkflow = async () => {
    if (!activeWorkflow || running) return;

    // Reset node statuses
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, status: undefined } })));
    setRunning(true);
    setRunStatus('running');
    setRunLogs([]);
    setShowRunPanel(true);

    try {
      const res = await fetch(`/api/workflows/${activeWorkflow.id}/run`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as Record<string, unknown>;
            const d = (event.data ?? {}) as Record<string, unknown>;

            if (event.type === 'node_start') {
              const nodeId = d.nodeId as string;
              setNodes(nds => nds.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, status: 'running' } } : n,
              ));
            } else if (event.type === 'node_done') {
              const nodeId = d.nodeId as string;
              setNodes(nds => nds.map(n =>
                n.id === nodeId ? { ...n, data: { ...n.data, status: 'done' } } : n,
              ));
              setRunLogs(prev => [...prev, {
                nodeId,
                label:   (d.label   as string) ?? nodeId,
                type:    '',
                result:  (d.result  as string) ?? '',
                latency: (d.latency as number) ?? 0,
                tokens:  (d.tokens  as number) ?? 0,
                timestamp: new Date().toISOString(),
              }]);
            } else if (event.type === 'completed') {
              setRunStatus('success');
            } else if (event.type === 'error') {
              setRunStatus('error');
            }
          } catch { /* skip malformed event */ }
        }
      }
    } catch (e) {
      console.error(e);
      setRunStatus('error');
    } finally {
      setRunning(false);
      loadWorkflows();
    }
  };

  const deleteWorkflow = async (id: string) => {
    await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
    if (activeWorkflow?.id === id) { setActiveWorkflow(null); setNodes([]); setEdges([]); }
    loadWorkflows();
  };

  return (
    <div className="h-[calc(100vh-48px)] flex flex-col gap-4">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {activeWorkflow ? (
              <input
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                className="bg-transparent text-xl font-semibold outline-none border-b border-transparent hover:border-white/20 focus:border-violet-500/50 transition-colors px-1 py-0.5 max-w-xs text-white"
              />
            ) : (
              <h1 className="text-xl font-semibold">Workflow Builder</h1>
            )}
            {activeWorkflow && (
              <Badge variant={activeWorkflow.status === 'active' ? 'green' : activeWorkflow.status === 'running' ? 'violet' : 'slate'}>
                {activeWorkflow.status}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {nodeTemplates.map(t => {
              const Icon = nodeIcons[t.type];
              const colors = nodeColors[t.type];
              return (
                <button
                  key={t.type}
                  onClick={() => addNode(t)}
                  className="glass glass-hover px-3 py-2 flex items-center gap-1.5 text-xs font-medium"
                >
                  <Icon className={cn('w-3.5 h-3.5', colors.icon)} />
                  <span className="hidden sm:inline">{t.label}</span>
                  <Plus className="w-3 h-3 text-slate-500" />
                </button>
              );
            })}
            <div className="w-px h-6 bg-white/[0.06] mx-1" />
            <button
              onClick={saveWorkflow}
              disabled={saving}
              className="glass glass-hover px-4 py-2 flex items-center gap-2 text-xs font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-400" />}
              Save
            </button>
            <button
              onClick={runWorkflow}
              disabled={running || !activeWorkflow}
              className="px-4 py-2 rounded-2xl bg-violet-600 hover:bg-violet-500 flex items-center gap-2 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {running ? 'Running…' : 'Run'}
            </button>
          </div>
        </div>
      </FadeIn>

      {/* Body */}
      <FadeIn delay={0.05} className="flex-1 min-h-0">
        <div className="flex h-full gap-4">

          {/* Workflow list sidebar */}
          <div className="w-52 flex-shrink-0 hidden xl:block">
            <GlassCard className="p-3 h-full overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workflows</span>
                <button
                  onClick={async () => {
                    const res = await fetch('/api/workflows', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: 'New Workflow', nodes: [], edges: [] }),
                    });
                    const data: Workflow = await res.json();
                    await loadWorkflows();
                    selectWorkflow(data);
                  }}
                  className="p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-violet-400" />
                </button>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : workflows.length === 0 ? (
                <div className="text-center text-xs text-white/25 py-8">No workflows yet</div>
              ) : (
                <div className="space-y-1">
                  {workflows.map(wf => (
                    <div
                      key={wf.id}
                      onClick={() => selectWorkflow(wf)}
                      className={cn(
                        'px-3 py-2.5 rounded-xl cursor-pointer group flex items-start justify-between gap-2 transition-colors',
                        activeWorkflow?.id === wf.id ? 'bg-violet-500/10 border border-violet-500/15' : 'hover:bg-white/[0.04]',
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate text-white/80">{wf.name}</div>
                        <div className="text-[10px] text-slate-600 mt-0.5">{wf.run_count} runs</div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deleteWorkflow(wf.id); }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 flex-shrink-0 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Canvas + right panel */}
          <div className="flex-1 min-w-0 flex gap-4">
            {/* React Flow canvas */}
            <div className="flex-1 glass-strong overflow-hidden rounded-2xl">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                  style: { stroke: 'rgba(139, 92, 246, 0.4)', strokeWidth: 2 },
                  type: 'smoothstep',
                }}
              >
                <Background gap={30} size={1} color="rgba(139, 92, 246, 0.06)" />
                <Controls className="!rounded-xl !overflow-hidden !border-white/10 !shadow-none" />
                <MiniMap
                  nodeStrokeWidth={3}
                  className="!bg-white/[0.03] !rounded-xl !border-white/[0.08]"
                  maskColor="rgba(0,0,0,0.7)"
                  nodeColor={() => 'rgba(139, 92, 246, 0.5)'}
                />
              </ReactFlow>
            </div>

            {/* Right panels */}
            <div className="w-80 flex flex-col gap-3 flex-shrink-0">

              {/* Node config panel */}
              <AnimatePresence>
                {selectedNode && (
                  <motion.div
                    key="config"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <GlassCard className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const Icon = nodeIcons[selectedNode.data.type];
                            const c = nodeColors[selectedNode.data.type];
                            return (
                              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', c.bg)}>
                                <Icon className={cn('w-3.5 h-3.5', c.icon)} />
                              </div>
                            );
                          })()}
                          <span className="text-sm font-semibold">{selectedNode.data.label}</span>
                        </div>
                        <button
                          onClick={() => setSelectedNode(null)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-slate-400 mb-1 block">Node Label</label>
                          <input
                            defaultValue={selectedNode.data.label}
                            onChange={e =>
                              setNodes(ns => ns.map(n =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, label: e.target.value } }
                                  : n,
                              ))
                            }
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500/40 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-400 mb-1 block">Description</label>
                          <input
                            defaultValue={selectedNode.data.description}
                            onChange={e =>
                              setNodes(ns => ns.map(n =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, description: e.target.value } }
                                  : n,
                              ))
                            }
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500/40 transition-colors"
                          />
                        </div>

                        {selectedNode.data.config && Object.entries(selectedNode.data.config).map(([key, value]) => (
                          <div key={key}>
                            <label className="text-xs font-medium text-slate-400 mb-1 block capitalize">{key}</label>
                            <input
                              defaultValue={value}
                              onChange={e =>
                                setNodes(ns => ns.map(n =>
                                  n.id === selectedNode.id
                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: e.target.value } } }
                                    : n,
                                ))
                              }
                              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500/40 transition-colors"
                            />
                          </div>
                        ))}

                        {/* Add custom config field */}
                        {selectedNode.data.type === 'llm' && !selectedNode.data.config?.model && (
                          <button
                            onClick={() =>
                              setNodes(ns => ns.map(n =>
                                n.id === selectedNode.id
                                  ? { ...n, data: { ...n.data, config: { model: 'gpt-4o', temperature: '0.3', ...n.data.config } } }
                                  : n,
                              ))
                            }
                            className="w-full py-2 rounded-xl border border-dashed border-white/[0.1] text-xs text-white/40 hover:text-white/60 hover:border-white/[0.2] transition-colors"
                          >
                            + Add model config
                          </button>
                        )}

                        <button
                          onClick={saveWorkflow}
                          className="w-full py-2 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-sm font-medium transition-colors"
                        >
                          Save Node Config
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Run panel */}
              <AnimatePresence>
                {showRunPanel && (
                  <motion.div
                    key="run"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    className="flex-1"
                  >
                    <GlassCard className="p-4 h-full overflow-y-auto">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {runStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {runStatus === 'error'   && <AlertCircle  className="w-4 h-4 text-red-400" />}
                          {runStatus === 'running' && <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />}
                          <span className="text-sm font-semibold">Run Log</span>
                        </div>
                        <button
                          onClick={() => setShowRunPanel(false)}
                          className="p-1 rounded hover:bg-white/[0.06] transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {runLogs.map((log, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass p-3 rounded-xl"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-300">{log.label}</span>
                              {log.latency > 0 && (
                                <span className="text-xs text-slate-600 font-mono">{log.latency}ms</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-4">{log.result}</p>
                            {log.tokens > 0 && (
                              <span className="text-[11px] text-violet-400">{log.tokens} tokens</span>
                            )}
                          </motion.div>
                        ))}

                        {running && runLogs.length === 0 && (
                          <div className="flex items-center gap-2 text-xs text-white/40 py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                            Initializing workflow run…
                          </div>
                        )}

                        {running && runLogs.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-violet-400">
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-violet-400"
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            />
                            Processing nodes…
                          </div>
                        )}

                        {runStatus === 'success' && (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Workflow completed successfully
                          </div>
                        )}

                        {runStatus === 'error' && (
                          <div className="flex items-center gap-2 text-xs text-red-400 pt-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Workflow failed — check node configs
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Instructions panel */}
              {!showRunPanel && !selectedNode && (
                <GlassCard className="p-4 flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold">Workflow Builder</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-violet-400 shrink-0" />
                      Click a node template above to add it to the canvas
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-violet-400 shrink-0" />
                      Drag node handles to connect them
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-violet-400 shrink-0" />
                      Click a node to edit its configuration
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-violet-400 shrink-0" />
                      Save your workflow before running
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-violet-400 shrink-0" />
                      Press Run to stream live execution
                    </div>
                  </div>

                  {!activeWorkflow && (
                    <div className="mt-5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-[11px] text-amber-400">
                      Select a workflow from the left or create a new one to get started.
                    </div>
                  )}
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
