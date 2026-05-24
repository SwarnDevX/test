import { useState, useCallback } from "react";
import { api } from "../api/client";
import { useIssues, useMetrics, useWebSocket } from "../hooks/useData";
import ErrorFeed from "../components/ErrorFeed";
import { Send, TrendingUp, CheckCircle2, XCircle, Clock, Zap } from "lucide-react";

export default function Dashboard() {
  const { issues, loading, reload } = useIssues();
  const metrics = useMetrics();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", errorLogs: "", stackTrace: "", codeContext: "", filePath: "" });
  const [submitResult, setSubmitResult] = useState<string | null>(null);

  useWebSocket(useCallback((msg: any) => {
    if (msg.type === "issue_update") reload();
  }, [reload]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title && !form.errorLogs) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const { data } = await api.post("/ingest/error", form);
      setSubmitResult(`Issue created: ${data.issueId}`);
      setForm({ title: "", errorLogs: "", stackTrace: "", codeContext: "", filePath: "" });
      reload();
    } catch (err: any) {
      setSubmitResult(`Error: ${err.response?.data?.error || err.message}`);
    }
    setSubmitting(false);
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: "Total Issues", value: metrics.totalIssues, icon: Zap, color: "text-blue-400" },
            { label: "Resolved", value: metrics.resolved, icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Failed", value: metrics.failed, icon: XCircle, color: "text-red-400" },
            { label: "In Progress", value: metrics.inProgress, icon: Clock, color: "text-yellow-400" },
            { label: "Success Rate", value: `${metrics.successRate}%`, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Avg Confidence", value: `${metrics.avgConfidence}%`, icon: TrendingUp, color: "text-cyan-400" },
          ].map((m) => (
            <div key={m.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <m.icon size={14} className={m.color} />
                <p className="text-xs text-gray-500">{m.label}</p>
              </div>
              <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <h2 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <Send size={15} /> Submit Error for Analysis
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition"
              placeholder="Error title / summary"
              value={form.title}
              onChange={set("title")}
            />
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:border-emerald-500 focus:outline-none font-mono transition"
              placeholder="Error logs..."
              value={form.errorLogs}
              onChange={set("errorLogs")}
            />
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:border-emerald-500 focus:outline-none font-mono transition"
              placeholder="Stack trace..."
              value={form.stackTrace}
              onChange={set("stackTrace")}
            />
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:border-emerald-500 focus:outline-none font-mono transition"
              placeholder="Relevant code context..."
              value={form.codeContext}
              onChange={set("codeContext")}
            />
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition"
              placeholder="File path (optional, for PR creation)"
              value={form.filePath}
              onChange={set("filePath")}
            />
            <button
              type="submit"
              disabled={submitting || (!form.title && !form.errorLogs)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition"
            >
              {submitting ? "⏳ Processing..." : "🚀 Analyze & Self-Heal"}
            </button>
            {submitResult && (
              <p className={`text-xs ${submitResult.startsWith("Error") ? "text-red-400" : "text-emerald-400"}`}>
                {submitResult}
              </p>
            )}
          </form>
        </div>

        {/* Error Feed */}
        <div>
          <h2 className="text-sm font-bold text-gray-400 mb-3">Recent Issues</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : (
            <ErrorFeed issues={issues} />
          )}
        </div>
      </div>
    </div>
  );
}

