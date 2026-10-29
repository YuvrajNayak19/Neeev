import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const timetableVersionSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  versionNumber: { type: Number, required: true },
  status: { type: String, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], default: "DRAFT", required: true },
  source: { type: String, enum: ["GENERATED", "IMPORTED"], required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

timetableVersionSchema.index({ schoolId:  1, versionNumber: 1 }, { unique: true });
timetableVersionSchema.index({ schoolId: 1, status: 1 });

export type ITimetableVersion = InferSchemaType<typeof timetableVersionSchema> & { _id: mongoose.Types.ObjectId };
export type TimetableVersionDocument = Document & ITimetableVersion;
export const TimetableVersion = mongoose.model<TimetableVersionDocument>("TimetableVersion", timetableVersionSchema);
