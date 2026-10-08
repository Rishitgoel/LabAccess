import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    eligibility: { type: String, required: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true, autoCreate: false, autoIndex: false },
);
export const Resource = mongoose.model("Resource", schema);
