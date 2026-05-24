import mongoose, { Schema, Document } from "mongoose";

export interface IFix extends Document {
  issueId: mongoose.Types.ObjectId;
  patch: string;
  explanation: string;
  confidenceScore: number;
  accepted: boolean;
  prUrl?: string;
  createdAt: Date;
}

const FixSchema = new Schema<IFix>(
  {
    issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    patch: { type: String, required: true },
    explanation: { type: String, required: true },
    confidenceScore: { type: Number, required: true },
    accepted: { type: Boolean, default: false },
    prUrl: String,
  },
  { timestamps: true }
);

FixSchema.index({ issueId: 1 });

export const Fix = mongoose.model<IFix>("Fix", FixSchema);

