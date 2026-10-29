import type { Document, InferSchemaType } from "mongoose";
import mongoose, { Schema } from "mongoose";

const notificationSchema = new Schema({
  schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 1000 },
  link: { type: String, default: "" },
  readAt: { type: Date, default: null },
}, { timestamps: true });

notificationSchema.index({ schoolId: 1, userId: 1, readAt: 1, createdAt: -1 });
export type INotification = InferSchemaType<typeof notificationSchema> & { _id: mongoose.Types.ObjectId };
export type NotificationDocument = Document & INotification;
export const Notification = mongoose.model<NotificationDocument>("Notification", notificationSchema);
