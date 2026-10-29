import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

export const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

const masterTimetableSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classSectionId: { type: Schema.Types.ObjectId, ref: "ClassSection", required: true },
    dayOfWeek: { type: String, enum: WEEK_DAYS, required: true },
    periodNumber: { type: Number, required: true, min: 1, max: 12 },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    isLocked: { type: Boolean, default: false },
    isForced: { type: Boolean, default: false },
    isElectiveGroup: { type: Boolean, default: false },
    electiveGroupId: { type: Schema.Types.ObjectId, ref: "ElectiveGroup", default: null },
  },
  { timestamps: true },
);

masterTimetableSchema.index({ schoolId: 1, classSectionId: 1, dayOfWeek: 1, periodNumber: 1 }, { unique: true });
masterTimetableSchema.index({ schoolId: 1, teacherId: 1, dayOfWeek: 1, periodNumber: 1 });

export type IMasterTimetable = InferSchemaType<typeof masterTimetableSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type MasterTimetableDocument = Document & IMasterTimetable;

export const MasterTimetable = mongoose.model<MasterTimetableDocument>("MasterTimetable", masterTimetableSchema);
