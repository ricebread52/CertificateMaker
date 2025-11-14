import { Schema, model } from "mongoose";

const TemplateSchema = new Schema({
  userId: { type: String, required: false },
  name: { type: String, required: true },
  canvas: { type: Schema.Types.Mixed }, // store layout JSON
  assets: { type: Schema.Types.Mixed }, // logos, backgrounds
  placeholders: [String],
  defaultStyles: Schema.Types.Mixed,
}, { timestamps: true });

export default model("Template", TemplateSchema);
