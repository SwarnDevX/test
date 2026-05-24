import mongoose, { Schema, Document } from "mongoose";

export interface IMetric extends Document {
  type: "fix_success" | "fix_failure" | "time_to_resolution" | "confidence" | "feedback";
  issueId?: mongoose.Types.ObjectId;
  value: number;
  metadata?: any;
  createdAt: Date;
}

const MetricSchema = new Schema<IMetric>(
  {
    type: { type: String, required: true, index: true },
    issueId: { type: Schema.Types.ObjectId, ref: "Issue" },
    value: { type: Number, required: true },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

export const Metric = mongoose.model<IMetric>("Metric", MetricSchema);

