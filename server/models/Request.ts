import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["PERIOD_SWAP", "COMBINED_CLASS", "CONSECUTIVE_PERIODS", "EXTRA_PERIOD", "LEAVE_NOTICE"], required: true },
  status: { type: String, enum: ["PENDING_COUNTERPART", "PENDING_ADMIN", "APPROVED", "REJECTED"], default: "PENDING_ADMIN", required: true },
  date: { type: String, required: true },
  counterpartId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  counterpartAcceptedAt: { type: Date, default: null },
  payload: { type: Schema.Types.Mixed, required: true },
  impact: { type: [String], default: [] },
  decisionNote: { type: String, default: "" },
  decidedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

requestSchema.index({ schoolId: 1, status: 1, date: 1 });
requestSchema.index({ schoolId: 1, requesterId: 1, createdAt: -1 });
export type IRequest = InferSchemaType<typeof requestSchema> & { _id: mongoose.Types.ObjectId };
export type RequestDocument = Document & IRequest;
export const RequestModel = mongoose.model<RequestDocument>("Request", requestSchema);
