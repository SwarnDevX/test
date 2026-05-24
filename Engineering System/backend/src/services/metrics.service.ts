import { Metric } from "../models/Metric.js";
import { Issue } from "../models/Issue.js";

export async function getMetricsSummary() {
  const [totalIssues, resolved, failed, open] = await Promise.all([
    Issue.countDocuments(),
    Issue.countDocuments({ status: "resolved" }),
    Issue.countDocuments({ status: "failed" }),
    Issue.countDocuments({ status: "open" }),
  ]);

  const avgResolution = await Metric.aggregate([
    { $match: { type: "time_to_resolution" } },
    { $group: { _id: null, avg: { $avg: "$value" }, min: { $min: "$value" }, max: { $max: "$value" } } },
  ]);

  const avgConfidence = await Metric.aggregate([
    { $match: { type: "confidence" } },
    { $group: { _id: null, avg: { $avg: "$value" } } },
  ]);

  const recentMetrics = await Metric.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return {
    totalIssues,
    resolved,
    failed,
    open,
    inProgress: totalIssues - resolved - failed - open,
    successRate: totalIssues > 0 ? Math.round((resolved / totalIssues) * 100 * 10) / 10 : 0,
    avgResolutionMs: avgResolution[0]?.avg || 0,
    minResolutionMs: avgResolution[0]?.min || 0,
    maxResolutionMs: avgResolution[0]?.max || 0,
    avgConfidence: Math.round((avgConfidence[0]?.avg || 0) * 10) / 10,
    recentMetrics,
  };
}

export async function recordFeedback(issueId: string, accepted: boolean) {
  await Metric.create({
    type: "feedback",
    issueId,
    value: accepted ? 1 : 0,
    metadata: { timestamp: new Date() },
  });
}

