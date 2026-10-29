import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const complaintSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  studentId: { type: Schema.Types.ObjectId, ref: "Student", default: null },
  classSectionId: { type: Schema.Types.ObjectId, ref: "ClassSection", required: true },
  category: { type: String, enum: ["HYGIENE", "FACILITIES", "TIMETABLE", "ACADEMICS", "BULLYING", "HARASSMENT", "SAFETY", "TEACHER_CONDUCT"], required: true },
  serious: { type: Boolean, required: true },
  anonymous: { type: Boolean, default: false },
  place: { type: String, trim: true, maxlength: 120, default: "" },
  message: { type: String, trim: true, required: true, maxlength: 4000 },
  status: { type: String, enum: ["OPEN", "SEEN", "RESOLVED"], default: "OPEN" },
  resolutionNote: { type: String, trim: true, maxlength: 1000, default: "" },
}, { timestamps: true });

complaintSchema.index({ schoolId: 1, serious: 1, status: 1 });
complaintSchema.index({ schoolId: 1, studentId: 1, createdAt: -1 });
export type IComplaint = InferSchemaType<typeof complaintSchema> & { _id: mongoose.Types.ObjectId };
export type ComplaintDocument = Document & IComplaint;
export const Complaint = mongoose.model<ComplaintDocument>("Complaint", complaintSchema);
