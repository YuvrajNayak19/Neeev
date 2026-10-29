import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const timetableSlotSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  versionId: { type: Schema.Types.ObjectId, ref: "TimetableVersion", required: true },
  classSectionId: { type: Schema.Types.ObjectId, ref: "ClassSection", required: true },
  dayOfWeek: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], required: true },
  periodNumber: { type: Number, required: true, min: 1, max: 12 },
  subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
  teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  isLocked: { type: Boolean, default: false },
  isForced: { type: Boolean, default: false },
  warning: { type: String, default: "" },
  room: { type: String, default: "" },
}, { timestamps: true });

timetableSlotSchema.index({ schoolId: 1, versionId: 1, classSectionId: 1, dayOfWeek: 1, periodNumber: 1 }, { unique: true });
timetableSlotSchema.index({ schoolId: 1, versionId: 1, teacherId: 1, dayOfWeek: 1, periodNumber: 1 });
export type ITimetableSlot = InferSchemaType<typeof timetableSlotSchema> & { _id: mongoose.Types.ObjectId };
export type TimetableSlotDocument = Document & ITimetableSlot;
export const TimetableSlot = mongoose.model<TimetableSlotDocument>("TimetableSlot", timetableSlotSchema);