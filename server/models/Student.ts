import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const studentSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    classSectionId: { type: Schema.Types.ObjectId, ref: "ClassSection", required: true },
    name: { type: String, required: true, trim: true },
    admissionNumber: { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true },
);

studentSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, classSectionId: 1, name: 1 });

export type IStudent = InferSchemaType<typeof studentSchema> & { _id: mongoose.Types.ObjectId };
export type StudentDocument = Document & IStudent;
export const Student = mongoose.model<StudentDocument>("Student", studentSchema);