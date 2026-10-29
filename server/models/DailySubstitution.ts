import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

export const DAILY_SUBSTITUTION_STATUS = ["DRAFT", "PUBLISHED", "ASSIGNED", "UNASSIGNED"] as const;

const dailySubstitutionSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    periodNumber: { type: Number, required: true, min: 1, max: 12 },
    classSectionId: { type: Schema.Types.ObjectId, ref: "ClassSection", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    absentTeacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    substituteTeacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
    status: { type: String, enum: DAILY_SUBSTITUTION_STATUS, default: "DRAFT" },
    matchTier: { type: Number, default: 0 },
    reason: { type: String, default: "" },
    acknowledgedAt: { type: Date, default: null },
    isManualOverride: { type: Boolean, default: false },
  },
  { timestamps: true },
);

dailySubstitutionSchema.index({ schoolId: 1, date: 1, classSectionId: 1, periodNumber: 1 }, { unique: true });

export type IDailySubstitution = InferSchemaType<typeof dailySubstitutionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type DailySubstitutionDocument = Document & IDailySubstitution;

export const DailySubstitution = mongoose.model<DailySubstitutionDocument>(
  "DailySubstitution",
  dailySubstitutionSchema,
);
