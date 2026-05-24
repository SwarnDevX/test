interface LogEntry {
  agent: string;
  action: string;
  timestamp: string;
  data?: any;
}

const agentConfig: Record<string, { icon: string; color: string }> = {
  planner:      { icon: "🧩", color: "border-blue-500/30" },
  debug:        { icon: "🔍", color: "border-yellow-500/30" },
  fix:          { icon: "🛠️", color: "border-orange-500/30" },
  test:         { icon: "✅", color: "border-purple-500/30" },
  reviewer:     { icon: "🧑‍⚖️", color: "border-cyan-500/30" },
  guardrails:   { icon: "🛡️", color: "border-red-500/30" },
  orchestrator: { icon: "⚙️", color: "border-gray-500/30" },
  human:        { icon: "👤", color: "border-emerald-500/30" },
};

export default function AgentTimeline({ logs }: { logs: LogEntry[] }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
        📊 Agent Timeline ({logs.length} actions)
      </h3>
      <div className="space-y-2">
        {logs.map((log, i) => {
          const cfg = agentConfig[log.agent] || { icon: "🤖", color: "border-gray-500/30" };
          return (
            <div key={i} className={`flex items-start gap-3 bg-gray-900 border-l-2 ${cfg.color} rounded-r-lg p-3`}>
              <span className="text-lg flex-shrink-0">{cfg.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-300">
                    {log.agent}<span className="text-gray-600">.</span>{log.action}
                  </span>
                  <span className="text-xs text-gray-600 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {log.data && (
                  <pre className="text-xs text-gray-500 mt-1 max-h-20 overflow-y-auto whitespace-pre-wrap">
                    {typeof log.data === "string" ? log.data : JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

