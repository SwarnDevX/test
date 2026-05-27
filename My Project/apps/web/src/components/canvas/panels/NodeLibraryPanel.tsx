"use client";

import { useState, useCallback } from "react";
import { Search, Zap, Brain, GitBranch, Database, Code2, Plug, ChevronDown } from "lucide-react";
import { useWorkflowStore } from "@/stores/workflow.store";
import { cn, generateId } from "@/lib/utils";

interface NodeTemplate {
  type: string;
  label: string;
  description: string;
  category: string;
  color: string;
  defaultConfig?: Record<string, unknown>;
}

const NODE_TEMPLATES: NodeTemplate[] = [
  // Triggers
  { type: "trigger.manual", label: "Manual Trigger", description: "Manually triggered workflow", category: "TRIGGER", color: "oklch(72% 0.17 145)" },
  { type: "trigger.webhook", label: "Webhook", description: "Triggered by HTTP webhook", category: "TRIGGER", color: "oklch(65% 0.18 240)" },
  { type: "trigger.schedule", label: "Schedule", description: "Cron-based schedule", category: "TRIGGER", color: "oklch(80% 0.18 85)", defaultConfig: { cronExpression: "0 9 * * 1-5" } },
  { type: "trigger.chat-message", label: "Chat Message", description: "Incoming chat message", category: "TRIGGER", color: "oklch(70% 0.15 300)" },

  // AI
  { type: "ai.chatCompletion", label: "Chat Completion", description: "LLM text generation", category: "AI", color: "oklch(65% 0.18 240)", defaultConfig: { model: "gpt-4o", temperature: 0.7 } },
  { type: "ai.embeddings", label: "Embeddings", description: "Text → vector embedding", category: "AI", color: "oklch(65% 0.18 240)", defaultConfig: { model: "text-embedding-3-small" } },
  { type: "ai.vectorSearch", label: "Vector Search", description: "Search knowledge base", category: "AI", color: "oklch(65% 0.18 240)" },
  { type: "ai.textSplitter", label: "Text Splitter", description: "Split text into chunks", category: "AI", color: "oklch(65% 0.18 240)", defaultConfig: { chunkSize: 1000, chunkOverlap: 200 } },
  { type: "ai.structuredOutput", label: "Structured Output", description: "Extract JSON from text", category: "AI", color: "oklch(65% 0.18 240)" },
  { type: "ai.imageGeneration", label: "Image Generation", description: "Generate images with DALL-E", category: "AI", color: "oklch(65% 0.18 240)", defaultConfig: { model: "dall-e-3", size: "1024x1024" } },

  // Logic
  { type: "logic.ifElse", label: "If / Else", description: "Conditional branch", category: "LOGIC", color: "oklch(80% 0.18 85)" },
  { type: "logic.switch", label: "Switch", description: "Multi-branch condition", category: "LOGIC", color: "oklch(80% 0.18 85)" },
  { type: "logic.filter", label: "Filter", description: "Filter items by condition", category: "LOGIC", color: "oklch(80% 0.18 85)" },
  { type: "logic.loop", label: "Loop", description: "Iterate over array", category: "LOGIC", color: "oklch(80% 0.18 85)" },
  { type: "logic.merge", label: "Merge", description: "Merge parallel branches", category: "LOGIC", color: "oklch(80% 0.18 85)" },
  { type: "logic.wait", label: "Wait", description: "Delay execution", category: "LOGIC", color: "oklch(80% 0.18 85)", defaultConfig: { durationMs: 5000 } },
  { type: "logic.setVariable", label: "Set Variable", description: "Set a workflow variable", category: "LOGIC", color: "oklch(80% 0.18 85)" },
  { type: "logic.math", label: "Math", description: "Perform math operations", category: "LOGIC", color: "oklch(80% 0.18 85)" },
  { type: "logic.jsonManipulator", label: "JSON", description: "Transform JSON data", category: "LOGIC", color: "oklch(80% 0.18 85)" },

  // Data
  { type: "data.httpRequest", label: "HTTP Request", description: "Call any REST API", category: "DATA", color: "oklch(70% 0.15 200)", defaultConfig: { method: "GET" } },
  { type: "data.graphql", label: "GraphQL", description: "Execute GraphQL query", category: "DATA", color: "oklch(70% 0.15 200)" },

  // Code
  { type: "code.javascript", label: "JavaScript", description: "Run JS in sandbox", category: "CODE", color: "oklch(65% 0.15 180)", defaultConfig: { code: "// Your code here\nreturn { result: inputs };" } },
  { type: "code.python", label: "Python", description: "Run Python in sandbox", category: "CODE", color: "oklch(65% 0.15 180)", defaultConfig: { code: "# Your code here\nresult = inputs\nreturn {'result': result}" } },
  { type: "code.template", label: "Template", description: "Handlebars/Jinja template", category: "CODE", color: "oklch(65% 0.15 180)" },

  // Integrations
  { type: "integration.slack.sendMessage", label: "Slack: Send Message", description: "Send to Slack channel", category: "INTEGRATION", color: "oklch(65% 0.18 300)" },
  { type: "integration.github.createIssue", label: "GitHub: Create Issue", description: "Create GitHub issue", category: "INTEGRATION", color: "oklch(65% 0.18 300)" },
  { type: "integration.sendgrid.sendEmail", label: "SendGrid: Email", description: "Send transactional email", category: "INTEGRATION", color: "oklch(65% 0.18 300)" },
  { type: "integration.stripe.getCustomer", label: "Stripe: Get Customer", description: "Fetch Stripe customer", category: "INTEGRATION", color: "oklch(65% 0.18 300)" },
  { type: "integration.notion.createPage", label: "Notion: Create Page", description: "Create Notion page", category: "INTEGRATION", color: "oklch(65% 0.18 300)" },
  { type: "integration.airtable.createRecord", label: "Airtable: Create Record", description: "Create Airtable record", category: "INTEGRATION", color: "oklch(65% 0.18 300)" },
];

