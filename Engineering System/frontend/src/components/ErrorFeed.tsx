import { Link } from "react-router-dom";
import ConfidenceBadge from "./ConfidenceBadge";
import { AlertCircle, CheckCircle2, Loader2, XCircle, Search, Clock } from "lucide-react";

interface Issue {
  _id: string;
  title: string;
  status: string;
  createdAt: string;
  analysis?: { confidenceScore: number };
  clusterId?: string;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  open:      { icon: AlertCircle, color: "text-blue-400",    label: "Open" },
  analyzing: { icon: Loader2,     color: "text-yellow-400",  label: "Analyzing" },
  fixing:    { icon: Loader2,     color: "text-orange-400",  label: "Fixing" },
  testing:   { icon: Loader2,     color: "text-purple-400",  label: "Testing" },
  reviewing: { icon: Search,      color: "text-cyan-400",    label: "Reviewing" },
  resolved:  { icon: CheckCircle2,color: "text-emerald-400", label: "Resolved" },
  failed:    { icon: XCircle,     color: "text-red-400",     label: "Failed" },
};

export default function ErrorFeed({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
        <p>No issues yet. Submit an error to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.map((issue) => {
        const cfg = statusConfig[issue.status] || statusConfig.open;
        const Icon = cfg.icon;
        const isActive = ["analyzing", "fixing", "testing"].includes(issue.status);

        return (
          <Link
            key={issue._id}
            to={`/issue/${issue._id}`}
            className="block bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 hover:bg-gray-900/80 transition-all"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Icon size={18} className={`${cfg.color} mt-0.5 flex-shrink-0 ${isActive ? "animate-spin" : ""}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono uppercase ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <h3 className="text-sm font-medium mt-1 truncate">{issue.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={11} /> {new Date(issue.createdAt).toLocaleString()}
                    </span>
                    {issue.clusterId && (
                      <span className="text-xs text-gray-600 font-mono">#{issue.clusterId.slice(0, 8)}</span>
                    )}
                  </div>
                </div>
              </div>
              {issue.analysis?.confidenceScore != null && (
                <ConfidenceBadge score={issue.analysis.confidenceScore} />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

