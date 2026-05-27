"use client";

import { useWorkflowStore } from "@/stores/workflow.store";
import { Settings2, VolumeX, Volume2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasNode } from "@/stores/workflow.store";

function ConfigField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-fg-muted mb-1">{label}</label>
      {children}
    </div>
  );
}

function NodeConfigPanel({ node }: { node: CanvasNode }) {
  const updateConfig = useWorkflowStore((s) => s.updateNodeConfig);
  const updateLabel = useWorkflowStore((s) => s.updateNodeLabel);
  const toggleMute = useWorkflowStore((s) => s.toggleNodeMute);
  const config = node.data.config;

  function set(key: string, value: unknown) {
    updateConfig(node.id, { [key]: value });
  }

  return (
    <div className="space-y-4 p-3">
      {/* Node label */}
      <ConfigField label="Label">
        <input
          value={node.data.label}
          onChange={(e) => updateLabel(node.id, e.target.value)}
          className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
      </ConfigField>

      {/* Type-specific config */}
      {node.data.type.startsWith("ai.chatCompletion") && (
        <>
          <ConfigField label="Model">
            <select
              value={String(config.model ?? "gpt-4o")}
              onChange={(e) => set("model", e.target.value)}
              className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o mini</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="claude-opus-4-7">Claude Opus 4.7</option>
              <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
              <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="mistral-large-latest">Mistral Large</option>
            </select>
          </ConfigField>
          <ConfigField label={`Temperature: ${config.temperature ?? 0.7}`}>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={Number(config.temperature ?? 0.7)}
              onChange={(e) => set("temperature", parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </ConfigField>
          <ConfigField label="System prompt">
            <textarea
              value={String(config.systemPrompt ?? "")}
              onChange={(e) => set("systemPrompt", e.target.value)}
              rows={4}
              placeholder="You are a helpful assistant…"
              className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </ConfigField>
          <ConfigField label="User prompt">
            <textarea
              value={String(config.userPrompt ?? "")}
              onChange={(e) => set("userPrompt", e.target.value)}
              rows={3}
              placeholder="{{trigger.message}}"
              className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </ConfigField>
        </>
      )}

      {node.data.type === "trigger.webhook" && (
        <>
          <ConfigField label="Path">
            <input
              value={String(config.path ?? "/webhook")}
              onChange={(e) => set("path", e.target.value)}
              className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </ConfigField>
          <ConfigField label="Method">
            <select
              value={String(config.method ?? "POST")}
              onChange={(e) => set("method", e.target.value)}
              className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              <option>POST</option><option>GET</option><option>PUT</option><option>PATCH</option>
            </select>
          </ConfigField>
        </>
      )}

      {node.data.type === "trigger.schedule" && (
        <ConfigField label="Cron expression">
          <input
            value={String(config.cronExpression ?? "0 9 * * 1-5")}
            onChange={(e) => set("cronExpression", e.target.value)}
            className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <p className="text-[10px] text-fg-muted mt-1">
            {String(config.cronExpression ?? "0 9 * * 1-5")} → Weekdays at 9am
          </p>
        </ConfigField>
      )}

      {(node.data.type === "code.javascript" || node.data.type === "code.python") && (
        <ConfigField label="Code">
          <textarea
            value={String(config.code ?? "")}
            onChange={(e) => set("code", e.target.value)}
            rows={10}
            className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </ConfigField>
      )}

      {node.data.type === "logic.wait" && (
        <ConfigField label="Delay (ms)">
          <input
            type="number"
            value={Number(config.durationMs ?? 1000)}
            onChange={(e) => set("durationMs", parseInt(e.target.value))}
            min={0}
            className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </ConfigField>
      )}

      {node.data.type === "data.httpRequest" && (
        <>
          <ConfigField label="URL">
            <input
              value={String(config.url ?? "")}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://api.example.com/endpoint"
              className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-accent/40"
            />
          </ConfigField>
          <ConfigField label="Method">
            <select
              value={String(config.method ?? "GET")}
              onChange={(e) => set("method", e.target.value)}
              className="w-full px-2 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
            </select>
          </ConfigField>
        </>
      )}

      {/* Mute toggle */}
      <div className="pt-2 border-t border-border/60">
        <button
          onClick={() => toggleMute(node.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium w-full transition-colors",
            node.data.isMuted
              ? "bg-warning/10 border border-warning/30 text-warning"
              : "hover:bg-bg-surface-2 text-fg-muted",
          )}
        >
          {node.data.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {node.data.isMuted ? "Unmute node" : "Mute node"}
        </button>
      </div>

      <div className="text-[10px] text-fg-muted flex items-center gap-1">
        <Info className="w-3 h-3" />
        Node ID: <code className="font-mono">{node.id}</code>
      </div>
    </div>
  );
}

export function InspectorPanel() {
  const selectedNodeIds = useWorkflowStore((s) => s.selectedNodeIds);
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNode = nodes.find((n) => n.id === selectedNodeIds[0]);

  return (
    <div className="h-full flex flex-col bg-bg-surface-1">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
        <Settings2 className="w-4 h-4 text-fg-muted" />
        <span className="text-xs font-semibold">Inspector</span>
      </div>

      {selectedNode ? (
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 border-b border-border/60">
            <div className="text-[10px] text-fg-muted uppercase tracking-wider">{selectedNode.data.type}</div>
          </div>
          <NodeConfigPanel node={selectedNode} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center p-6">
          <div>
            <Settings2 className="w-8 h-8 text-fg-muted/30 mx-auto mb-2" />
            <p className="text-xs text-fg-muted">Select a node to inspect</p>
          </div>
        </div>
      )}
    </div>
  );
}
