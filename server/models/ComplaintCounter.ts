import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const complaintCounterSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
  day: { type: String, required: true },
  count: { type: Number, default: 0, min: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

complaintCounterSchema.index({ schoolId: 1, studentId: 1, day: 1 }, { unique: true });
export type IComplaintCounter = InferSchemaType<typeof complaintCounterSchema> & { _id: mongoose.Types.ObjectId };
export type ComplaintCounterDocument = Document & IComplaintCounter;
export const ComplaintCounter = mongoose.model<ComplaintCounterDocument>("ComplaintCounter", complaintCounterSchema);
