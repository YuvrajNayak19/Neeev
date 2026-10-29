import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const calendarDaySchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  date: { type: String, required: true },
  endDate: { type: String, default: null },
  type: { type: String, enum: ["WORKING", "WEEKLY_OFF", "PUBLIC_HOLIDAY", "SCHOOL_OFF", "HALF_DAY"], required: true },
  name: { type: String, trim: true, default: "" },
  source: { type: String, enum: ["IMPORTED", "ADMIN"], default: "ADMIN" },
  needsConfirmation: { type: Boolean, default: false },
  confirmedAt: { type: Date, default: null },
  halfDayPeriods: { type: Number, min: 1, max: 12, default: null },
  state: { type: String, default: "" },
}, { timestamps: true });

calendarDaySchema.index({ schoolId: 1, date: 1, endDate: 1 });
export type ICalendarDay = InferSchemaType<typeof calendarDaySchema> & { _id: mongoose.Types.ObjectId };
export type CalendarDayDocument = Document & ICalendarDay;
export const CalendarDay = mongoose.model<CalendarDayDocument>("CalendarDay", calendarDaySchema);
