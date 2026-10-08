import mongoose from "mongoose";
export const statuses = ["pending", "approved", "rejected", "cancelled"];
const eventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["submit", "cancel", "resubmit", "approve", "reject"],
      required: true,
    },
    fromStatus: { type: String, enum: [null, ...statuses], default: null },
    toStatus: { type: String, enum: statuses, required: true },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, required: true },
    at: { type: Date, required: true },
  },
  { _id: false },
);
const schema = new mongoose.Schema(
  {
    learnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: true,
      immutable: true,
    },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: statuses,
      required: true,
      default: "pending",
    },
    submittedAt: { type: Date, required: true },
    decisionReason: { type: String, default: null },
    revision: { type: Number, min: 0, required: true, default: 0 },
    history: { type: [eventSchema], required: true },
  },
  { timestamps: true, autoCreate: false, autoIndex: false },
);
schema.index({ learnerId: 1, resourceId: 1 }, { unique: true });
schema.index({ status: 1, submittedAt: 1, _id: 1 });
schema.index({ learnerId: 1, submittedAt: -1, _id: -1 });
schema.index({ learnerId: 1, status: 1, submittedAt: -1, _id: -1 });
export const AccessRequest = mongoose.model("AccessRequest", schema);
