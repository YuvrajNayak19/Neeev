import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

/** A school notice posted by the office for staff, students or everyone. */
const noticeSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, trim: true, maxlength: 1000, default: "" },
    audience: { type: String, enum: ["ALL", "STAFF", "STUDENTS"], default: "ALL" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

noticeSchema.index({ schoolId: 1, createdAt: -1 });

export type INotice = InferSchemaType<typeof noticeSchema> & { _id: mongoose.Types.ObjectId };
export type NoticeDocument = Document & INotice;
export const Notice = mongoose.model<NoticeDocument>("Notice", noticeSchema);
