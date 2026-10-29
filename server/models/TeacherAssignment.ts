import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const teacherAssignmentSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    classSectionId: { type: Schema.Types.ObjectId, ref: "ClassSection", required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    weeklyPeriodsNeeded: { type: Number, default: null, min: 1 },
    isForced: { type: Boolean, default: false },
  },
  { timestamps: true },
);

teacherAssignmentSchema.index({ schoolId: 1, classSectionId: 1, subjectId: 1 }, { unique: true });

export type ITeacherAssignment = InferSchemaType<typeof teacherAssignmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type TeacherAssignmentDocument = Document & ITeacherAssignment;

export const TeacherAssignment = mongoose.model<TeacherAssignmentDocument>(
  "TeacherAssignment",
  teacherAssignmentSchema,
);
