import mongoose, { Schema, Document } from "mongoose";

export interface IAgentLog extends Document {
  issueId: mongoose.Types.ObjectId;
  agent: string;
  action: string;
  input: any;
  output: any;
  durationMs: number;
  createdAt: Date;
}

const AgentLogSchema = new Schema<IAgentLog>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    agent: { type: String, required: true },
    action: { type: String, required: true },
    input: Schema.Types.Mixed,
    output: Schema.Types.Mixed,
    durationMs: Number,
  },
  { timestamps: true }
);

AgentLogSchema.index({ issueId: 1, createdAt: 1 });

export const AgentLog = mongoose.model<IAgentLog>("AgentLog", AgentLogSchema);

