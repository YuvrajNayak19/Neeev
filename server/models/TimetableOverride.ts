import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const timetableOverrideSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  date: { type: String, required: true },
  classSectionId: { type: Schema.Types.ObjectId, ref: "ClassSection", required: true },
  periodNumber: { type: Number, required: true, min: 1, max: 12 },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", default: null },
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
  requestId: { type: Schema.Types.ObjectId, ref: "Request", default: null },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

timetableOverrideSchema.index({ schoolId: 1, date: 1, classSectionId: 1, periodNumber: 1 }, { unique: true });
export type ITimetableOverride = InferSchemaType<typeof timetableOverrideSchema> & { _id: mongoose.Types.ObjectId };
export type TimetableOverrideDocument = Document & ITimetableOverride;
export const TimetableOverride = mongoose.model<TimetableOverrideDocument>("TimetableOverride", timetableOverrideSchema);
