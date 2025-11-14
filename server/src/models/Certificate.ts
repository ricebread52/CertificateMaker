import { Schema, model } from "mongoose";

const CertificateSchema = new Schema({
  certSerial: { type: String, required: true, unique: true },
  templateId: { type: String },
  issuedTo: {
    name: { type: String, required: true },
    email: { type: String, default: "" }
  },
  dataMap: { type: Schema.Types.Mixed },
  pdfPath: { type: String },
  verificationUrl: { type: String },
}, { timestamps: true });

export default model("Certificate", CertificateSchema);
