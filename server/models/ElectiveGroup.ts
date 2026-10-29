import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const electiveTeacherPairSchema = new Schema(
  {
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  },
  { _id: true },
);

const electiveGroupSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    name: { type: String, required: true, trim: true },
    grade: { type: Number, required: true, min: 6, max: 12 },
    participatingClassSectionIds: [{ type: Schema.Types.ObjectId, ref: "ClassSection" }],
    subjectTeacherPairs: { type: [electiveTeacherPairSchema], default: [] },
  },
  { timestamps: true },
);

export type IElectiveGroup = InferSchemaType<typeof electiveGroupSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ElectiveGroupDocument = Document & IElectiveGroup;

export const ElectiveGroup = mongoose.model<ElectiveGroupDocument>("ElectiveGroup", electiveGroupSchema);
