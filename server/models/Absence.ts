import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const absenceSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    isFullDay: { type: Boolean, default: false },
    affectedPeriods: [{ type: Number, min: 1, max: 12 }],
    reason: { type: String, default: "" },
  },
  { timestamps: true },
);

absenceSchema.index({ schoolId: 1, teacherId: 1, date: 1 }, { unique: true });

export type IAbsence = InferSchemaType<typeof absenceSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type AbsenceDocument = Document & IAbsence;

export const Absence = mongoose.model<AbsenceDocument>("Absence", absenceSchema);
