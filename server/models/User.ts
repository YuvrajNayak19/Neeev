import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

export const USER_ROLES = ["SUPER_ADMIN", "SCHOOL_ADMIN", "TEACHER", "STUDENT"] as const;
export const USER_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;

const userSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    email: { type: String, lowercase: true, trim: true, default: undefined },
    admissionNumber: { type: String, trim: true, uppercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, required: true },
    status: { type: String, enum: USER_STATUSES, default: "ACTIVE", required: true },
    mustChangePassword: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },
    profile: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
  },
  { timestamps: true },
);

userSchema.index({ schoolId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } } });
userSchema.index({ schoolId: 1, admissionNumber: 1 }, { unique: true, partialFilterExpression: { admissionNumber: { $type: "string" } } });

export type IUser = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type UserDocument = Document & IUser;

export const User = mongoose.model<UserDocument>("User", userSchema);
