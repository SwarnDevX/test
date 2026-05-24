import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { useWebSocket } from "../hooks/useData";
import AnalysisPanel from "../components/AnalysisPanel";
import CodeDiffViewer from "../components/CodeDiffViewer";
import FixExplanation from "../components/FixExplanation";
import AgentTimeline from "../components/AgentTimeline";
import { ArrowLeft, CheckCircle2, XCircle, GitPullRequest, Shield, FlaskConical } from "lucide-react";

export default function IssueDetail() {
  const { id } = useParams();
  const [issue, setIssue] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/issues/${id}`);
      setIssue(data.issue);
      setAgentLogs(data.agentLogs || []);
    } catch (err) {
      console.error("Failed to load issue", err);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useWebSocket(useCallback((msg: any) => {
    if (msg.issueId === id) load();
  }, [id, load]));

  if (loading) return <div className="text-center py-12 text-gray-500">Loading issue...</div>;
  if (!issue) return <div className="text-center py-12 text-red-400">Issue not found</div>;

  async function approve() {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/issues/${id}/approve`);
      if (data.prUrl) alert(`PR Created: ${data.prUrl}`);
      load();
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
    setActionLoading(false);
  }

  async function reject() {
    setActionLoading(true);
    await api.post(`/issues/${id}/reject`, { reason: "Rejected by human reviewer" });
    load();
    setActionLoading(false);
  }

  const canApprove = issue.status === "reviewing" && issue.humanApproved == null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 mb-2 transition">
            <ArrowLeft size={12} /> Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold">{issue.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-mono text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
              {issue.status}
            </span>
            <span className="text-xs text-gray-500">{new Date(issue.createdAt).toLocaleString()}</span>
            {issue.clusterId && <span className="text-xs text-gray-600 font-mono">Cluster: #{issue.clusterId.slice(0, 8)}</span>}
          </div>
        </div>
        {canApprove && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={approve} disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
              <CheckCircle2 size={15} /> Approve
            </button>
            <button onClick={reject} disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition">
              <XCircle size={15} /> Reject
            </button>
          </div>
        )}
      </div>

      {/* Error Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Error Logs</h3>
          <pre className="text-xs text-red-300 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
            {issue.errorLogs || "No error logs provided"}
          </pre>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-2">Stack Trace</h3>
          <pre className="text-xs text-yellow-300 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
            {issue.stackTrace || "No stack trace provided"}
          </pre>
        </div>
      </div>

      {/* AI Analysis */}
      <AnalysisPanel analysis={issue.analysis} />

      {/* Fix */}
      <FixExplanation fix={issue.fix} />

      {/* Code Diff */}
      {issue.fix?.patch && issue.codeContext && (
        <CodeDiffViewer original={issue.codeContext} patched={issue.fix.patch} />
      )}

      {/* Test Results */}
      {issue.testResults && (
        <div className={`bg-gray-900 border rounded-lg p-5 ${issue.testResults.passed ? "border-emerald-800/50" : "border-red-800/50"}`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${issue.testResults.passed ? "text-emerald-400" : "text-red-400"}`}>
            <FlaskConical size={16} />
            {issue.testResults.passed ? "Tests Passed" : "Tests Failed"}
            {issue.testResults.testCases?.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">({issue.testResults.testCases.length} test cases)</span>
            )}
          </h3>
          <pre className="text-xs text-gray-400 mt-3 max-h-48 overflow-auto whitespace-pre-wrap font-mono bg-gray-950 p-3 rounded">
            {issue.testResults.output}
          </pre>
        </div>
      )}

      {/* Review */}
      {issue.review && (
        <div className={`bg-gray-900 border rounded-lg p-5 ${issue.review.approved ? "border-emerald-800/50" : "border-red-800/50"}`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 ${issue.review.approved ? "text-emerald-400" : "text-red-400"}`}>
            <Shield size={16} />
            {issue.review.approved ? "Review: Approved" : "Review: Changes Requested"}
          </h3>
          <p className="text-sm text-gray-300 mt-3">{issue.review.comments}</p>
          {issue.review.securityIssues?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Security Issues</p>
              <ul className="space-y-1">
                {issue.review.securityIssues.map((s: string, i: number) => (
                  <li key={i} className="text-xs text-red-300 flex items-start gap-1.5">
                    <span className="text-red-500 mt-0.5">⚠</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Agent Timeline */}
      <AgentTimeline logs={issue.agentLogs || []} />
    </div>
  );
}

