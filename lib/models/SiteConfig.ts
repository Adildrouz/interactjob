import mongoose, { Schema } from "mongoose";

const SiteConfigSchema = new Schema({
  key:       { type: String, required: true, unique: true, index: true },
  value:     { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const SiteConfig =
  mongoose.models.SiteConfig ||
  mongoose.model("SiteConfig", SiteConfigSchema);
