import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

export const SUBJECT_CATEGORY_REQUIRED = ["PRT", "TGT", "PGT"] as const;

const subjectSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    categoryRequired: { type: String, enum: SUBJECT_CATEGORY_REQUIRED, required: true },
    isElective: { type: Boolean, default: false },
    requiresFacility: { type: String, default: null },
    weeklyPeriods: { type: Number, default: 4, min: 1, max: 48 },
    grades: [{ type: Number, min: 6, max: 12 }],
    streams: [{ type: String, trim: true }],
    minPerDay: { type: Number, default: 0, min: 0, max: 8 },
    maxPerDay: { type: Number, default: 2 },
    maxDaysPerWeek: { type: Number, default: 6, min: 1, max: 6 },
    priority: { type: Number, default: 3 },
    isLabDoublePeriod: { type: Boolean, default: false },
  },
  { timestamps: true },
);

subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export type ISubject = InferSchemaType<typeof subjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type SubjectDocument = Document & ISubject;

export const Subject = mongoose.model<SubjectDocument>("Subject", subjectSchema);
