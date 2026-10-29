import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const classSectionSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    grade: { type: Number, required: true, min: 6, max: 12 },
    section: { type: String, required: true, trim: true },
    stream: { type: String, enum: ["Science", "Commerce", "Humanities", null], trim: true, default: null },
    roomNumber: { type: String, default: "" },
    classTeacherId: { type: Schema.Types.ObjectId, ref: "Teacher", default: null },
  },
  { timestamps: true },
);

classSectionSchema.index({ schoolId: 1, grade: 1, section: 1 }, { unique: true });

export type IClassSection = InferSchemaType<typeof classSectionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ClassSectionDocument = Document & IClassSection;

export const ClassSection = mongoose.model<ClassSectionDocument>("ClassSection", classSectionSchema);
