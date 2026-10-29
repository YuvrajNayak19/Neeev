import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

export const SCHOOL_PERIODS_PER_DAY = 8;
export const SCHOOL_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;

const timingSlotSchema = new Schema(
  {
    periodNumber: { type: Number, required: true, min: 1 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isBreak: { type: Boolean, default: false },
  },
  { _id: true },
);

const schoolSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    academicYear: { type: String, required: true },
    board: { type: String, enum: ["CBSE", "ICSE", "State", "Other"], default: "Other" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    email: { type: String, lowercase: true, trim: true, default: "" },
    phone: { type: String, default: "" },
    status: { type: String, enum: SCHOOL_STATUSES, default: "PENDING", required: true },
    settings: {
      workingDays: { type: [Number], default: [1, 2, 3, 4, 5, 6] },
      alternateSaturdayOff: { type: Boolean, default: false },
      mode: { type: String, enum: ["AUTO", "FIXED"], default: "AUTO" },
      lunchAfterPeriod: { type: Number, default: 4 },
    },
    classRange: { type: [Number], default: [6, 12], validate: (value: number[]) => value.length === 2 },
    periodsPerDay: { type: Number, default: SCHOOL_PERIODS_PER_DAY, min: 1, max: 12 },
    timingSlots: { type: [timingSlotSchema], default: [] },
  },
  { timestamps: true },
);

schoolSchema.index({ status: 1, name: 1, city: 1, state: 1 });

export type ISchool = InferSchemaType<typeof schoolSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type SchoolDocument = Document & ISchool;

export const School = mongoose.model<SchoolDocument>("School", schoolSchema);
