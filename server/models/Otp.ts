import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, enum: ["REGISTER_SCHOOL", "REGISTER_TEACHER", "REGISTER_STUDENT", "RESET_PASSWORD"], required: true },
    codeHash: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    attempts: { type: Number, default: 0, min: 0, max: 5 },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true },
);

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export type IOtp = InferSchemaType<typeof otpSchema> & { _id: mongoose.Types.ObjectId };
export type OtpDocument = Document & IOtp;
export const Otp = mongoose.model<OtpDocument>("Otp", otpSchema);