const CATEGORY_META = {
  TRIGGER: { label: "Triggers", icon: Zap, color: "oklch(72% 0.17 145)" },
  AI: { label: "AI / LLM", icon: Brain, color: "oklch(65% 0.18 240)" },
  LOGIC: { label: "Logic", icon: GitBranch, color: "oklch(80% 0.18 85)" },
  DATA: { label: "Data", icon: Database, color: "oklch(70% 0.15 200)" },
  CODE: { label: "Code", icon: Code2, color: "oklch(65% 0.15 180)" },
  INTEGRATION: { label: "Integrations", icon: Plug, color: "oklch(65% 0.18 300)" },
};

function NodeCard({ template, onAdd }: { template: NodeTemplate; onAdd: (t: NodeTemplate) => void }) {
  return (
    <button
      onClick={() => onAdd(template)}
      className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-bg-surface-2 text-left transition-colors group"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/flowforge-node", JSON.stringify(template));
        e.dataTransfer.effectAllowed = "copy";
      }}
    >
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${template.color}15`, border: `1px solid ${template.color}25` }}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: template.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium truncate">{template.label}</div>
        <div className="text-[10px] text-fg-muted truncate">{template.description}</div>
      </div>
    </button>
  );
}

export function NodeLibraryPanel() {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const addNode = useWorkflowStore((s) => s.addNode);

  const filtered = search
    ? NODE_TEMPLATES.filter(
        (t) =>
          t.label.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase()),
      )
    : NODE_TEMPLATES;

  const grouped = Object.entries(CATEGORY_META).map(([cat, meta]) => ({
    category: cat,
    ...meta,
    nodes: filtered.filter((t) => t.category === cat),
  }));

  function handleAdd(template: NodeTemplate) {
    addNode({
      id: generateId("node"),
      type: template.type,
      position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: {
        type: template.type,
        label: template.label,
        config: template.defaultConfig ?? {},
      },
    });
  }

  return (
    <div className="h-full flex flex-col bg-bg-surface-1">
      <div className="p-3 border-b border-border/60">
        <div className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">Nodes</div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fg-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes…"
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-border/60 bg-bg-surface-2 text-xs placeholder:text-fg-muted focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {grouped.map(({ category, label, icon: Icon, color, nodes }) => {
          if (nodes.length === 0) return null;
          const isCollapsed = collapsed.has(category);
          return (
            <div key={category}>
              <button
                onClick={() => setCollapsed((prev) => {
                  const next = new Set(prev);
                  next.has(category) ? next.delete(category) : next.add(category);
                  return next;
                })}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-bg-surface-2 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                <span className="text-xs font-semibold flex-1 text-left">{label}</span>
                <span className="text-[10px] text-fg-muted">{nodes.length}</span>
                <ChevronDown className={cn("w-3 h-3 text-fg-muted transition-transform", isCollapsed && "-rotate-90")} />
              </button>
              {!isCollapsed && (
                <div className="ml-1 space-y-0.5">
                  {nodes.map((t) => <NodeCard key={t.type} template={t} onAdd={handleAdd} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
