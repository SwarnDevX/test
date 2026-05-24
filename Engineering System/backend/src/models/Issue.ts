import mongoose, { Schema, Document } from "mongoose";

export interface IIssue extends Document {
  title: string;
  status: "open" | "analyzing" | "fixing" | "testing" | "reviewing" | "resolved" | "failed";
  errorLogs: string;
  stackTrace: string;
  codeContext: string;
  repoUrl?: string;
  filePath?: string;
  clusterId?: string;
  analysis?: {
    rootCause: string;
    explanation: string;
    confidenceScore: number;
  };
  fix?: {
    patch: string;
    explanation: string;
    alternatives: string[];
  };
  testResults?: {
    passed: boolean;
    output: string;
    testCases: string[];
  };
  review?: {
    approved: boolean;
    comments: string;
    securityIssues: string[];
  };
  agentLogs: Array<{
    agent: string;
    action: string;
    timestamp: Date;
    data: any;
  }>;
  humanApproved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const IssueSchema = new Schema<IIssue>(
  {
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "analyzing", "fixing", "testing", "reviewing", "resolved", "failed"],
      default: "open",
    },
    errorLogs: { type: String, default: "" },
    stackTrace: { type: String, default: "" },
    codeContext: { type: String, default: "" },
    repoUrl: String,
    filePath: String,
    clusterId: String,
    analysis: {
      rootCause: String,
      explanation: String,
      confidenceScore: Number,
    },
    fix: {
      patch: String,
      explanation: String,
      alternatives: [String],
    },
    testResults: {
      passed: Boolean,
      output: String,
      testCases: [String],
    },
    review: {
      approved: Boolean,
      comments: String,
      securityIssues: [String],
    },
    agentLogs: [
      {
        agent: String,
        action: String,
        timestamp: { type: Date, default: Date.now },
        data: Schema.Types.Mixed,
      },
    ],
    humanApproved: Boolean,
  },
  { timestamps: true }
);

IssueSchema.index({ status: 1, createdAt: -1 });
IssueSchema.index({ clusterId: 1 });

export const Issue = mongoose.model<IIssue>("Issue", IssueSchema);

