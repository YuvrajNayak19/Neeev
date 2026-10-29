import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

export const TEACHER_QUALIFICATION_CATEGORIES = ["PRT", "TGT", "PGT"] as const;

const teacherSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: undefined },
    qualificationCategory: { type: String, enum: TEACHER_QUALIFICATION_CATEGORIES, required: true },
    primarySubjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    maxPeriodsPerDay: { type: Number, default: 6, min: 1, max: 10 },
    maxPeriodsPerWeek: { type: Number, default: 30, min: 1, max: 60 },
  },
  { timestamps: true },
);

teacherSchema.index({ schoolId: 1, name: 1 });
teacherSchema.index({ schoolId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });

export type ITeacher = InferSchemaType<typeof teacherSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type TeacherDocument = Document & ITeacher;

export const Teacher = mongoose.model<TeacherDocument>("Teacher", teacherSchema);
